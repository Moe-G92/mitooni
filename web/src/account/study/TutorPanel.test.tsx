import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { setPrefs } from "@/lib/prefs";
import { TutorPanel } from "./TutorPanel";
import { workspace, bundle } from "./testSupport";
import { MessageSchema } from "./contracts";
it("renders generated text/quotes as inert plain text, with honest synthetic provenance", () => {
  setPrefs({ locale: "en" });
  const ws = workspace();
  ws.messages = [
    MessageSchema.parse({
      id: "message",
      turnId: "turn",
      workspaceId: ws.id,
      kind: "feedback",
      requestText: "Why does this reason need support?",
      text: '<img src=x onerror="alert(1)"> https://example.invalid',
      citations: [{ anchorId: "anchor-a", label: "Approved planning" }],
      workSpans: [{ start: 0, end: 5, quote: "saved" }],
      observations: [],
      proposalId: null,
      provenance: {
        actorKind: "ai_formative",
        runnerKind: "synthetic",
        bundleRef: bundle,
        contextManifestId: "manifest-a",
        workRef: { kind: "draft", id: ws.draft.id, revision: 1 },
      },
      createdAt: "now",
    }),
  ];
  const { container } = render(
    <MemoryRouter>
      <TutorPanel
        workspace={ws}
        turn={null}
        busy={false}
        pollError={null}
        uncertain={false}
        onSend={vi.fn()}
        onCheck={vi.fn()}
        onCancel={vi.fn()}
        onAccept={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector("a")).toBeNull();
  expect(screen.getByText("Synthetic response")).toBeInTheDocument();
  expect(
    screen.getByText("Why does this reason need support?"),
  ).toBeInTheDocument();
  expect(screen.getByText("saved")).toBeInTheDocument();
});
it("does not offer tutoring before explicit independent help switch", () => {
  setPrefs({ locale: "en" });
  const ws = workspace();
  ws.attempt.currentConditions = "independent";
  ws.capabilities = ["draft:write", "attempt:submit", "support:switch"];
  render(
    <MemoryRouter>
      <TutorPanel
        workspace={ws}
        turn={null}
        busy={false}
        pollError={null}
        uncertain={false}
        onSend={vi.fn()}
        onCheck={vi.fn()}
        onCancel={vi.fn()}
        onAccept={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("button", { name: "Explain" })).toBeNull();
  expect(screen.queryByLabelText("Message to the tutor")).toBeNull();
  expect(
    screen.getByText("Tutor help is off for this independent attempt"),
  ).toBeInTheDocument();
});
it("offers explicit AI-led learning without dispatching on mount", async () => {
  setPrefs({ locale: "en" });
  const send = vi.fn(async () => {});
  render(
    <MemoryRouter>
      <TutorPanel
        workspace={workspace()}
        turn={null}
        busy={false}
        pollError={null}
        uncertain={false}
        onSend={send}
        onCheck={vi.fn()}
        onCancel={vi.fn()}
        onAccept={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(send).not.toHaveBeenCalled();
  screen.getByRole("button", { name: "Begin learning", exact: true }).click();
  expect(send).toHaveBeenCalledWith("explain", "");
});
it("offers exact-request retry explicitly without dispatching on render or status check", () => {
  setPrefs({ locale: "en" });
  const retry = vi.fn(async () => {}),
    send = vi.fn(),
    check = vi.fn();
  render(
    <MemoryRouter>
      <TutorPanel
        workspace={workspace()}
        turn={null}
        busy={false}
        pollError={null}
        uncertain={true}
        onSend={send}
        onCheck={check}
        onRetryRequest={retry}
        onCancel={vi.fn()}
        onAccept={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(retry).not.toHaveBeenCalled();
  screen.getByRole("button", { name: "Check response", exact: true }).click();
  expect(check).toHaveBeenCalledOnce();
  expect(retry).not.toHaveBeenCalled();
  screen
    .getByRole("button", { name: "Retry this request", exact: true })
    .click();
  expect(retry).toHaveBeenCalledOnce();
  expect(send).not.toHaveBeenCalled();
});
