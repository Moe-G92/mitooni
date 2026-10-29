import { delay, http, HttpResponse } from "msw";
import { uid } from "@/lib/utils";
import { db, persist } from "./db";

/*
 * Identifier-first sign-in: one page for people with and without an account.
 *   POST /api/auth/lookup      { email } or { phone }     -> { exists, name }
 *   POST /api/auth/sign-in     { email, password, keep }  -> Profile
 *   POST /api/auth/sign-up     { name, email, password }  -> Profile (onboarding next)
 *   POST /api/auth/otp/send    { phone }                  -> { ok, exists }
 *   POST /api/auth/otp/verify  { phone, code, name? }     -> Profile, or { needsName: true }
 *   POST /api/auth/google                                 -> Profile
 * Prototype rules: any password and any 6-digit code are accepted.
 */

const LATENCY = 350;

/** Iranian mobiles (09xxxxxxxxx, with or without +98 or Persian digits) normalised to 09xxxxxxxxx. */
export function normalisePhone(raw: string): string {
  const latin = raw.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[\s()-]/g, "");
  if (/^\+989\d{9}$/.test(latin)) return `0${latin.slice(3)}`;
  if (/^00989\d{9}$/.test(latin)) return `0${latin.slice(4)}`;
  if (/^9\d{9}$/.test(latin)) return `0${latin}`;
  return latin;
}

function find(email?: string, phone?: string) {
  const d = db();
  const e = email?.trim().toLowerCase();
  const p = phone ? normalisePhone(phone) : undefined;
  return d.accounts.find((a) => (e && a.email?.toLowerCase() === e) || (p && a.phone === p));
}

function signInAs(name: string, email: string | undefined, isNew: boolean) {
  const d = db();
  d.signedIn = true;
  if (isNew) {
    d.profile = { ...d.profile, id: uid("user"), name, email: email ?? d.profile.email, onboarded: false };
  } else {
    d.profile = { ...d.profile, name, email: email ?? d.profile.email };
  }
  persist();
  return d.profile;
}

export const authHandlers = [
  http.post("/api/auth/lookup", async ({ request }) => {
    await delay(LATENCY);
    const { email, phone } = (await request.json()) as { email?: string; phone?: string };
    const acc = find(email, phone);
    return HttpResponse.json({ exists: !!acc, name: acc?.name ?? null });
  }),

  http.post("/api/auth/sign-in", async ({ request }) => {
    await delay(LATENCY);
    const { email } = (await request.json()) as { email?: string; password: string };
    const acc = find(email) ?? db().accounts[0];
    return HttpResponse.json(signInAs(acc.name, acc.email, false));
  }),

  http.post("/api/auth/sign-up", async ({ request }) => {
    await delay(LATENCY);
    const { name, email } = (await request.json()) as { name: string; email: string; password: string };
    if (find(email)) return HttpResponse.json({ error: "An account already uses this email" }, { status: 409 });
    db().accounts.push({ email: email.trim(), name: name.trim() });
    return HttpResponse.json(signInAs(name.trim(), email.trim(), true));
  }),

  http.post("/api/auth/otp/send", async ({ request }) => {
    await delay(LATENCY);
    const { phone } = (await request.json()) as { phone: string };
    return HttpResponse.json({ ok: true, exists: !!find(undefined, phone) });
  }),

  http.post("/api/auth/otp/verify", async ({ request }) => {
    await delay(LATENCY);
    const { phone, code, name } = (await request.json()) as { phone: string; code: string; name?: string };
    if (!/^\d{6}$/.test(code)) return HttpResponse.json({ error: "Invalid code" }, { status: 400 });
    const acc = find(undefined, phone);
    if (acc) return HttpResponse.json(signInAs(acc.name, acc.email, false));
    if (!name) return HttpResponse.json({ needsName: true });
    db().accounts.push({ phone: normalisePhone(phone), name: name.trim() });
    return HttpResponse.json(signInAs(name.trim(), undefined, true));
  }),

  http.post("/api/auth/google", async () => {
    await delay(LATENCY);
    const acc = db().accounts[0];
    return HttpResponse.json(signInAs(acc.name, acc.email, false));
  }),
];
