import { Fragment, useState, type ReactNode } from "react";
import type { ContentBlock, Item, QuestionGroup } from "@/api/schemas";
import { checkAnswer } from "@/api/queries";
import { numbersLabel } from "@/lib/utils";
import { useSession } from "../engine/session";
import { isAnswered, tokenize } from "../engine/model";
import { HighlightableText } from "../chrome/Highlighting";
import { Figure } from "./Figure";
import { DragHelp, HeadingList } from "./Matching";

/* ---------------- rich text ---------------- */

/** Text with line breaks kept: a blank line starts a new paragraph-like break. */
function Lines({ text }: { text: string }) {
  const lines = text.split(/\n+/);
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {l}
        </Fragment>
      ))}
    </>
  );
}

export function Rich({ text, gap }: { text: string; gap?: (n: number) => ReactNode }) {
  return (
    <>
      {tokenize(text).map((t, i) =>
        t.kind === "gap" ? (
          <Fragment key={i}>{gap ? gap(t.n) : `(${t.n})`}</Fragment>
        ) : t.bold ? (
          <b key={i}>
            <Lines text={t.text} />
          </b>
        ) : (
          <Lines key={i} text={t.text} />
        ),
      )}
    </>
  );
}

/* ---------------- practice check result ---------------- */

function CheckNote({ item }: { item: Item }) {
  const { checks } = useSession();
  const c = checks[item.id];
  if (!c) return null;
  return (
    <div className={`x-check ${c.correct ? "good" : "bad"}`} role="status">
      <b className={c.correct ? "good" : "bad"}>{c.correct ? "Correct" : "Not quite"}</b>
      {!c.correct && <> · Answer: {c.answer.join(" / ")}</>}
      <div>{c.explanation.en}</div>
      {c.trap && <div style={{ marginTop: 4 }}>Trap: {c.trap.en}</div>}
      {c.evidence && <div style={{ marginTop: 4, fontStyle: "italic" }}>“{c.evidence}”</div>}
    </div>
  );
}

/* ---------------- inline gap ---------------- */

function GapInput({ group, n }: { group: QuestionGroup; n: number }) {
  const s = useSession();
  const item = group.items.find((i) => i.numbers.includes(n));
  if (!item) return <span>({n})</span>;
  const value = (s.state.answers[item.id] as string | undefined) ?? "";
  return (
    <input
      id={`q-${n}`}
      className="x-gap"
      value={value}
      placeholder={String(n)}
      aria-label={`Question ${n}`}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      maxLength={500}
      onFocus={() => s.state.currentNumber !== n && s.goToNumber(n, false)}
      onChange={(e) => s.answer(item.id, e.target.value)}
    />
  );
}

