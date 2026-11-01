import type { Locale, Skill } from "@/api/schemas";
import { formatBand, formatNumber, formatShortDate } from "@/lib/format";

/*
 * Band by skill as grouped bars: one group per test date, one bar per skill,
 * each skill in its own colour, with a dashed line at the target band. Drawn
 * as plain SVG after the mitooni canvas. Time runs left to right in both
 * languages, as on the other charts. Phones get the two latest tests only, so
 * the labels stay readable.
 */

const SKILL_BAR_COLOR: Record<Skill, string> = {
  listening: "#3E4FC4",
  reading: "#E95FC4",
  writing: "#D92F3A",
  speaking: "#4f9a2e",
};

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];
const H = 250;
const L = 42;
const BASE = 210;
const MIN = 3;
const MAX = 9;
const y = (b: number) => BASE - ((b - MIN) / (MAX - MIN)) * (BASE - 12);

type Series = { skill: Skill; points: { date: string; band: number }[] }[];

function Chart({
  series,
  skills,
  dates,
  width,
  labels,
  target,
  locale,
  targetLabel,
}: {
  series: Series;
  skills: Skill[];
  dates: string[];
  width: number;
  labels: Record<Skill, string>;
  target: number;
  locale: Locale;
  targetLabel: string;
}) {
  const R = width - 12;
  const bandAt = (skill: Skill, date: string) => series.find((s) => s.skill === skill)?.points.find((p) => p.date.slice(0, 10) === date)?.band;
  const span = (R - L) / Math.max(1, dates.length);
  const bw = 22;
  const gap = 6;
  const groupW = skills.length * bw + (skills.length - 1) * gap;
  const ty = y(target);
  const summary = [...skills.map((s) => `${labels[s]} ${dates.map((d) => formatBand(bandAt(s, d), locale)).join(", ")}`), targetLabel].join("; ");

  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="block h-auto w-full" role="img" aria-label={summary} direction="ltr">
      {[3, 4, 5, 6, 7, 8, 9].map((b) => (
        <g key={b}>
          <line x1={L} x2={R} y1={y(b)} y2={y(b)} stroke="var(--border)" />
          <text x={L - 8} y={y(b)} dy="0.355em" textAnchor="end" fill="var(--faint)" fontSize="11">
            {formatNumber(b, locale)}
          </text>
        </g>
      ))}
      {dates.map((d, gi) => {
        const cx = L + (gi + 0.5) * span;
        const x0 = cx - groupW / 2;
        return (
          <g key={d}>
            {skills.map((s, si) => {
              const b = bandAt(s, d);
              if (b === undefined) return null;
              const x = x0 + si * (bw + gap);
              const top = y(b);
              return (
                <g key={s}>
                  <path d={`M${x},${BASE} V${top + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${BASE} Z`} fill={SKILL_BAR_COLOR[s]}>
                    <title>{`${labels[s]} ${formatBand(b, locale)}, ${formatShortDate(d, locale)}`}</title>
                  </path>
                  <text x={x + bw / 2} y={top - 5} textAnchor="middle" fontSize="10" fill="#3a4855">
                    {formatBand(b, locale)}
                  </text>
                </g>
              );
            })}
            <text x={cx} y={BASE + 8} dy="0.71em" textAnchor="middle" fill="var(--faint)" fontSize="11">
              {formatShortDate(d, locale)}
            </text>
          </g>
        );
      })}
      <line x1={L} x2={R} y1={ty} y2={ty} stroke="var(--primary)" strokeDasharray="5 4" />
      <text x={R} y={ty - 14} textAnchor="end" fill="var(--primary)" fontSize="11">
        {targetLabel}
      </text>
    </svg>
  );
}

export function SkillBars({
  series,
  labels,
  target,
  locale,
  targetLabel,
  legendTarget,
  maxGroups = 5,
}: {
  series: Series;
  labels: Record<Skill, string>;
  target: number;
  locale: Locale;
  /** "target 7.0", already translated. */
  targetLabel: string;
  /** "Target", already translated. */
  legendTarget: string;
  maxGroups?: number;
}) {
  const skills = ORDER.filter((s) => series.some((x) => x.skill === s));
  const all = [...new Set(series.flatMap((s) => s.points.map((p) => p.date.slice(0, 10))))].sort();
  const common = { series, skills, labels, target, locale, targetLabel };
  return (
    <div>
      <div className="hidden sm:block">
        <Chart {...common} dates={all.slice(-maxGroups)} width={610} />
      </div>
      <div className="sm:hidden">
        <Chart {...common} dates={all.slice(-2)} width={330} />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {skills.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <i aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: SKILL_BAR_COLOR[s] }} />
            {labels[s]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden="true">
            <line x1="0" x2="22" y1="3" y2="3" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="5 4" />
          </svg>
          {legendTarget}
        </li>
      </ul>
    </div>
  );
}
