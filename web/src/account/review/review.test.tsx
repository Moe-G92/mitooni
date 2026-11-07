import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { SessionController } from "@/auth/session";
import { setPrefs } from "@/lib/prefs";
import { safeNext } from "@/auth/redirect";
import { AccountProvider } from "../state";
import { AccountClient } from "../transport";
import { GuardedTransport } from "../request";
import ReviewApp from "./ReviewApp";
import { ReviewClient } from "./client";
import { Export, Snapshot, type SnapshotData } from "./contracts";
import { SourceTree } from "./SourceTree";
const hash = "a".repeat(64);
const target = {
  id: "synthetic-unit",
  targetHash: hash,
  version: 1,
  kind: "unit" as const,
  title: "Synthetic review task",
  skill: "reading" as const,
  examTrack: "academic" as const,
  stage: "train" as const,
  pathwayIds: ["foundation"],
  deliveryStatus: "text" as const,
  revision: 0,
  revealed: false,
  submitted: false,
  decision: null,
};
const snapshot = (): SnapshotData => ({
  packageHash: hash,
  targetHash: hash,
  target,
  revision: 0,
  draft: { answers: [] },
  submission: null,
  revealedAt: null,
  task: {
    assets: [],
    instructions: "Read the synthetic passage",
    sections: [
      {
        id: "section",
        title: "Synthetic passage",
        text: "Plain passage",
        instructions: "Read all questions",
        minimumWords: null,
        table: null,
        questions: [
          {
            id: "q1",
            prompt: "What is stated?",
            instructions: "Choose one option",
            responseType: "single_choice",
            options: [{ id: "A", text: "A statement" }],
            wordLimit: null,
          },
        ],
      },
    ],
  },
  review: null,
  privateContent: null,
  limitations: [],
});
async function auth() {
  let subject = "a";
  const session = new SessionController({
    initialize: async () => null,
    subscribe: () => () => {},
    signIn: async (email) => ({ subject: (subject = email), token: email }),
    refresh: async () => ({ subject, token: subject }),
    signOut: async () => {},
  });
  await session.start();
  await session.signIn("a", "");
  return session;
}
async function mount(
  fetcher: typeof fetch,
  path = "/app/content-review/synthetic-unit",
) {
  setPrefs({ locale: "en" });
  const session = await auth();
  const account = new AccountClient(session, "", fetcher);
  render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider session={session} client={account}>
        <Routes>
          <Route path="/sign-in" element={<p>Sign-in required</p>} />
          <Route
            path="/app/content-review/:targetId?"
            element={<ReviewApp />}
          />
        </Routes>
      </AccountProvider>
    </MemoryRouter>,
  );
  return session;
}
const accountResponse = () =>
  Response.json({
    identity: { id: "a", email: null },
    membership: { status: "none", roles: [], entitlements: [] },
    state: "access-required",
    profile: null,
  });
