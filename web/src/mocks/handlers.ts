import { delay, http, HttpResponse } from "msw";
import { get as idbGet, set as idbSet } from "idb-keyval";
import type { Attempt, CheckResult, Profile, SectionPatch, VocabCard } from "@/api/schemas";
import { uid } from "@/lib/utils";
import { createAttempt } from "./attempts";
import { db, persist, resetDb } from "./db";
import { buildDashboard, buildPractice, buildProgress, summary, vocabSummary } from "./derive";
import { buildResult, markItem } from "./scoring";
import { ALL_TESTS, getTest, stripAnswers, summarise } from "./tests";

/*
 * Mock API. Every route here is one Arash builds for real; docs/handoff/api.md
 * lists them. Delays imitate a network so loading states are visible.
 */

const LATENCY = 180;
const unauthorised = () => HttpResponse.json({ error: "Not signed in" }, { status: 401 });
const notFound = (what: string) => HttpResponse.json({ error: `${what} not found` }, { status: 404 });

function signedIn() {
  return db().signedIn;
}

function findItem(testId: string, itemId: string) {
  const test = getTest(testId);
  for (const s of test?.sections ?? [])
    for (const p of s.parts)
      for (const g of p.groups)
        for (const i of g.items) if (i.id === itemId) return { group: g, item: i };
  return null;
}

const COACH_REPLIES = [
  "Thanks, I have it. I will mark it against the four criteria and reply with notes on each paragraph.",
  "Good question. Keep each body paragraph to one idea and test it with a specific example.",
  "I have added comments on your grammar slips. Focus on tense consistency in long sentences.",
];

