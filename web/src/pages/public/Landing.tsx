import { useState } from "react";
import { Link } from "react-router";
import {
  BarChart3,
  BookOpen,
  Clock,
  Contrast,
  FileText,
  GraduationCap,
  Headphones,
  Highlighter,
  Languages,
  ListChecks,
  Map,
  Mic,
  NotebookPen,
  PenLine,
  Route,
  SquareCheck,
  Target,
} from "lucide-react";
import { useT } from "@/i18n";
import type { Locale, QuestionType } from "@/api/schemas";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MkButton } from "@/layouts/PublicLayout";
import { Clouds, FaqItem, Section, body, bigTitle, cardTitle, eyebrow, statement } from "@/components/marketing";

function ShellPreview() {
  const nums = Array.from({ length: 13 }, (_, i) => i + 1);
  return (
    <div lang="en" dir="ltr" className="overflow-hidden rounded-2xl border border-black/10 bg-white text-[13px] text-black shadow-sm" aria-hidden="true" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <b className="text-[#d7282f]">IELTS</b>
        <span className="text-[#535353]">Test taker</span>
        <b className="mx-auto">52 minutes left</b>
      </div>
      <div className="border-y border-[#d5d5d5] bg-[#f1f2ec] px-4 py-2">
        <b className="block">Part 1</b>Read the text and answer questions 1–13.
      </div>
      <div className="grid grid-cols-[1fr_2px_1fr]">
        <div className="space-y-1.5 p-4">
          <b>Salt from the Sun</b>
          <div className="h-2 w-11/12 rounded bg-black/10" />
          <div className="h-2 w-10/12 rounded bg-black/10" />
          <div className="h-2 w-9/12 rounded bg-[#fff3a3]" />
          <div className="h-2 w-11/12 rounded bg-black/10" />
        </div>
        <div className="bg-black/50" />
        <div className="space-y-2 p-4">
          <b>Questions 1–5</b>
          {["TRUE", "FALSE", "NOT GIVEN"].map((o, i) => (
            <div key={o} className={cn("flex items-center gap-2 rounded-sm px-1.5 py-0.5", i === 1 && "bg-[#cfe0f3]")}>
              <i className={cn("size-3 rounded-full border border-black/60", i === 1 && "bg-[#418fc6]")} />
              {o}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 border-t border-[#d5d5d5] px-4 py-2.5 text-[#333]">
        <b className="me-2">Part 1</b>
        {nums.map((n) => (
          <span key={n} className={cn("relative px-1", n === 3 && "rounded-[3px] outline-2 outline-[#418fc6]")}>
            <i className={cn("absolute inset-x-0 -top-2 h-[3px]", n < 3 ? "bg-[#358e14]" : "bg-[#d5d5d5]")} />
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

const TAGS: [QuestionType, boolean][] = [
  ["matching-headings", true],
  ["tfng", false],
  ["summary-completion", false],
  ["plan-map-diagram-labelling", true],
  ["ynng", false],
  ["matching-sentence-endings", false],
  ["form-completion", false],
  ["multiple-choice", false],
  ["flow-chart-completion", true],
  ["short-answer", false],
  ["matching-features", false],
  ["note-completion", false],
];

function TagCloud() {
  const { t } = useT();
  return (
    <div className="flex flex-wrap justify-center gap-2.5" aria-hidden="true">
      {TAGS.map(([k, hot]) => (
        <span
          key={k}
          className={cn(
            "rounded-full px-4 py-2 font-archivo text-[16px] leading-6 font-medium",
            hot ? "bg-mk-orange text-[#181D1F]" : "bg-mk-card/80 text-mk-ink",
          )}
        >
          {t(`types.${k}`)}
        </span>
      ))}
    </div>
  );
}

function EssayCard({ note, example }: { note: string; example: string }) {
  return (
    <div className="relative mx-auto max-w-md" aria-hidden="true">
      <div lang="en" dir="ltr" className="rounded-2xl bg-mk-card p-5 text-start font-archivo text-[16px] leading-7 text-mk-ink shadow-sm">
        <span className="mb-2 block font-gabarito text-[12px] tracking-[0.1em] text-mk-body uppercase">Task 2 · band 6.0</span>
        Nowadays, <mark className="rounded bg-[#f8e4e7] px-0.5 text-[#181D1F] underline decoration-[#b23a48] decoration-2 underline-offset-4">in many countries the young adults</mark> continue to live with their
        parents until they are almost thirty years old.
      </div>
      <div className="ms-auto mt-3 w-[85%] rounded-2xl bg-mk-ink p-4 font-archivo text-[15px] leading-6 text-mk-page shadow-lg">
        <p>{note}</p>
        <p lang="en" dir="ltr" className="mt-1 text-start opacity-80">
          ✓ {example}
        </p>
      </div>
    </div>
  );
}

function BandCard({ label, locale }: { label: string; locale: Locale }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-mk-card p-6 shadow-sm" aria-hidden="true">
      <div className="font-gabarito text-[14px] font-semibold tracking-[0.1em] text-mk-body uppercase">{label}</div>
      <div className="mt-3 font-archivo text-[56px] leading-none font-semibold tracking-[-0.03em]" dir="ltr" style={{ textAlign: "start" }}>
        {formatBand(6, locale)} – {formatBand(7, locale)}
      </div>
      <div dir="ltr" className="relative mt-6 h-2.5 rounded-full bg-mk-ink/10">
        <div className="absolute inset-y-0 rounded-full bg-[#037BB5]" style={{ left: "66.6%", width: "11.1%" }} />
        <div className="absolute -top-1.5 h-5.5 w-0.5 bg-mk-ink" style={{ left: "77.7%" }} />
      </div>
      <div dir="ltr" className="mt-2 flex justify-between font-gabarito text-[12px] text-mk-body">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{formatNumber(i, locale)}</span>
        ))}
      </div>
    </div>
  );
}

function BilingualCard() {
  const [fa, setFa] = useState(true);
  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl bg-mk-card p-5 shadow-sm">
      <div className="mb-3 inline-flex rounded-full bg-mk-ink/5 p-1 font-gabarito text-[14px]" role="radiogroup" aria-label="Explanation language">
        {[
          ["fa", "فارسی"],
          ["en", "English"],
        ].map(([k, label]) => (
          <button
            key={k}
            role="radio"
            aria-checked={(k === "fa") === fa}
            onClick={() => setFa(k === "fa")}
            className={cn("rounded-full px-3 py-1", (k === "fa") === fa ? "bg-mk-ink text-mk-page" : "text-mk-body")}
            lang={k}
          >
            {label}
          </button>
        ))}
      </div>
      {fa ? (
        <p lang="fa" dir="rtl" className="text-[17px] leading-8 text-mk-ink">
          متن می‌گوید حوضچه‌های نمک <b>دست‌کم دو هزار سال</b> قدمت دارند؛ پس جملهٔ سؤال درست است. تلهٔ این سؤال این است که عدد به شکل دیگری بیان شده است.
        </p>
      ) : (
        <p lang="en" dir="ltr" className="font-archivo text-[17px] leading-7 text-mk-ink">
          The passage says salt pans are <b>at least two thousand years old</b>, so the statement is TRUE. The trap: the number is phrased differently.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const PILL_ROWS: { key: string; icon: typeof Clock; bg: string }[][] = [
  [
    { key: "full", icon: Clock, bg: "bg-[#D7CEF0]" },
    { key: "headings", icon: ListChecks, bg: "bg-[#FD956D]" },
    { key: "speaking", icon: Mic, bg: "bg-[#D5E2DA]" },
    { key: "task2", icon: PenLine, bg: "bg-[#F6E7CF]" },
    { key: "trend", icon: BarChart3, bg: "bg-[#DBE5F0]" },
    { key: "fa", icon: Languages, bg: "bg-[#F4E1E1]" },
  ],
  [
    { key: "tfng", icon: SquareCheck, bg: "bg-[#DCEEEF]" },
    { key: "sections", icon: BookOpen, bg: "bg-[#FDDBCE]" },
    { key: "map", icon: Map, bg: "bg-[#E4EED2]" },
    { key: "vocab", icon: NotebookPen, bg: "bg-[#D7CEF0]" },
    { key: "coach", icon: GraduationCap, bg: "bg-[#FD956D]" },
    { key: "time", icon: Clock, bg: "bg-[#DBE5F0]" },
  ],
  [
    { key: "task1", icon: FileText, bg: "bg-[#F6E7CF]" },
    { key: "review", icon: SquareCheck, bg: "bg-[#D5E2DA]" },
    { key: "notes", icon: Highlighter, bg: "bg-[#F4E1E1]" },
    { key: "practice", icon: Headphones, bg: "bg-[#DCEEEF]" },
    { key: "contrast", icon: Contrast, bg: "bg-[#E4EED2]" },
    { key: "plan", icon: Route, bg: "bg-[#FDDBCE]" },
  ],
];

export default function Landing() {
  const { t, locale } = useT();
  const [open, setOpen] = useState<number>(1);

  return (
    <>
      {/* Hero: sky gradient card, header floats over it */}
      <Section className="relative min-h-[min(816px,100svh)]">
        <div className="absolute inset-0 bg-[image:var(--mk-hero)]" />
        <Clouds />
        <div className="relative flex min-h-[min(816px,100svh)] flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
          <p className={cn(eyebrow, "text-[#083149] dark:text-[#cdeefe]")}>{t("mk.hero.eyebrow")}</p>
          <h1 className="mt-5 max-w-[1100px] bg-[image:var(--mk-hero-title)] bg-clip-text font-archivo text-[clamp(44px,8.6vw,128px)] leading-[1.09] font-semibold tracking-[-0.015em] text-transparent">
            {t("mk.hero.title")}
          </h1>
          <p className="mt-6 max-w-[720px] font-archivo text-[22px] leading-8 text-[#0b3a52] max-md:text-[18px] max-md:leading-7 dark:text-[#e3f5fd]">
            {t("mk.hero.sub")}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <MkButton to="/sign-up" className="px-7 py-3.5 text-[18px]">
              {t("mk.hero.cta")}
            </MkButton>
            <MkButton to="/how-it-works" light className="px-7 py-3.5 text-[18px]">
              {t("mk.hero.secondary")}
            </MkButton>
          </div>
        </div>
      </Section>

      {/* Why */}
      <Section className="relative bg-mk-peach">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
          {[
            { Icon: Headphones, cls: "start-[12%] top-[30%] -rotate-6" },
            { Icon: PenLine, cls: "start-[8%] top-[72%] rotate-6" },
            { Icon: Target, cls: "end-[11%] top-[24%] rotate-3" },
            { Icon: Mic, cls: "end-[14%] top-[66%] -rotate-3" },
          ].map(({ Icon, cls }, i) => (
            <span key={i} className={cn("absolute grid size-16 place-items-center rounded-2xl bg-mk-card shadow-md", cls)}>
              <Icon className="size-7 text-mk-ink" strokeWidth={1.6} />
            </span>
          ))}
        </div>
        <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-8 px-6 py-24 text-center max-md:py-16">
          <p className={eyebrow}>{t("mk.why.eyebrow")}</p>
          <p className={statement}>{t("mk.why.p1")}</p>
          <p className={statement}>{t("mk.why.p2")}</p>
          <span aria-hidden="true">
            <svg viewBox="0 0 32 32" className="size-8">
              <rect width="32" height="32" rx="8" fill="#037BB5" />
              <rect x="7" y="17" width="4.5" height="8" rx="2.25" fill="#fff" />
              <rect x="13.75" y="12" width="4.5" height="13" rx="2.25" fill="#fff" />
              <rect x="20.5" y="7" width="4.5" height="18" rx="2.25" fill="#FD956D" />
            </svg>
          </span>
          <p className={statement}>{t("mk.why.p3")}</p>
        </div>
      </Section>

      {/* Pair: exam screens, question types */}
      <section className="px-4 pb-4 max-md:px-3 max-md:pb-3">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 lg:grid-cols-2 max-md:gap-3">
          <div className="flex flex-col gap-10 rounded-[32px] bg-mk-beige p-12 max-md:p-7">
            <div>
              <h2 className={cardTitle}>{t("mk.shell.title")}</h2>
              <p className={cn(body, "mt-4 max-w-xl")}>{t("mk.shell.body")}</p>
            </div>
            <div className="mt-auto">
              <ShellPreview />
            </div>
          </div>
          <div className="flex flex-col gap-10 rounded-[32px] bg-mk-lavender p-12 max-md:p-7">
            <div>
              <h2 className={cardTitle}>{t("mk.types.title")}</h2>
              <p className={cn(body, "mt-4 max-w-xl")}>{t("mk.types.body")}</p>
            </div>
            <div className="mt-auto">
              <TagCloud />
            </div>
          </div>
        </div>
      </section>

      {/* Pair: feedback, band */}
      <section className="px-4 pb-4 max-md:px-3 max-md:pb-3">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 lg:grid-cols-2 max-md:gap-3">
          <div className="flex flex-col gap-10 rounded-[32px] bg-mk-blue p-12 max-md:p-7">
            <div>
              <h2 className={cardTitle}>{t("mk.feedback.title")}</h2>
              <p className={cn(body, "mt-4 max-w-xl")}>{t("mk.feedback.body")}</p>
            </div>
            <div className="mt-auto">
              <EssayCard note={t("mk.feedback.note")} example={t("mk.feedback.noteExample")} />
            </div>
          </div>
          <div className="flex flex-col gap-10 rounded-[32px] bg-mk-sage p-12 max-md:p-7">
            <div>
              <h2 className={cardTitle}>{t("mk.band.title")}</h2>
              <p className={cn(body, "mt-4 max-w-xl")}>{t("mk.band.body")}</p>
            </div>
            <div className="mt-auto">
              <BandCard label={t("mk.band.label")} locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* Persian speakers */}
      <Section className="bg-mk-pink">
        <div className="grid grid-cols-1 items-center gap-10 p-12 max-md:p-7 lg:grid-cols-2">
          <div>
            <h2 className={cardTitle}>{t("mk.persian.title")}</h2>
            <p className={cn(body, "mt-4 max-w-xl")}>{t("mk.persian.body")}</p>
          </div>
          <BilingualCard />
        </div>
      </Section>

      {/* What's inside */}
      <Section className="bg-mk-beige">
        <div className="flex flex-col items-center px-6 pt-24 text-center max-md:pt-16">
          <p className={eyebrow}>{t("mk.inside.eyebrow")}</p>
          <h2 className={cn(bigTitle, "mt-4 max-w-[860px]")}>{t("mk.inside.title")}</h2>
          <p className={cn(body, "mt-5 max-w-[620px]")}>{t("mk.inside.body")}</p>
        </div>
        <div className="relative mt-12 flex flex-col gap-4 pb-24 max-md:pb-16">
          {PILL_ROWS.map((row, r) => (
            <div key={r} className={cn("flex justify-center gap-4", r === 1 ? "ms-[-140px]" : r === 2 ? "ms-[120px]" : "")}>
              {row.map(({ key, icon: Icon, bg }) => (
                <div key={key} className="flex shrink-0 items-center gap-4 rounded-2xl bg-mk-card py-2 ps-2 pe-6 shadow-sm">
                  <span className={cn("grid size-14 place-items-center rounded-xl text-[#181D1F]", bg)}>
                    <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className="font-archivo text-[18px] leading-6 font-medium whitespace-nowrap">{t(`mk.inside.pills.${key}`)}</span>
                </div>
              ))}
            </div>
          ))}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 w-32 bg-gradient-to-r from-mk-beige to-transparent rtl:bg-gradient-to-l" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-32 bg-gradient-to-l from-mk-beige to-transparent rtl:bg-gradient-to-r" />
        </div>
      </Section>

      {/* Start: dark card */}
      <Section className="bg-[#181D1F] dark:bg-[#0b2c3d]">
        <div className="relative grid grid-cols-1 items-center gap-10 p-14 max-md:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className={cn(cardTitle, "text-white")}>{t("mk.start.title")}</h2>
            <p className="mt-4 max-w-xl font-archivo text-[20px] leading-7 text-white/75 max-[1200px]:text-[16px] max-[1200px]:leading-6">{t("mk.start.body")}</p>
            <MkButton to="/sign-up" light className="mt-8 px-7 py-3.5 text-[18px]">
              {t("mk.start.cta")}
            </MkButton>
          </div>
          <div aria-hidden="true" className="grid grid-cols-4 gap-3">
            {(
              [
                ["L", 7],
                ["R", 6.5],
                ["W", 6],
                ["S", 6.5],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/[0.08] p-4 text-white">
                <div className="font-gabarito text-[14px] tracking-[0.1em] text-white/60">{k}</div>
                <div className="mt-2 font-archivo text-[32px] leading-none font-semibold" dir="ltr">
                  {formatBand(v, locale)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Yes, you */}
      <Section className="bg-mk-butter">
        <div className="flex flex-col items-center px-6 py-28 text-center max-md:py-16">
          <p className={eyebrow}>{t("mk.you.eyebrow")}</p>
          <h2 className={cn(bigTitle, "mt-4 max-w-[860px]")}>{t("mk.you.title")}</h2>
          <p className={cn(body, "mt-5")}>{t("mk.you.sub")}</p>
        </div>
      </Section>

      {/* Report */}
      <Section className="bg-mk-green">
        <div className="flex flex-col items-center px-6 pt-20 text-center max-md:pt-14">
          <p className={eyebrow}>{t("mk.report.eyebrow")}</p>
          <h2 className={cn(bigTitle, "mt-4")}>{t("mk.report.title")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-12 pt-12 pb-20 sm:grid-cols-2 lg:grid-cols-4 max-md:px-6 max-md:pb-14">
          {(["c1", "c2", "c3", "c4"] as const).map((k) => (
            <div key={k} className="flex min-h-56 flex-col justify-between rounded-3xl border border-mk-ink p-6">
              <p className="font-archivo text-[20px] leading-7 text-mk-ink max-[1200px]:text-[16px] max-[1200px]:leading-6">{t(`mk.report.${k}`)}</p>
              <p className="mt-6 font-gabarito text-[14px] leading-[18px] tracking-[0.1em] text-mk-body uppercase">{t(`mk.report.${k}Label`)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="scroll-mt-28 bg-mk-teal">
        <div className="flex flex-col items-center px-6 pt-20 text-center max-md:pt-14">
          <p className={eyebrow}>{t("mk.faq.eyebrow")}</p>
          <h2 className={cn(bigTitle, "mt-4")}>{t("mk.faq.title")}</h2>
        </div>
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 px-6 pt-12 pb-20 max-md:pb-14">
          {[1, 2, 3, 4, 5].map((n) => (
            <FaqItem key={n} q={t(`mk.faq.q${n}`)} a={t(`mk.faq.a${n}`)} open={open === n} onToggle={() => setOpen(open === n ? 0 : n)} />
          ))}
          <Link to="/how-it-works" className="mt-3 self-center font-archivo text-[18px] font-medium underline underline-offset-4">
            {t("mk.faq.more")}
          </Link>
        </div>
      </Section>
    </>
  );
}