function Block({ block, group }: { block: ContentBlock; group: QuestionGroup }) {
  const gap = (n: number) => <GapInput group={group} n={n} />;
  switch (block.kind) {
    case "heading":
      return (
        <p className="x-content-heading">
          <Rich text={block.text} gap={gap} />
        </p>
      );
    case "paragraph":
      return (
        <p>
          <Rich text={block.text} gap={gap} />
        </p>
      );
    case "list":
      return (
        <ul className="x-list">
          {block.items.map((t, i) => (
            <li key={i}>
              <Rich text={t} gap={gap} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <table className="x-table">
          {block.header && (
            <thead>
              <tr>
                {block.header.map((h, i) => (
                  <th key={i}>
                    <Rich text={h} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>
                    <Rich text={c} gap={gap} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "flow":
      return (
        <div className="x-flow">
          {block.steps.map((st, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="x-flow-arrow" aria-hidden="true" />}
              <div className="x-flow-step">
                <Rich text={st} gap={gap} />
              </div>
            </Fragment>
          ))}
        </div>
      );
  }
}

/* ---------------- per-item interactions ---------------- */

function QuestionRow({ item, children }: { item: Item; children: ReactNode }) {
  const s = useSession();
  const active = item.numbers.includes(s.state.currentNumber);
  return (
    <div className={`x-q ${active ? "active" : ""}`} onFocusCapture={() => !active && s.goToNumber(item.numbers[0], false)}>
      <div className="x-qn">{numbersLabel(item.numbers)}</div>
      <div className="x-q-body">
        {children}
        <CheckNote item={item} />
      </div>
    </div>
  );
}

function Single({ group, item }: { group: QuestionGroup; item: Item }) {
  const s = useSession();
  const value = s.state.answers[item.id];
  const options = item.options ?? group.options ?? [];
  const lettered = options.some((o) => o.key !== o.text);
  return (
    <QuestionRow item={item}>
      {item.prompt && <HighlightableText root={`p-${item.id}`} text={item.prompt} />}
      <ul className="x-opts" role="radiogroup" aria-label={`Question ${item.numbers[0]}`}>
        {options.map((o, i) => (
          <li key={o.key} className={value === o.key ? "on" : undefined}>
            <label>
              <input
                id={i === 0 ? `q-${item.numbers[0]}` : undefined}
                type="radio"
                name={item.id}
                checked={value === o.key}
                onChange={() => s.answer(item.id, o.key)}
              />
              {lettered && <span className="x-key">{o.key}</span>}
              <span>{o.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </QuestionRow>
  );
}

function Multi({ group, item }: { group: QuestionGroup; item: Item }) {
  const s = useSession();
  const value = (s.state.answers[item.id] as string[] | undefined) ?? [];
  const max = group.choose ?? item.numbers.length;
  const toggle = (k: string) => {
    if (value.includes(k)) s.answer(item.id, value.filter((x) => x !== k));
    else if (value.length < max) s.answer(item.id, [...value, k]);
  };
  return (
    <QuestionRow item={item}>
      {item.prompt && <HighlightableText root={`p-${item.id}`} text={item.prompt} />}
      <ul className="x-opts" aria-label={`Questions ${numbersLabel(item.numbers)}, choose ${max}`}>
        {(group.options ?? []).map((o, i) => (
          <li key={o.key} className={value.includes(o.key) ? "on" : undefined}>
            <label>
              <input
                id={i === 0 ? `q-${item.numbers[0]}` : undefined}
                type="checkbox"
                checked={value.includes(o.key)}
                disabled={!value.includes(o.key) && value.length >= max}
                onChange={() => toggle(o.key)}
              />
              <span className="x-key">{o.key}</span>
              <span>{o.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </QuestionRow>
  );
}

function OptionsBox({ group }: { group: QuestionGroup }) {
  // A bare list of letters (A, B, C...) adds nothing next to the dropdowns.
  if (!group.options?.length || group.options.every((o) => o.key === o.text)) return null;
  return (
    <div className="x-box">
      {group.optionsTitle && <h3>{group.optionsTitle}</h3>}
      <ol>
        {group.options.map((o) => (
          <li key={o.key}>
            <b>{o.key}</b>
            <span>{o.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SelectMatch({ group, item }: { group: QuestionGroup; item: Item }) {
  const s = useSession();
  const value = (s.state.answers[item.id] as string | undefined) ?? "";
  return (
    <QuestionRow item={item}>
      {item.prompt && <HighlightableText root={`p-${item.id}`} text={item.prompt} />}
      <div>
        <select id={`q-${item.numbers[0]}`} className="x-select" value={value} aria-label={`Question ${item.numbers[0]}`} onChange={(e) => s.answer(item.id, e.target.value)}>
          <option value="">Select</option>
          {group.options?.map((o) => (
            <option key={o.key} value={o.key}>
              {o.key}
            </option>
          ))}
        </select>
      </div>
    </QuestionRow>
  );
}

function Grid({ group }: { group: QuestionGroup }) {
  const s = useSession();
  const opts = group.options ?? [];
  const lettersOnly = opts.every((o) => o.key === o.text);
  return (
    <>
      {group.figure && <Figure id={group.figure} label="Map" />}
      {!lettersOnly && <OptionsBox group={group} />}
      <table className="x-grid">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Question</span>
            </th>
            {opts.map((o) => (
              <th key={o.key} scope="col">
                {o.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.items.map((item) => {
            const value = s.state.answers[item.id];
            const active = item.numbers.includes(s.state.currentNumber);
            return (
              <tr key={item.id} className={active ? "active" : undefined} onFocusCapture={() => !active && s.goToNumber(item.numbers[0], false)}>
                <td>
                  <b>{item.numbers[0]}</b> {item.prompt}
                  <CheckNote item={item} />
                </td>
                {opts.map((o, i) => (
                  <td key={o.key}>
                    <input
                      id={i === 0 ? `q-${item.numbers[0]}` : undefined}
                      type="radio"
                      name={item.id}
                      aria-label={`Question ${item.numbers[0]}, ${item.prompt}: ${o.key}`}
                      checked={value === o.key}
                      onChange={() => s.answer(item.id, o.key)}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function Diagram({ group }: { group: QuestionGroup }) {
  const s = useSession();
  return (
    <>
      <Figure id={group.figure ?? ""} label="Diagram">
        {group.items.map((item) => {
          const n = item.numbers[0];
          return (
            <input
              key={item.id}
              id={`q-${n}`}
              className="x-gap"
              style={{ left: `${item.position?.x ?? 0}%`, top: `${item.position?.y ?? 0}%` }}
              placeholder={String(n)}
              aria-label={`Question ${n}`}
              autoComplete="off"
              spellCheck={false}
              value={(s.state.answers[item.id] as string | undefined) ?? ""}
              onFocus={() => s.goToNumber(n, false)}
              onChange={(e) => s.answer(item.id, e.target.value)}
            />
          );
        })}
      </Figure>
      {group.items.map((i) => (
        <CheckNote key={i.id} item={i} />
      ))}
    </>
  );
}

/* ---------------- group ---------------- */

function PracticeCheck({ group }: { group: QuestionGroup }) {
  const s = useSession();
  const [busy, setBusy] = useState(false);
  const answered = group.items.filter((i) => isAnswered(s.state.answers[i.id]));
  return (
    <div style={{ marginTop: 6 }}>
      <button
        type="button"
        className="x-btn"
        disabled={busy || answered.length === 0}
        onClick={async () => {
          setBusy(true);
          try {
            for (const i of answered) s.setCheck(await checkAnswer(s.attempt.id, i.id, s.state.answers[i.id]!));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Checking…" : `Check answers ${group.title.replace("Questions ", "")}`}
      </button>
      <span style={{ marginLeft: 10, fontSize: 12, color: "var(--x-muted)" }}>Practice only, not in the real test</span>
    </div>
  );
}

export function QuestionGroupView({ group }: { group: QuestionGroup }) {
  const s = useSession();
  let body: ReactNode = null;
  switch (group.interaction) {
    case "single":
      body = group.items.map((i) => <Single key={i.id} group={group} item={i} />);
      break;
    case "multi":
      body = group.items.map((i) => <Multi key={i.id} group={group} item={i} />);
      break;
    case "select":
      body = (
        <>
          <OptionsBox group={group} />
          {group.items.map((i) => (
            <SelectMatch key={i.id} group={group} item={i} />
          ))}
        </>
      );
      break;
    case "grid":
      body = <Grid group={group} />;
      break;
    case "diagram":
      body = <Diagram group={group} />;
      break;
    case "drag":
      body = (
        <>
          <DragHelp />
          <HeadingList group={group} />
          {group.items.map((i) => (
            <CheckNote key={i.id} item={i} />
          ))}
        </>
      );
      break;
    case "gap":
      body = (
        <>
          {(group.content ?? []).map((b, i) => (
            <Block key={i} block={b} group={group} />
          ))}
          {group.items.map((i) => (
            <CheckNote key={i.id} item={i} />
          ))}
        </>
      );
      break;
  }
  return (
    <section className="x-group" aria-labelledby={`${group.id}-title`}>
      <h2 id={`${group.id}-title`}>{group.title}</h2>
      <p className="x-rubric">
        <Rich text={group.instructions} />
      </p>
      {body}
      {s.practice && <PracticeCheck group={group} />}
    </section>
  );
}
