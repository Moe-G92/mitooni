import { Fragment, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { ContentBlock, ItemResult, QuestionGroup, Section, SkillScore } from "@/api/schemas";
import { useT } from "@/i18n";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { tokenize } from "@/exam/engine/model";
import { Figure } from "@/exam/widgets/Figure";
import { Card } from "@/components/ui/card";
import { assignEvidence, numberStatuses, partStats, splitByEvidence, type PartStat } from "./review-data";
import { AnswerChip, EvidenceMark, JumpStrip, Legend, QBadge } from "./shared";
import { revealElement } from "./tones";

/*
 * Reading: three passages that open on click. The passage sits on the left
 * with each answer's evidence highlighted and badged; the questions sit on the
 * right in exam format, each with the learner's answer marked.
 */

/** Exam rich text: **bold** and {{n}} answer boxes, here filled with the marked answer. */
function Rich({ text, gap }: { text: string; gap: (n: number) => ReactNode }) {
  return (
    <>
      {tokenize(text).map((tk, i) =>
        tk.kind === "gap" ? <Fragment key={i}>{gap(tk.n)}</Fragment> : tk.bold ? <b key={i}>{tk.text}</b> : <Fragment key={i}>{tk.text}</Fragment>,
      )}
    </>
  );
}

function Block({ block, gap }: { block: ContentBlock; gap: (n: number) => ReactNode }) {
  switch (block.kind) {
    case "heading":
      return (
        <p className="mb-2 font-bold">
          <Rich text={block.text} gap={gap} />
        </p>
      );
    case "paragraph":
      return (
        <p className="mb-2">
          <Rich text={block.text} gap={gap} />
        </p>
      );
    case "list":
      return (
        <ul className="mb-2 flex list-disc flex-col gap-1.5 ps-5">
          {block.items.map((x, i) => (
            <li key={i}>
              <Rich text={x} gap={gap} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mb-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {block.header && (
              <thead>
                <tr>
                  {block.header.map((h, i) => (
                    <th key={i} scope="col" className="border border-[#bdbdbd] bg-[#f3f3f3] px-2 py-1.5 text-start font-bold">
                      <Rich text={h} gap={gap} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="border border-[#bdbdbd] px-2 py-1.5 align-top">
                      <Rich text={c} gap={gap} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "flow":
      return (
        <ol className="mb-2 flex flex-col items-stretch gap-1">
          {block.steps.map((s, i) => (
            <li key={i} className="flex flex-col items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="text-[#535353]">
                  ↓
                </span>
              )}
              <span className="w-full rounded border border-[#bdbdbd] px-3 py-1.5">
                <Rich text={s} gap={gap} />
              </span>
            </li>
          ))}
        </ol>
      );
  }
}

function OptionsBox({ group }: { group: QuestionGroup }) {
  if (!group.options?.length || group.options.every((o) => o.key === o.text)) return null;
  return (
    <div className="mb-2 border border-black px-3 py-2 text-sm">
      {group.optionsTitle && <b className="block">{group.optionsTitle}</b>}
      <ul>
        {group.options.map((o) => (
          <li key={o.key}>
            <b className="me-1.5">{o.key}</b>
            {o.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupView({ group, byId, jumpTo }: { group: QuestionGroup; byId: Map<string, ItemResult>; jumpTo: (n: number) => void }) {
  const byNumber = new Map(group.items.flatMap((i) => i.numbers.map((n) => [n, byId.get(i.id)] as const)));
  const gap = (n: number) => {
    const r = byNumber.get(n);
    if (!r) return <span>({n})</span>;
    return (
      <span className="inline-flex items-baseline">
        <QBadge item={r} onClick={() => jumpTo(n)} />
        <AnswerChip item={r} />
      </span>
    );
  };
  const rows = group.interaction !== "gap";
  return (
    <div className="mb-4">
      <p className="font-bold">{group.title}</p>
      <div className="mt-0.5 mb-2 text-sm whitespace-pre-line">
        <Rich text={group.instructions} gap={gap} />
      </div>
      <OptionsBox group={group} />
      {group.interaction === "gap" && (group.content ?? []).map((b, i) => <Block key={i} block={b} gap={gap} />)}
      {group.interaction === "diagram" && group.figure && (
        <div className="mb-2 max-w-[520px] [&_svg]:block [&_svg]:h-auto [&_svg]:w-full">
          <Figure id={group.figure} label="Diagram" />
        </div>
      )}
      {rows && (
        <ul className="text-[15px]">
          {group.items.map((item) => {
            const r = byId.get(item.id);
            if (!r) return null;
            return (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-[#ececec] py-1.5 last:border-0">
                <QBadge item={r} onClick={() => jumpTo(item.numbers[0])} />
                <span className="min-w-0 flex-1 basis-40">
                  {item.prompt ?? (group.interaction === "diagram" ? `Label ${item.numbers[0]}` : r.prompt)}
                  {item.options && item.options.some((o) => o.key !== o.text) && (
                    <span className="mt-0.5 block text-sm text-[#535353]">
                      {item.options.map((o) => (
                        <span key={o.key} className="block">
                          <b className="me-1.5">{o.key}</b>
                          {o.text}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="ms-auto shrink-0">
                  <AnswerChip item={r} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PassageBody({ stat, jumpTo }: { stat: PartStat; jumpTo: (n: number) => void }) {
  const { t } = useT();
  const { part, items } = stat;
  const paragraphs = part.passage?.paragraphs ?? [];
  const assigned = assignEvidence(
    paragraphs.map((p) => p.text),
    items,
  );
  const byId = new Map(items.map((i) => [i.itemId, i]));
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2">
      <div
        className="xl:max-h-[720px] xl:overflow-y-auto border-b border-[#d5d5d5] px-4 py-4 leading-[1.75] sm:px-[18px] xl:border-e xl:border-b-0"
        tabIndex={0}
        aria-label={part.passage?.title}
      >
        <p className="mb-3 font-bold">{part.passage?.title}</p>
        {part.passage?.subtitle && <p className="mb-3 italic">{part.passage.subtitle}</p>}
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-3 break-words">
            {p.label && <b className="me-1.5">{p.label}</b>}
            {splitByEvidence(p.text, assigned[i]).map((s, j) =>
              s.mark ? (
                <EvidenceMark key={j} items={s.mark.items} right={s.mark.right} prefix="r">
                  {s.text}
                </EvidenceMark>
              ) : (
                <span key={j}>{s.text}</span>
              ),
            )}
          </p>
        ))}
      </div>
      <div className="xl:max-h-[720px] xl:overflow-y-auto px-4 py-4 sm:px-[18px]" tabIndex={0} aria-label={t("results.report.questionsPanel")}>
        {part.groups.map((g) => (
          <GroupView key={g.id} group={g} byId={byId} jumpTo={jumpTo} />
        ))}
      </div>
    </div>
  );
}

export function ReadingReview({ section, items, score }: { section: Section; items: ItemResult[]; score: SkillScore }) {
  const { t, locale } = useT();
  const stats = useMemo(() => partStats(section, items), [section, items]);
  const statuses = useMemo(() => numberStatuses(items), [items]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const jump = (n: number) => {
    const part = stats.find((p) => p.items.some((i) => i.numbers.includes(n)));
    if (!part) return;
    if (!open.has(part.part.id)) flushSync(() => setOpen((prev) => new Set(prev).add(part.part.id)));
    if (!revealElement(`r-q${n}`)) revealElement(`r-part-${part.part.id}`);
  };

  return (
    <Card className="col-span-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-medium">{t("results.report.passagesTitle")}</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{t("results.report.passagesSub")}</p>
        </div>
        <span className="rounded-full bg-pink-tint px-3 py-1 text-[13px] font-semibold text-magenta">
          {t("results.report.scorePill", {
            raw: formatNumber(score.raw ?? 0, locale),
            total: formatNumber(score.total ?? 40, locale),
            band: formatBand(score.band, locale),
          })}
        </span>
      </div>
      <JumpStrip statuses={statuses} label={t("results.report.jumpToQuestionPassage")} onJump={jump} />
      <Legend rightLabel={t("results.report.legendFound")} wrongShows />

      {stats.map((stat) => {
        const { part, first, last, correct, total } = stat;
        const isOpen = open.has(part.id);
        return (
          <div key={part.id} id={`r-part-${part.id}`} className="mt-3.5 scroll-mt-5 overflow-hidden rounded-md border border-[#d5d5d5]">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`r-body-${part.id}`}
              onClick={() => toggle(part.id)}
              className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 bg-pink-tint px-4 py-2.5 text-start hover:bg-[#FFD9F3]"
            >
              <b>
                {t("results.report.passage", {
                  n: formatNumber(part.number, locale),
                })}
              </b>
              {part.passage && (
                <span className="min-w-0 text-sm" lang="en" dir="ltr">
                  {part.passage.title}
                </span>
              )}
              <span className="ms-auto flex items-center gap-2 text-[13px] text-[#535353]">
                {t("results.report.questions", {
                  from: formatNumber(first, locale),
                  to: formatNumber(last, locale),
                })}{" "}
                ·{" "}
                {t("results.report.partScore", {
                  correct: formatNumber(correct, locale),
                  total: formatNumber(total, locale),
                })}{" "}
                · {t(isOpen ? "results.report.close" : "results.report.open")}
                <ChevronDown aria-hidden="true" className={cn("size-4 motion-safe:transition-transform", isOpen && "rotate-180")} />
              </span>
            </button>
            {isOpen && (
              <div id={`r-body-${part.id}`} lang="en" dir="ltr" className="[font-family:Arial,Helvetica,sans-serif] text-base text-black">
                <PassageBody stat={stat} jumpTo={jump} />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
