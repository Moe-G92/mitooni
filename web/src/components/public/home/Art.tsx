import { Link } from "react-router";
import type { QuestionType } from "@/api/schemas";
import { useT } from "@/i18n";
import { mockupStrings } from "./mockup";
import { formatBand, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Rich } from "@/components/public/ui";
import "./home.css";

/*
 * Illustrations for the landing page (canvas Main.dc.html). All decorative.
 * The product mock-ups (dashboard, answer sheet, report, "Ready to book?")
 * stay English and left to right on the Persian page too, as on MainFa.
 */

const PAPER_SHADOW = "shadow-[0_14px_30px_rgba(11,42,62,0.2)]";
/** The learner's handwriting on the Writing answer sheet (canvas: Caveat, then system hands). */
const HAND = "'Caveat', 'Segoe Print', 'Bradley Hand', cursive";

function CheckDisc({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-[#4f9a2e]", className)} style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

const SHEET: { a: React.ReactNode; ok: boolean }[] = [
  { a: "Tilbrook", ok: true },
  { a: "37", ok: true },
  { a: "Thursday", ok: true },
  {
    a: (
      <>
        <s className="text-[#B8232D]">magazine</s> newspaper
      </>
    ),
    ok: false,
  },
  { a: "latex", ok: true },
];

/** Hero: a practice book, a Listening answer sheet being marked and the "Band score 7.0" stamp. */
export function HeroBook() {
  const { t } = useT();
  return (
    <div role="img" aria-label={t("mk.home.hero.art")} lang="en" dir="ltr" className="mk-en relative mx-auto h-[500px] w-full max-w-[440px] max-sm:h-[420px] max-sm:max-w-[343px]">
      <div aria-hidden="true" className="contents">
        <div className="hm-back absolute top-[38px] left-[6%] h-[410px] w-[300px] rounded-[6px_16px_16px_6px] bg-[linear-gradient(160deg,#4a3d8f_0%,#2d2463_100%)] shadow-[0_18px_36px_rgba(11,42,62,0.18)] max-sm:h-[340px] max-sm:w-[250px]" />
        <div className={cn("hm-sheet absolute right-0 bottom-1.5 z-[2] w-[210px] rounded-[10px] bg-white px-4 py-3.5 text-[12px] text-black max-sm:w-[190px]", PAPER_SHADOW)} style={{ fontFamily: "Arial, sans-serif" }}>
          <div className="text-[13px] font-bold text-primary">Answer sheet · Listening</div>
          <div className="mt-2 grid grid-cols-[22px_1fr_18px] items-center gap-y-[5px]">
            {SHEET.map((row, i) => (
              <div key={i} className="contents">
                <b>{i + 1}</b>
                <span className="border-b border-periwinkle">
                  <span className="hm-w" style={{ animationDelay: `${(i * 0.467).toFixed(2)}s` }}>
                    {row.a}
                  </span>
                </span>
                <span className={cn("font-bold", row.ok ? "text-[#2c6e1a]" : "text-[#B8232D]")}>
                  <span className="hm-t" style={{ animationDelay: `${(i * 0.467).toFixed(2)}s` }}>
                    {row.ok ? "✓" : "✗"}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="hm-band pointer-events-none absolute top-[56%] left-[52%] z-[3] rounded-lg border-4 border-coral bg-white/55 px-3.5 pt-1 pb-1.5 text-center whitespace-nowrap text-coral uppercase mix-blend-multiply outline-2 outline-offset-[3px] outline-coral font-archivo">
            <div className="text-[11px] font-extrabold tracking-[0.3em]">BAND SCORE</div>
            <div className="text-[46px] leading-none font-black tracking-[-0.01em]">7.0</div>
          </div>
        </div>
        <div className="hm-front absolute top-2.5 left-[14%] z-[1] flex h-[420px] w-[300px] overflow-hidden rounded-[6px_18px_18px_6px] bg-[linear-gradient(135deg,#1c1c1f_0%,#2b2c30_38%,#222326_38%,#303135_62%,#26272a_62%,#2e2f33_100%)] text-white shadow-[0_24px_48px_rgba(11,42,62,0.3)] max-sm:left-[4%] max-sm:h-[350px] max-sm:w-[250px]">
          <div className="w-[22px] flex-none bg-[#7b6fc0] shadow-[inset_-3px_0_0_rgba(0,0,0,0.25)]" />
          <div className="relative flex flex-1 flex-col px-6 py-7 font-archivo max-sm:px-5 max-sm:py-6">
            <div className="absolute right-0 bottom-0 size-[170px] bg-[linear-gradient(135deg,transparent_50%,#3d2f7a_50%)] opacity-95" />
            <div className="absolute right-0 bottom-0 size-[120px] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.06)_0_8px,transparent_8px_16px)] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
            <div className="flex items-center gap-2">
              <svg width="30" height="30" viewBox="0 0 120 120" aria-hidden="true">
                <path d="M60 2 C104 2 118 16 118 60 C118 104 104 118 60 118 C16 118 2 104 2 60 C2 16 16 2 60 2 Z" fill="#ffffff" />
                <polyline points="30,86 30,48 56,74 84,40" fill="none" stroke="#2b2c30" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="70,34 96,25 92,51" fill="#7b6fc0" stroke="#7b6fc0" strokeWidth="4" strokeLinejoin="round" />
                <circle cx="92" cy="86" r="7" fill="#7b6fc0" />
              </svg>
              <b className="text-[16px]">mitooni</b>
            </div>
            <div className="mt-10 text-[15px] font-bold tracking-[0.14em] text-[#a79be0] uppercase max-sm:mt-7">PRACTICE BOOK</div>
            <div className="mt-1 text-[64px] leading-none font-black tracking-[-0.02em] max-sm:text-[52px]">IELTS</div>
            <div className="mt-1.5 text-[22px] leading-[1.1] font-bold text-[#a79be0] max-sm:text-[19px]">Practice Tests</div>
            <div className="mt-2.5 border-y border-[#a79be0]/50 py-1.5 text-[14px] opacity-95 max-sm:text-[12.5px]">Academic &amp; General Training</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DASH_ROWS: { type: QuestionType; pct: number; level: "weakness" | "fair" | "strength" }[] = [
  { type: "matching-headings", pct: 48, level: "weakness" },
  { type: "matching-information", pct: 62, level: "weakness" },
  { type: "tfng", pct: 70, level: "fair" },
  { type: "summary-completion", pct: 84, level: "strength" },
  { type: "sentence-completion", pct: 88, level: "strength" },
];

const LEVEL_STYLE = {
  weakness: "bg-[#FFE3E3] text-[#B8232D]",
  fair: "bg-[#FDFFC7] text-[#5c5a00]",
  strength: "bg-[#e6f7de] text-[#2c6e1a]",
};

/** A tablet showing the dashboard: question-type bars, band trend and the next drill. */
export function DashboardMock() {
  const { t, locale } = mockupStrings();
  const pct = (n: number) => formatNumber(n / 100, locale, { style: "percent" });
  return (
    <div aria-hidden="true" lang="en" dir="ltr" className="mk-en w-full min-w-0 rounded-[18px] bg-[#1d2126] p-3 shadow-[0_16px_32px_rgba(11,42,62,0.15)] max-sm:p-2">
      <div className="flex flex-col gap-3 rounded-lg bg-background p-[18px] font-archivo max-sm:p-2.5">
        <div className="rounded-xl border border-border bg-white p-4 max-sm:p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="text-[9px] text-primary">{t("mk.home.dash.title")}</b>
            <div className="flex flex-wrap gap-1 text-[7px] font-semibold">
              {(["reading", "listening", "writing", "speaking"] as const).map((s, i) => (
                <span key={s} className={cn("rounded-full px-[7px] py-0.5", i === 0 ? "bg-primary text-white" : "bg-pale-wisteria text-primary")}>
                  {t(`skills.${s}`)}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-1.5 mb-3 text-[6.5px] text-muted-foreground">
            {t("mk.home.dash.note")} · <span className="font-bold text-primary">|</span> {t("mk.home.dash.target", { n: pct(80) })}
          </div>
          <div className="flex flex-col gap-1.5">
            {DASH_ROWS.map((r) => (
              <div key={r.type} className="grid grid-cols-[minmax(0,92px)_1fr_24px_44px] items-center gap-1.5 text-[7.5px]">
                <span className="truncate text-foreground">{t(`types.${r.type}`)}</span>
                <div className="relative h-1.5 rounded-full bg-pale-wisteria">
                  <div className={cn("h-full rounded-full", r.level === "weakness" ? "bg-coral" : "bg-[#E95FC4]")} style={{ width: `${r.pct}%` }} />
                  <div className="absolute -inset-y-1 w-0.5 bg-primary" style={{ insetInlineStart: "80%" }} />
                </div>
                <b className="text-end text-foreground">{pct(r.pct)}</b>
                <span className={cn("justify-self-start rounded-full px-[5px] py-px text-[6.5px] font-bold", LEVEL_STYLE[r.level])}>{t(`strength.${r.level}`)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1.3fr_1fr] gap-3 max-sm:gap-2">
          <div className="rounded-xl border border-border bg-white px-3.5 py-3 max-sm:px-2.5">
            <div className="flex flex-wrap justify-between gap-x-2 text-[12px] max-sm:text-[10px]">
              <b className="text-primary">{t("mk.home.dash.overall")}</b>
              <span className="font-bold text-[#2c6e1a]">{t("mk.home.dash.since", { n: formatBand(1, locale) })}</span>
            </div>
            <svg viewBox="0 0 240 80" width="100%" height="80" className="mt-1.5 block" style={{ direction: "ltr" }}>
              <line x1="10" y1="12" x2="230" y2="12" stroke="#D92F3A" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x="230" y="9" textAnchor="end" fontSize="9" fill="#B8232D" fontFamily="'Archivo Variable', 'Vazirmatn Variable', sans-serif">
                {t("mk.home.dash.targetBand", { n: formatBand(7, locale) })}
              </text>
              <polyline points="20,68 90,48 160,48 225,28" fill="none" stroke="#3E4FC4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <g fill="#3E4FC4">
                <circle cx="20" cy="68" r="4" />
                <circle cx="90" cy="48" r="4" />
                <circle cx="160" cy="48" r="4" />
                <circle cx="225" cy="28" r="5" fill="#D92F3A" />
              </g>
              <g fontSize="9" fill="#556170" fontFamily="'Archivo Variable', 'Vazirmatn Variable', sans-serif" textAnchor="middle">
                <text x="20" y="79">{formatBand(5.5, locale)}</text>
                <text x="90" y="40">{formatBand(6, locale)}</text>
                <text x="160" y="40">{formatBand(6, locale)}</text>
                <text x="225" y="20">{formatBand(6.5, locale)}</text>
              </g>
            </svg>
          </div>
          <div className="flex flex-col justify-between gap-2 rounded-xl bg-primary px-3.5 py-3 text-white max-sm:px-2.5">
            <div className="text-[10px] tracking-[0.1em] uppercase opacity-85">{t("mk.home.dash.focus")}</div>
            <div className="text-[15px] leading-[1.3] font-bold max-sm:text-[12px]">{t("mk.home.dash.drill")}</div>
            <div className="text-[12px] opacity-90 max-sm:text-[10px]">{t("mk.home.dash.drillMeta", { min: formatNumber(10, locale), q: formatNumber(7, locale) })}</div>
            <span className="self-start rounded-full bg-coral px-3 py-[5px] text-[12px] font-bold max-sm:text-[10px]">{t("mk.home.dash.start")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A Task 2 answer sheet with a feedback note and the 6.0 stamp. */
export function WritingSheet() {
  const { t } = mockupStrings();
  return (
    <div aria-hidden="true" lang="en" dir="ltr" className="mk-en relative min-w-0 px-1.5 pt-2 pb-3.5">
      <div className="absolute inset-[14px_2px_6px_12px] rotate-2 rounded-[2px] bg-[#f1ede4] shadow-[0_10px_24px_rgba(11,42,62,0.10)]" />
      <div className="relative -rotate-[0.6deg] rounded-[2px] bg-[#fffefb] px-[18px] pt-4 pb-3.5 font-archivo text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08),0_18px_34px_rgba(11,42,62,0.16)] max-sm:px-3">
        <div lang="en" dir="ltr" className="flex items-end justify-between gap-2.5 border-b-2 border-foreground pb-1.5">
          <div>
            <div className="text-[15px] font-extrabold tracking-[0.02em] max-sm:text-[13px]">WRITING ANSWER SHEET</div>
            <div className="font-gabarito text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">ACADEMIC &amp; GENERAL · PRACTICE PAPER</div>
          </div>
          <div className="border-2 border-foreground px-2.5 py-0.5 text-[13px] font-extrabold whitespace-nowrap">TASK 2</div>
        </div>
        <div className="mt-2.5 border border-[#c9ced6] bg-white bg-[repeating-linear-gradient(180deg,transparent_0,transparent_27px,#d6dbe3_27px,#d6dbe3_28px)] bg-[position:0_4px] px-3 pt-1 pb-3">
          <div className="text-left text-[23px] leading-7 font-medium text-[#1f2a6b] max-sm:text-[20px]" style={{ fontFamily: HAND }}>
            Nowadays,{" "}
            <mark className="rounded bg-[#FFC4EC] px-0.5 text-foreground underline decoration-coral decoration-2 underline-offset-4">in many countries the young adults</mark> continue to live with their parents
            until they are almost thirty years old.
          </div>
          <div className="mt-2.5">
            <div className="hm-bubble relative rounded-[14px] border border-s-4 border-[#EDE3D0] border-s-primary bg-[#FBF7EF] px-4 py-3 text-foreground">
              <span className="absolute -top-2 size-3.5 rotate-45 border-s border-t border-[#EDE3D0] bg-[#FBF7EF]" style={{ insetInlineStart: 110 }} />
              <div className="text-[15px] leading-[22px] max-sm:text-[14px]">
                <p className="m-0">
                  <b className="text-primary">{t("mk.home.note.kind")}</b> · {t("mk.home.note.text")}
                </p>
                <p lang="en" dir="ltr" className="hm-fix mt-2 mb-0 text-left">
                  <span className="inline-block rounded-[10px] bg-[#e6f7de] px-2.5 py-[3px] font-semibold text-[#2c6e1a]">✓ in many countries, young adults</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hm-stamp pointer-events-none absolute end-[22px] bottom-[18px] z-[3] rounded-lg border-4 border-coral bg-white/55 px-3 pt-[3px] pb-[5px] text-center whitespace-nowrap text-coral uppercase mix-blend-multiply outline-2 outline-offset-[3px] outline-coral font-archivo" lang="en">
          <div className="text-[10px] font-extrabold tracking-[0.3em]">BAND SCORE</div>
          <div className="text-[38px] leading-none font-black">6.0</div>
        </div>
      </div>
    </div>
  );
}

const DONUT = [
  { key: "correct", n: 27, color: "#4f9a2e", dash: "252.5 124.5", off: "0" },
  { key: "matching-headings", n: 6, color: "#D92F3A", dash: "54.5 322.4", off: "-254.5" },
  { key: "tfng", n: 4, color: "#E95FC4", dash: "35.7 341.3", off: "-311" },
  { key: "matching-information", n: 3, color: "#3E4FC4", dash: "26.3 350.7", off: "-348.7" },
] as const;

const BANDS = [
  { skill: "listening", band: 7, color: "#3E4FC4", text: "text-primary" },
  { skill: "reading", band: 6.5, color: "#E95FC4", text: "text-magenta" },
  { skill: "writing", band: 6, color: "#D92F3A", text: "text-[#B8232D]" },
  { skill: "speaking", band: 6.5, color: "#4f9a2e", text: "text-[#2c6e1a]" },
] as const;

/** Sample mock report: where the Reading marks went, bands against target, analysis and next step. */
export function ReportCard() {
  const { t, locale } = mockupStrings();
  const pos = (band: number) => `${((band / 9) * 100).toFixed(1)}%`;
  return (
    <div lang="en" dir="ltr" className="mk-en mt-9 overflow-hidden rounded-[28px] border border-border bg-white font-archivo text-foreground shadow-[0_20px_44px_rgba(43,36,112,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-midnight-iris px-7 py-[18px] text-white max-sm:px-5">
        <div>
          <div className="text-[12px] tracking-[0.12em] uppercase opacity-85">{t("mk.home.report.meta", { n: formatNumber(4, locale) })}</div>
          <h3 className="m-0 text-[20px] font-bold">{t("mk.home.report.name")}</h3>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-[13px] opacity-90">{t("mk.home.report.overall")}</span>
          <span className="text-[40px] leading-none font-extrabold">{formatBand(6.5, locale)}</span>
          <span className="hm-target inline-block rounded-full bg-canary-yellow px-2.5 py-1 text-[12px] font-bold text-midnight-iris">
            {t("mk.home.report.target", { n: formatBand(7, locale) })}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))]">
        <div className="border-e border-[#eef0f3] px-7 py-6 max-sm:px-5">
          <h4 className="m-0 font-gabarito text-[12px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{t("mk.home.report.marksTitle")}</h4>
          <div className="mt-3.5 flex flex-wrap items-center gap-[22px]">
            <div className="relative size-40 flex-none">
              <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                {DONUT.map((d) => (
                  <circle key={d.key} cx="80" cy="80" r="60" fill="none" stroke={d.color} strokeWidth="22" strokeDasharray={d.dash} strokeDashoffset={d.off} transform="rotate(-90 80 80)" />
                ))}
              </svg>
              <div className="absolute inset-0 grid place-content-center text-center">
                <span className="sr-only">{t("mk.home.report.outOf", { n: formatNumber(27, locale), total: formatNumber(40, locale) })}</span>
                <b aria-hidden="true" dir="ltr" className="text-[30px] leading-none tabular-nums [&:lang(fa)]:text-[25px]">
                  <span className="hm-cnt" />/{formatNumber(40, locale)}
                </b>
                <span className="hm-bandpop mt-1 justify-self-center rounded-full bg-midnight-iris px-2.5 py-0.5 text-[13px] font-bold text-white">
                  {t("mk.home.report.band", { n: formatBand(6.5, locale) })}
                </span>
              </div>
            </div>
            <ul className="m-0 flex min-w-[190px] flex-1 list-none flex-col gap-2 p-0 text-[14px] text-[#3a4855]">
              {DONUT.map((d) => (
                <li key={d.key} className="flex items-center gap-2">
                  <i className="size-2.5 rounded-[3px]" style={{ background: d.color }} />
                  <span className="flex-1">{d.key === "correct" ? t("mk.home.report.correct") : t(`types.${d.key}`)}</span>
                  <b className="text-foreground">{formatNumber(d.n, locale)}</b>
                </li>
              ))}
            </ul>
          </div>
          <h4 className="mt-[22px] mb-0 font-gabarito text-[12px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{t("mk.home.report.bandsTitle")}</h4>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
            {BANDS.map((b) => (
              <li key={b.skill} className="grid grid-cols-[auto_1fr_32px] items-center gap-2 text-[14px]">
                <span className={cn("min-w-[74px] font-bold", b.text)}>{t(`skills.${b.skill}`)}</span>
                <div className="relative h-2 rounded-full bg-pale-wisteria">
                  <div className="hm-bar h-full rounded-full" style={{ width: pos(b.band), background: b.color }} />
                  <div className="absolute -inset-y-1 w-0.5 bg-midnight-iris" style={{ insetInlineStart: pos(7) }} />
                </div>
                <b className="hm-num text-end">{formatBand(b.band, locale)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#FBF7EF] px-7 py-6 max-sm:px-5">
          <h4 className="m-0 font-gabarito text-[12px] font-bold tracking-[0.1em] text-muted-foreground uppercase">{t("mk.home.report.analysis")}</h4>
          <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0 text-[15px] leading-[23px] text-[#3a4855] [&_b]:text-foreground">
            {(["a1", "a2", "a3"] as const).map((k) => (
              <li key={k} className="flex gap-2.5">
                <CheckDisc />
                <span>
                  <Rich text={t(`mk.home.report.${k}`)} />
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-midnight-iris px-4 py-3.5 text-white">
            <div>
              <div className="text-[11px] tracking-[0.1em] uppercase opacity-85">{t("mk.home.report.next")}</div>
              <div className="text-[16px] font-bold">{t("mk.home.report.nextTitle", { n: formatNumber(10, locale) })}</div>
            </div>
            <Link to="/app/results" className="rounded-full bg-coral px-4 py-2 text-[14px] font-bold text-white no-underline hover:bg-[#B8232D] hover:text-white">
              {t("mk.home.report.seeFull")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Ready to book?" card with four skills on target. */
export function ReadyCard() {
  const { t, locale } = mockupStrings();
  const rows = [
    ["listening", 7],
    ["reading", 7],
    ["writing", 7],
    ["speaking", 7.5],
  ] as const;
  return (
    <div aria-hidden="true" lang="en" dir="ltr" className="mk-en relative box-border w-full max-w-[380px] -rotate-2 justify-self-center rounded-3xl bg-white px-6 pt-[22px] pb-5 font-archivo text-foreground shadow-[0_18px_40px_rgba(0,0,0,0.25)] max-sm:px-5">
      <div className="flex items-center justify-between gap-2.5">
        <b className="text-[18px]">{t("mk.home.ready.card")}</b>
        <span className="text-[13px] text-muted-foreground">{t("mk.home.ready.target", { n: formatBand(7, locale) })}</span>
      </div>
      <ul className="m-0 mt-3 list-none p-0">
        {rows.map(([s, b]) => (
          <li key={s} className="flex items-center gap-2.5 border-b border-dashed border-border py-[9px]">
            <CheckDisc />
            <span className="flex-1 text-[16px] text-[#3a4855]">{t(`skills.${s}`)}</span>
            <b className="text-[16px]">{formatBand(b, locale)}</b>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2.5 rounded-2xl bg-[#e6f7de] px-3.5 py-3">
        <span className="text-[15px] font-bold text-[#2c6e1a]">{t("mk.home.ready.yes")}</span>
        <span className="text-[26px] font-extrabold text-[#2c6e1a]">{formatBand(7, locale)}</span>
      </div>
    </div>
  );
}
