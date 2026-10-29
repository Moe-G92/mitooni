import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Attempt, QuestionGroup, Section, Test } from "@/api/schemas";
import { SessionProvider, useSession } from "../engine/session";
import { QuestionGroupView } from "./QuestionGroupView";
import { DropSlot, MatchingProvider } from "./Matching";

const saved: unknown[] = [];
vi.mock("@/api/queries", () => ({
  saveSectionState: vi.fn(async (_id: string, patch: unknown) => {
    saved.push(patch);
    return { ok: true, savedAt: "" };
  }),
  checkAnswer: vi.fn(async (_a: string, itemId: string) => ({
    itemId,
    correct: true,
    answer: ["B"],
    explanation: { en: "Because the passage says so.", fa: "" },
  })),
}));

const exp = { en: "", fa: "" };

const groups: QuestionGroup[] = [
  {
    id: "g-single",
    type: "tfng",
    interaction: "single",
    title: "Questions 1–2",
    instructions: "Choose **TRUE**, **FALSE** or **NOT GIVEN**.",
    items: [1, 2].map((n) => ({
      id: `q${n}`,
      numbers: [n],
      prompt: `Statement ${n}`,
      options: ["TRUE", "FALSE", "NOT GIVEN"].map((k) => ({ key: k, text: k })),
      answer: ["TRUE"],
      explanation: exp,
    })),
  },
  {
    id: "g-multi",
    type: "multiple-choice",
    interaction: "multi",
    title: "Questions 3–4",
    instructions: "Choose **TWO** letters.",
    choose: 2,
    options: ["A", "B", "C", "D"].map((k) => ({ key: k, text: `Option ${k}` })),
    items: [{ id: "q3-4", numbers: [3, 4], prompt: "Which two?", answer: ["A", "B"], explanation: exp }],
  },
  {
    id: "g-gap",
    type: "note-completion",
    interaction: "gap",
    title: "Question 5",
    instructions: "Write **ONE WORD ONLY**.",
    content: [{ kind: "paragraph", text: "Salt was made with {{5}} heat." }],
    items: [{ id: "q5", numbers: [5], answer: ["solar"], explanation: exp }],
  },
  {
    id: "g-select",
    type: "matching-features",
    interaction: "select",
    title: "Question 6",
    instructions: "Choose the correct letter.",
    optionsTitle: "List of people",
    options: [
      { key: "A", text: "Helena Marsh" },
      { key: "B", text: "Tomas Ferreira" },
    ],
    items: [{ id: "q6", numbers: [6], prompt: "Argued for open data", answer: ["B"], explanation: exp }],
  },
  {
    id: "g-grid",
    type: "matching",
    interaction: "grid",
    title: "Question 7",
    instructions: "Choose the correct letter.",
    options: ["A", "B", "C"].map((k) => ({ key: k, text: k })),
    items: [{ id: "q7", numbers: [7], prompt: "Bird hide", answer: ["C"], explanation: exp }],
  },
  {
    id: "g-drag",
    type: "matching-headings",
    interaction: "drag",
    title: "Questions 8–9",
    instructions: "Choose the correct heading.",
    optionsTitle: "List of Headings",
    options: [
      { key: "i", text: "A new problem" },
      { key: "ii", text: "An old answer" },
      { key: "iii", text: "A distractor" },
    ],
    items: [
      { id: "q8", numbers: [8], prompt: "Section B", answer: ["ii"], explanation: exp },
      { id: "q9", numbers: [9], prompt: "Section C", answer: ["i"], explanation: exp },
    ],
  },
];

const section: Section = { id: "s", skill: "reading", title: "Reading", durationSec: 600, parts: [{ id: "p1", number: 1, rubric: "Read", groups }] };
const test: Test = { id: "t", title: "T", kind: "practice", sections: [section] };

function attempt(mode: Attempt["mode"] = "exam"): Attempt {
  return {
    id: "a",
    testId: "t",
    testTitle: "T",
    kind: "practice",
    mode,
    accommodation: 1,
    status: "in-progress",
    sectionIndex: 0,
    startedAt: "",
    submittedAt: null,
    sections: [
      {
        sectionId: "s",
        status: "in-progress",
        remainingSec: 600,
        currentPart: 0,
        currentNumber: 1,
        answers: {},
        flags: [],
        highlights: [],
        notes: [],
        essays: {},
        recordings: {},
        partTime: {},
        startedAt: null,
        submittedAt: null,
      },
    ],
  };
}

function Answers() {
  const s = useSession();
  return <pre data-testid="answers">{JSON.stringify(s.state.answers)}</pre>;
}