it("accepts only canonical invited review paths after sign-in", () => {
  for (const p of ["/app/content-review", "/app/content-review/synthetic-unit"])
    expect(safeNext(p)).toBe(p);
  for (const p of [
    "/app/content-review//evil",
    "/app/content-review/%2fadmin",
    "/app/content-review/../settings",
    "/app/content-review/A",
    "/app/content-review/a?x=1",
    "/app/content-review/a#x",
  ])
    expect(safeNext(p)).toBe("/app/settings");
});
it("rejects pre-reveal private source, unknown fields, wrong versions and unknown answer bindings", () => {
  const s = snapshot();
  expect(Snapshot.safeParse(s).success).toBe(true);
  for (const bad of [
    { ...s, privateContent: { answerKey: "secret" } },
    { ...s, approved: true },
    { ...s, targetHash: "b".repeat(64) },
    { ...s, draft: { answers: [{ questionId: "unknown", text: "x" }] } },
  ])
    expect(Snapshot.safeParse(bad).success).toBe(false);
});
it("renders source text inertly as readable fields and lists", () => {
  render(
    <SourceTree
      value={{ answerKey: [{ rationale: "<script>alert(1)</script>" }] }}
    />,
  );
  expect(screen.getByText("Answer key · کلید پاسخ")).toBeVisible();
  expect(screen.getByText("<script>alert(1)</script>")).toBeVisible();
  expect(document.querySelector("script")).toBeNull();
});
it("pins an exact operation across uncertain transport and rejects old owner retries", async () => {
  const session = await auth();
  const calls: RequestInit[] = [];
  let fail = true;
  const client = new ReviewClient(
    new GuardedTransport(session, "", async (_url, options) => {
      calls.push(options!);
      if (fail) {
        fail = false;
        throw Error("offline");
      }
      return Response.json(snapshot());
    }),
  );
  const op = client.operation(snapshot(), "draft", {
    answers: [{ questionId: "q1", text: "frozen A" }],
  });
  await expect(client.mutate(op)).rejects.toThrow("offline");
  await client.mutate(op);
  expect(calls[0].body).toEqual(calls[1].body);
  expect(new Headers(calls[0].headers).get("Idempotency-Key")).toEqual(
    new Headers(calls[1].headers).get("Idempotency-Key"),
  );
  await session.signIn("b", "");
  await expect(client.mutate(op)).rejects.toThrow("account_changed");
  expect(calls).toHaveLength(2);
});
it("profileless reviewer can save, submit, deliberately reveal and save a comment", async () => {
  let s = snapshot();
  const methods: string[] = [];
  await mount(async (url, options) => {
    if (String(url).endsWith("/account")) return accountResponse();
    const method = options?.method ?? "GET";
    if (method !== "GET") {
      const body = JSON.parse(options!.body as string);
      methods.push(String(url).split("/").at(-1)!);
      s = structuredClone(s);
      s.revision++;
      s.target = { ...s.target, revision: s.revision };
      if (String(url).endsWith("/draft")) s.draft.answers = body.answers;
      if (String(url).endsWith("/submit")) {
        s.submission = {
          answers: s.draft.answers,
          submittedAt: "2026-11-06T12:00:00Z",
          conditions: "blind",
        };
        s.target.submitted = true;
      }
      if (String(url).endsWith("/reveal")) {
        s.revealedAt = "now";
        s.target.revealed = true;
        s.privateContent = { answerKey: "Private teacher explanation" };
      }
      if (String(url).endsWith("/review"))
        s.review = {
          decision: body.decision,
          comment: body.comment,
          itemComments: body.itemComments,
        };
    }
    return Response.json(s);
  });
  const input = await screen.findByRole("textbox", {
    name: "1. What is stated?",
  });
  expect(screen.queryByText("Private teacher explanation")).toBeNull();
  fireEvent.change(input, { target: { value: "A" } });
  expect(
    screen.getByRole("button", { name: "Submit saved response" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save response" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit saved response" }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Submit saved response" }),
  );
  await screen.findByText(/Response before teacher notes/);
  fireEvent.click(screen.getByRole("button", { name: "Reveal teacher notes" }));
  await screen.findByText("Private teacher explanation");
  fireEvent.change(screen.getByRole("textbox", { name: "Comment" }), {
    target: { value: "Clear instructions" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await waitFor(() => expect(s.review?.comment).toBe("Clear instructions"));
  expect(methods).toEqual(["draft", "submit", "reveal", "review"]);
});
it("uncertain save freezes edits, then repeats the original body and key", async () => {
  let fail = true;
  const writes: RequestInit[] = [];
  await mount(async (url, options) => {
    if (String(url).endsWith("/account")) return accountResponse();
    if (options?.method === "PATCH") {
      writes.push(options);
      if (fail) {
        fail = false;
        throw Error("lost acknowledgement");
      }
      const s = snapshot();
      s.draft.answers = JSON.parse(options.body as string).answers;
      return Response.json(s);
    }
    return Response.json(snapshot());
  });
  const input = await screen.findByRole("textbox", { name: /What is stated/ });
  fireEvent.change(input, { target: { value: "Do not replace" } });
  fireEvent.click(screen.getByRole("button", { name: "Save response" }));
  await screen.findByText(/result is unknown/);
  expect(input).toBeDisabled();
  expect(screen.getByRole("button", { name: "Catalog" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(input).toBeEnabled());
  expect(writes[0].body).toBe(writes[1].body);
  expect(new Headers(writes[0].headers).get("Idempotency-Key")).toBe(
    new Headers(writes[1].headers).get("Idempotency-Key"),
  );
});
it("403 during a mutation purges all retained task and teacher content", async () => {
  const s = snapshot();
  s.revealedAt = "now";
  s.target = { ...s.target, revealed: true };
  s.privateContent = { rationale: "Sensitive teacher rationale" };
  await mount(async (url, options) =>
    String(url).endsWith("/account")
      ? accountResponse()
      : options?.method === "PATCH"
        ? Response.json({ detail: { code: "review_denied" } }, { status: 403 })
        : Response.json(s),
  );
  await screen.findByText("Sensitive teacher rationale");
  fireEvent.click(screen.getByRole("button", { name: "Save review" }));
  await screen.findByText("This account does not have reviewer access");
  expect(screen.queryByText("Sensitive teacher rationale")).toBeNull();
  expect(screen.queryByText("Synthetic review task")).toBeNull();
});
it("409 retains edits rather than overwriting them from the saved snapshot", async () => {
  await mount(async (url, options) =>
    String(url).endsWith("/account")
      ? accountResponse()
      : options?.method === "PATCH"
        ? Response.json(
            { detail: { code: "revision_conflict" } },
            { status: 409 },
          )
        : Response.json(snapshot()),
  );
  const input = await screen.findByRole("textbox", { name: /What is stated/ });
  fireEvent.change(input, { target: { value: "Keep my local answer" } });
  fireEvent.click(screen.getByRole("button", { name: "Save response" }));
  await screen.findByText(/saved version changed/);
  expect(input).toHaveValue("Keep my local answer");
});
it("does not render a delayed response after account replacement", async () => {
  let release!: (value: Response) => void;
  const late = new Promise<Response>((resolve) => {
    release = resolve;
  });
  let taskRequests = 0;
  const session = await mount(async (url) => {
    if (String(url).endsWith("/account")) return accountResponse();
    taskRequests++;
    return taskRequests === 1
      ? late
      : Response.json({ detail: { code: "review_denied" } }, { status: 403 });
  });
  await waitFor(() => expect(taskRequests).toBe(1));
  await act(async () => {
    await session.signIn("b", "");
    release(Response.json(snapshot()));
  });
  await screen.findByText("Sign-in required");
  expect(screen.queryByText("Synthetic review task")).toBeNull();
});
it("rejects delayed network results after the session owner changes", async () => {
  const session = await auth();
  let release!: (r: Response) => void;
  const late = new Promise<Response>((r) => {
    release = r;
  });
  const client = new ReviewClient(
    new GuardedTransport(session, "", () => late),
  );
  const request = client.target("synthetic-unit");
  await session.signIn("b", "");
  release(Response.json(snapshot()));
  await expect(request).rejects.toThrow("account_changed");
});
it("filters the real catalog rows and shows an honest empty state", async () => {
  await mount(
    async (url) =>
      String(url).endsWith("/account")
        ? accountResponse()
        : Response.json({
            packageHash: hash,
            title: "Synthetic package",
            targets: [{ ...target, pathwayIds: ["gt-foundation"] }],
          }),
    "/app/content-review",
  );
  await screen.findByRole("heading", { name: "Synthetic review task" });
  expect(screen.queryByText(/gt-foundation/)).toBeNull();
  expect(screen.getByText(/Academic · Reading · Foundation/)).toBeVisible();
  fireEvent.click(screen.getByText("Filters"));
  fireEvent.change(screen.getByRole("combobox", { name: "Review state" }), {
    target: { value: "changes_needed" },
  });
  expect(screen.getByText("No tasks match these filters")).toBeVisible();
  expect(screen.getByText("0 tasks")).toBeVisible();
});
it("renders an actual candidate table with column and row headers", async () => {
  const s = snapshot();
  s.task.sections[0].table = {
    title: "Synthetic library loans",
    description: "Loans by month",
    unit: "loans",
    columns: [
      { key: "month", label: "Month" },
      { key: "loans", label: "Loans" },
    ],
    rows: [{ month: "May", loans: 12 }],
  };
  await mount(async (url) =>
    String(url).endsWith("/account") ? accountResponse() : Response.json(s),
  );
  expect(
    await screen.findByRole("table", { name: /Synthetic library loans/ }),
  ).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Loans" })).toBeVisible();
  expect(screen.getByRole("rowheader", { name: "May" })).toBeVisible();
});

it("binds editorial export to content version without authorizing publication", () => {
  const data = {
    schemaVersion: 1,
    packageHash: hash,
    reviewerId: "synthetic-reviewer",
    exportedAt: "2026-11-07T00:00:00Z",
    evidenceKind: "reviewer_editorial_feedback",
    learnerPublicationAuthorized: false,
    records: [
      {
        targetId: "synthetic-unit",
        targetHash: hash,
        targetVersion: 2,
        revision: 1,
        submission: null,
        revealedAt: null,
        review: null,
      },
    ],
  };
  expect(Export.safeParse(data).success).toBe(true);
  expect(
    Export.safeParse({ ...data, learnerPublicationAuthorized: true }).success,
  ).toBe(false);
  expect(
    Export.safeParse({
      ...data,
      records: [{ ...data.records[0], targetVersion: 0 }],
    }).success,
  ).toBe(false);
});