export const handlers = [
  /* ---------------- auth and profile ---------------- */

  http.post("/api/auth/sign-in", async () => {
    await delay(LATENCY * 2);
    const d = db();
    d.signedIn = true;
    persist();
    return HttpResponse.json(d.profile);
  }),

  http.post("/api/auth/sign-up", async ({ request }) => {
    await delay(LATENCY * 2);
    const body = (await request.json()) as { name: string; email: string };
    const d = db();
    d.signedIn = true;
    d.profile = { ...d.profile, id: uid("user"), name: body.name || d.profile.name, email: body.email || d.profile.email, onboarded: false };
    persist();
    return HttpResponse.json(d.profile);
  }),

  http.post("/api/auth/sign-out", async () => {
    const d = db();
    d.signedIn = false;
    persist();
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/auth/forgot", async () => {
    await delay(LATENCY * 2);
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/me", async () => {
    await delay(LATENCY / 2);
    if (!signedIn()) return unauthorised();
    return HttpResponse.json(db().profile);
  }),

  http.patch("/api/me", async ({ request }) => {
    if (!signedIn()) return unauthorised();
    const patch = (await request.json()) as Partial<Profile>;
    const d = db();
    d.profile = { ...d.profile, ...patch, targets: { ...d.profile.targets, ...(patch.targets ?? {}) } };
    persist();
    return HttpResponse.json(d.profile);
  }),

  /* ---------------- dashboard, progress, practice ---------------- */

  http.get("/api/dashboard", async () => {
    await delay(LATENCY);
    if (!signedIn()) return unauthorised();
    return HttpResponse.json(buildDashboard(db()));
  }),

  http.get("/api/progress", async () => {
    await delay(LATENCY);
    if (!signedIn()) return unauthorised();
    return HttpResponse.json(buildProgress(db()));
  }),

  http.get("/api/practice", async () => {
    await delay(LATENCY);
    return HttpResponse.json(buildPractice(db()));
  }),

  /* ---------------- tests ---------------- */

  http.get("/api/tests", async ({ request }) => {
    await delay(LATENCY);
    const kind = new URL(request.url).searchParams.get("kind");
    return HttpResponse.json(ALL_TESTS.filter((t) => !kind || t.kind === kind).map(summarise));
  }),

  http.get("/api/tests/:id", async ({ params }) => {
    await delay(LATENCY);
    const test = getTest(String(params.id));
    if (!test) return notFound("Test");
    return HttpResponse.json(stripAnswers(test));
  }),

  /* ---------------- attempts ---------------- */

  http.get("/api/attempts", async ({ request }) => {
    await delay(LATENCY);
    const status = new URL(request.url).searchParams.get("status");
    const list = Object.values(db().attempts)
      .filter((a) => !status || a.status === status)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return HttpResponse.json(list);
  }),

  http.post("/api/attempts", async ({ request }) => {
    await delay(LATENCY);
    const { testId, mode } = (await request.json()) as { testId: string; mode: Attempt["mode"] };
    const test = getTest(testId);
    if (!test) return notFound("Test");
    const d = db();
    const attempt = createAttempt(test, mode, d.profile.accommodation);
    d.attempts[attempt.id] = attempt;
    persist();
    return HttpResponse.json(attempt, { status: 201 });
  }),

  http.get("/api/attempts/:id", async ({ params }) => {
    await delay(LATENCY / 2);
    const attempt = db().attempts[String(params.id)];
    return attempt ? HttpResponse.json(attempt) : notFound("Attempt");
  }),

  http.delete("/api/attempts/:id", async ({ params }) => {
    const d = db();
    delete d.attempts[String(params.id)];
    persist();
    return HttpResponse.json({ ok: true });
  }),

  /** Autosave: any subset of one section's state. */
  http.patch("/api/attempts/:id/state", async ({ params, request }) => {
    const d = db();
    const attempt = d.attempts[String(params.id)];
    if (!attempt) return notFound("Attempt");
    const patch = (await request.json()) as SectionPatch;
    attempt.sections = attempt.sections.map((s) => {
      if (s.sectionId !== patch.sectionId || s.status === "submitted") return s;
      const next = { ...s, ...patch };
      if (s.status === "not-started" && patch.status !== "not-started") {
        next.status = "in-progress";
        next.startedAt = next.startedAt ?? new Date().toISOString();
      }
      return next;
    });
    persist();
    return HttpResponse.json({ ok: true, savedAt: new Date().toISOString() });
  }),

  http.post("/api/attempts/:id/check", async ({ params, request }) => {
    await delay(LATENCY);
    const attempt = db().attempts[String(params.id)];
    if (!attempt) return notFound("Attempt");
    if (attempt.mode !== "practice") return HttpResponse.json({ error: "Only in practice mode" }, { status: 403 });
    const { itemId, value } = (await request.json()) as { itemId: string; value: string | string[] };
    const found = findItem(attempt.testId, itemId);
    if (!found) return notFound("Item");
    const res: CheckResult = {
      itemId,
      correct: markItem(found.group, found.item, value) === found.item.numbers.length,
      answer: found.item.answer,
      explanation: found.item.explanation,
      trap: found.item.trap,
      evidence: found.item.evidence,
    };
    return HttpResponse.json(res);
  }),

  http.post("/api/attempts/:id/sections/:sectionId/submit", async ({ params }) => {
    await delay(LATENCY * 2);
    const d = db();
    const attempt = d.attempts[String(params.id)];
    const test = attempt && getTest(attempt.testId);
    if (!attempt || !test) return notFound("Attempt");
    const now = new Date().toISOString();
    attempt.sections = attempt.sections.map((s) =>
      s.sectionId === params.sectionId ? { ...s, status: "submitted", submittedAt: now, startedAt: s.startedAt ?? now } : s,
    );
    attempt.sectionIndex = Math.min(test.sections.length, attempt.sectionIndex + 1);
    let resultReady = false;
    if (attempt.sections.every((s) => s.status === "submitted")) {
      attempt.status = "submitted";
      attempt.submittedAt = now;
      d.results[attempt.id] = buildResult(test, attempt, now);
      d.notifications.unshift({
        id: uid("n"),
        title: { en: "Your results are ready", fa: "نتیجهٔ شما آماده است" },
        body: { en: `${test.title} has been scored.`, fa: `«${test.title}» نمره‌دهی شد.` },
        at: now,
        read: false,
        href: `/app/results/${attempt.id}`,
      });
      resultReady = true;
    }
    persist();
    return HttpResponse.json({ attempt, resultReady });
  }),

  /** Speaking recordings: the prototype keeps the audio in IndexedDB in this browser. */
  http.post("/api/attempts/:id/speaking/:partId/recording", async ({ params, request }) => {
    const form = await request.formData();
    const file = form.get("audio");
    const durationSec = Number(form.get("durationSec") ?? 0);
    if (!(file instanceof Blob)) return HttpResponse.json({ error: "No audio" }, { status: 400 });
    const key = `rec-${params.id}-${params.partId}-${Date.now()}`;
    await idbSet(key, file);
    const d = db();
    const attempt = d.attempts[String(params.id)];
    if (attempt) {
      const state = attempt.sections[attempt.sectionIndex];
      if (state) state.recordings = { ...state.recordings, [String(params.partId)]: { key, durationSec } };
      persist();
    }
    return HttpResponse.json({ key, durationSec });
  }),

  http.get("/api/recordings/:key", async ({ params }) => {
    const blob = await idbGet<Blob>(String(params.key));
    if (!blob) return notFound("Recording");
    return new HttpResponse(blob, { headers: { "Content-Type": blob.type || "audio/webm" } });
  }),

  /* ---------------- results ---------------- */

  http.get("/api/results", async () => {
    await delay(LATENCY);
    if (!signedIn()) return unauthorised();
    const list = Object.values(db().results)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .map(summary);
    return HttpResponse.json(list);
  }),

  http.get("/api/results/:attemptId", async ({ params }) => {
    await delay(LATENCY);
    const r = db().results[String(params.attemptId)];
    return r ? HttpResponse.json(r) : notFound("Result");
  }),

  /* ---------------- vocabulary ---------------- */

  http.get("/api/vocab", async () => {
    await delay(LATENCY);
    return HttpResponse.json(db().vocab);
  }),

  http.get("/api/vocab/summary", async () => {
    await delay(LATENCY / 2);
    return HttpResponse.json(vocabSummary(db()));
  }),

  http.get("/api/vocab/due", async () => {
    await delay(LATENCY);
    const now = Date.now();
    const due = db()
      .vocab.filter((c) => new Date(c.due).getTime() <= now)
      .sort((a, b) => a.due.localeCompare(b.due));
    return HttpResponse.json(due);
  }),

  http.post("/api/vocab", async ({ request }) => {
    const body = (await request.json()) as Pick<VocabCard, "term" | "partOfSpeech" | "meaning" | "example">;
    const card: VocabCard = { ...body, id: uid("v"), due: new Date().toISOString(), intervalDays: 0, reps: 0, custom: true };
    const d = db();
    d.vocab.unshift(card);
    persist();
    return HttpResponse.json(card, { status: 201 });
  }),

  http.delete("/api/vocab/:id", async ({ params }) => {
    const d = db();
    d.vocab = d.vocab.filter((c) => c.id !== params.id);
    persist();
    return HttpResponse.json({ ok: true });
  }),

  /** Two-button spaced repetition: Again shows the card in 10 minutes, Good stretches the interval. */
  http.post("/api/vocab/:id/review", async ({ params, request }) => {
    const { grade } = (await request.json()) as { grade: "again" | "good" };
    const d = db();
    const card = d.vocab.find((c) => c.id === params.id);
    if (!card) return notFound("Card");
    if (grade === "again") {
      card.intervalDays = 0;
      card.due = new Date(Date.now() + 10 * 60_000).toISOString();
    } else {
      card.intervalDays = card.intervalDays === 0 ? 1 : Math.round(card.intervalDays * 2.5);
      card.reps += 1;
      card.due = new Date(Date.now() + card.intervalDays * 86_400_000).toISOString();
    }
    const today = new Date().toISOString().slice(0, 10);
    d.reviewLog[today] = (d.reviewLog[today] ?? 0) + 1;
    persist();
    return HttpResponse.json(card);
  }),

  /* ---------------- coach ---------------- */

  http.get("/api/coach", async () => {
    await delay(LATENCY);
    const d = db();
    const { coach } = await import("./fixtures/coach");
    const now = new Date().toISOString();
    const reviews = d.reviews.map((r) => ({ ...r, messages: r.messages.filter((m) => m.at <= now) }));
    return HttpResponse.json({
      coach,
      slots: d.slots.filter((s) => !s.booked && s.start > now),
      bookings: d.slots.filter((s) => s.booked),
      reviews,
    });
  }),

  http.post("/api/coach/bookings", async ({ request }) => {
    await delay(LATENCY);
    const { slotId } = (await request.json()) as { slotId: string };
    const d = db();
    const slot = d.slots.find((s) => s.id === slotId);
    if (!slot || slot.booked) return HttpResponse.json({ error: "Slot taken" }, { status: 409 });
    slot.booked = true;
    persist();
    return HttpResponse.json(slot, { status: 201 });
  }),

  http.delete("/api/coach/bookings/:slotId", async ({ params }) => {
    const d = db();
    const slot = d.slots.find((s) => s.id === params.slotId);
    if (slot) slot.booked = false;
    persist();
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/coach/reviews", async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { kind: "essay" | "recording"; title: string; attemptId: string | null; message: string };
    const d = db();
    const now = Date.now();
    const review = {
      id: uid("rev"),
      kind: body.kind,
      title: body.title,
      attemptId: body.attemptId,
      status: "requested" as const,
      submittedAt: new Date(now).toISOString(),
      messages: [
        ...(body.message ? [{ author: "me" as const, text: body.message, at: new Date(now).toISOString() }] : []),
        { author: "coach" as const, text: COACH_REPLIES[0], at: new Date(now + 4000).toISOString() },
      ],
    };
    d.reviews.unshift(review);
    persist();
    return HttpResponse.json(review, { status: 201 });
  }),

  http.post("/api/coach/reviews/:id/messages", async ({ params, request }) => {
    const { text } = (await request.json()) as { text: string };
    const d = db();
    const review = d.reviews.find((r) => r.id === params.id);
    if (!review) return notFound("Review");
    const now = Date.now();
    review.messages.push({ author: "me", text, at: new Date(now).toISOString() });
    review.messages.push({
      author: "coach",
      text: COACH_REPLIES[1 + (review.messages.length % 2)],
      at: new Date(now + 4000).toISOString(),
    });
    persist();
    return HttpResponse.json(review);
  }),

  /* ---------------- notifications ---------------- */

  http.get("/api/notifications", async () => {
    await delay(LATENCY / 2);
    return HttpResponse.json(db().notifications);
  }),

  http.post("/api/notifications/read-all", async () => {
    const d = db();
    d.notifications = d.notifications.map((n) => ({ ...n, read: true }));
    persist();
    return HttpResponse.json({ ok: true });
  }),

  http.post("/api/notifications/:id/read", async ({ params }) => {
    const d = db();
    d.notifications = d.notifications.map((n) => (n.id === params.id ? { ...n, read: true } : n));
    persist();
    return HttpResponse.json({ ok: true });
  }),

  /* ---------------- prototype only ---------------- */

  http.post("/api/dev/reset", async ({ request }) => {
    const { mode } = (await request.json()) as { mode: "demo" | "empty" };
    const keep = db();
    resetDb(mode, { signedIn: keep.signedIn });
    return HttpResponse.json({ ok: true });
  }),
];