function setup(mode: Attempt["mode"] = "exam", only?: string) {
  const user = userEvent.setup();
  render(
    <SessionProvider attempt={attempt(mode)} test={test} section={section} showFlag settings={{ contrast: "", size: "" }}>
      <MatchingProvider groups={groups}>
        <DropSlot number={8} />
        <DropSlot number={9} />
        {groups
          .filter((g) => !only || g.id === only)
          .map((g) => (
            <QuestionGroupView key={g.id} group={g} />
          ))}
        <Answers />
      </MatchingProvider>
    </SessionProvider>,
  );
  const answers = () => JSON.parse(screen.getByTestId("answers").textContent || "{}");
  return { user, answers };
}

beforeEach(() => {
  saved.length = 0;
});

describe("answer widgets", () => {
  it("single choice: click and keyboard both answer", async () => {
    const { user, answers } = setup("exam", "g-single");
    await user.click(within(screen.getByRole("radiogroup", { name: "Question 1" })).getByLabelText("FALSE"));
    expect(answers().q1).toBe("FALSE");
    const q2 = within(screen.getByRole("radiogroup", { name: "Question 2" })).getByLabelText("TRUE");
    q2.focus();
    await user.keyboard(" ");
    expect(answers().q2).toBe("TRUE");
  });

  it("Choose TWO allows exactly two choices", async () => {
    const { user, answers } = setup("exam", "g-multi");
    await user.click(screen.getByLabelText(/Option A/));
    await user.click(screen.getByLabelText(/Option C/));
    expect(screen.getByLabelText(/Option D/)).toBeDisabled();
    expect(answers()["q3-4"]).toEqual(["A", "C"]);
    await user.click(screen.getByLabelText(/Option C/));
    expect(answers()["q3-4"]).toEqual(["A"]);
  });

  it("gap fill is a text box with the question number as placeholder", async () => {
    const { user, answers } = setup("exam", "g-gap");
    const box = screen.getByRole("textbox", { name: "Question 5" });
    expect(box).toHaveAttribute("placeholder", "5");
    expect(box).toHaveAttribute("spellcheck", "false");
    await user.type(box, "solar");
    expect(answers().q5).toBe("solar");
  });

  it("dropdown matching shows the list and stores the letter", async () => {
    const { user, answers } = setup("exam", "g-select");
    expect(screen.getByText("Tomas Ferreira")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Question 6" }), "B");
    expect(answers().q6).toBe("B");
  });

  it("grid matching uses one radio per letter", async () => {
    const { user, answers } = setup("exam", "g-grid");
    await user.click(screen.getByRole("radio", { name: /Question 7, Bird hide: C/ }));
    expect(answers().q7).toBe("C");
  });

  it("matching headings works without dragging: pick a heading, then a box", async () => {
    const { user, answers } = setup("exam", "g-drag");
    await user.click(screen.getByRole("button", { name: /Heading ii:/ }));
    await user.click(screen.getByRole("button", { name: /Question 8:/ }));
    expect(answers().q8).toBe("ii");
    // Each heading is used once: placing it in box 9 empties box 8.
    await user.click(screen.getByRole("button", { name: /Heading ii:/ }));
    await user.click(screen.getByRole("button", { name: /Question 9:/ }));
    expect(answers().q9).toBe("ii");
    expect(answers().q8).toBe("");
    // A filled box clears on press.
    await user.click(screen.getByRole("button", { name: /Question 9: heading ii/ }));
    expect(answers().q9).toBe("");
  });

  it("matching headings is keyboard operable with Enter", async () => {
    const { user, answers } = setup("exam", "g-drag");
    screen.getByRole("button", { name: /Heading i:/ }).focus();
    await user.keyboard("{Enter}");
    screen.getByRole("button", { name: /Question 9:/ }).focus();
    await user.keyboard("{Enter}");
    expect(answers().q9).toBe("i");
  });

  it("autosaves answers to the API", async () => {
    const { user } = setup("exam", "g-gap");
    await user.type(screen.getByRole("textbox", { name: "Question 5" }), "x");
    await new Promise((r) => setTimeout(r, 500));
    expect(saved.at(-1)).toMatchObject({ sectionId: "s", answers: { q5: "x" } });
  });

  it("practice mode offers Check answers with an explanation; exam mode does not", async () => {
    const { user } = setup("practice", "g-single");
    await user.click(within(screen.getByRole("radiogroup", { name: "Question 1" })).getByLabelText("TRUE"));
    await user.click(screen.getByRole("button", { name: /Check answers/ }));
    expect(await screen.findAllByText("Because the passage says so.")).toHaveLength(1);
  });

  it("exam mode never shows Check answers", () => {
    setup("exam", "g-single");
    expect(screen.queryByRole("button", { name: /Check answers/ })).toBeNull();
  });
});
