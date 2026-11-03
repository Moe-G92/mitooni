import {
  Bar as RBar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Locale } from "@/api/schemas";
import { formatBand, formatNumber, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Charts for the learner pages, drawn with Recharts (what shadcn/ui charts use)
 * and coloured from the theme tokens (day mode only).
 * Time axes stay left to right in both languages.
 */

const axisTick = { fill: "var(--faint)", fontSize: 11 };

/** Band scale 0–9 with the predicted range and a target tick, as in the dashboard mockup. */
export function BandScale({ low, high, target, locale }: { low: number; high: number; target: number; locale: Locale }) {
  const pct = (b: number) => `${(b / 9) * 100}%`;
  return (
    <div dir="ltr">
      <div className="relative mt-5.5 mb-2 h-2.5 rounded-[5px] bg-border" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-[5px] bg-primary" style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }} />
        <div className="absolute -top-1.5 h-5.5 w-0.5 bg-foreground" style={{ left: pct(target) }} />
      </div>
      <div className="flex justify-between font-mono text-[11px] text-faint" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{formatNumber(i, locale)}</span>
        ))}
      </div>
    </div>
  );
}

export function SkillRadar({
  data,
  locale,
  labels,
}: {
  data: { skill: string; band: number | null; target: number }[];
  locale: Locale;
  labels: Record<string, string>;
}) {
  // L, R, W, S is the shorthand IELTS learners use in both languages.
  const rows = data.map((d) => ({ name: labels[d.skill], short: d.skill.slice(0, 1).toUpperCase(), band: d.band ?? 0, target: d.target }));
  return (
    <div dir="ltr" className="h-[220px] w-full" role="img" aria-label={rows.map((r) => `${r.name} ${formatBand(r.band, locale)}`).join(", ")}>
      <ResponsiveContainer>
        <RadarChart data={rows} outerRadius="72%">
          <PolarGrid gridType="polygon" stroke="var(--border)" />
          <PolarAngleAxis dataKey="short" tick={{ fill: "var(--muted-foreground)", fontSize: 14, fontWeight: 500 }} />
          <Radar dataKey="target" stroke="var(--foreground)" strokeDasharray="4 4" strokeWidth={1.2} fill="none" isAnimationActive={false} />
          <Radar dataKey="band" stroke="var(--primary)" strokeWidth={2} fill="var(--primary)" fillOpacity={0.18} dot={{ r: 3.5, fill: "var(--primary)" }} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BandTrend({
  points,
  target,
  locale,
  targetLabel,
  height = 170,
  onPoint,
}: {
  points: { date: string; band: number; attemptId?: string }[];
  target: number;
  locale: Locale;
  targetLabel: string;
  height?: number;
  onPoint?: (attemptId: string) => void;
}) {
  const rows = points.map((p) => ({ ...p, label: formatShortDate(p.date, locale) }));
  const min = Math.max(0, Math.floor(Math.min(target, ...points.map((p) => p.band)) - 1));
  const max = Math.min(9, Math.ceil(Math.max(target, ...points.map((p) => p.band)) + 1));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 16, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis domain={[min, max]} ticks={Array.from({ length: max - min + 1 }, (_, i) => min + i)} tick={axisTick} axisLine={false} tickLine={false} />
          <ReferenceLine
            y={target}
            stroke="var(--foreground)"
            strokeDasharray="4 4"
            label={{ value: targetLabel, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 }}
            formatter={(v) => [formatBand(Number(v), locale), ""]}
            separator=""
          />
          <Line
            type="linear"
            dataKey="band"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--primary)", cursor: onPoint ? "pointer" : undefined }}
            activeDot={{
              r: 5,
              onClick: (_e: unknown, payload: unknown) => {
                const id = (payload as { payload?: { attemptId?: string } })?.payload?.attemptId;
                if (id && onPoint) onPoint(id);
              },
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SKILL_COLORS: Record<string, string> = {
  listening: "var(--chart-1)",
  reading: "var(--chart-2)",
  writing: "var(--chart-4)",
  speaking: "var(--chart-3)",
};
const SKILL_DASH: Record<string, string | undefined> = { listening: undefined, reading: "6 3", writing: "2 3", speaking: "8 3 2 3" };

/** One line per skill; dash patterns back up the colours for colour-blind readers. */
export function SkillTrend({
  series,
  labels,
  locale,
  height = 240,
}: {
  series: { skill: string; points: { date: string; band: number }[] }[];
  labels: Record<string, string>;
  locale: Locale;
  height?: number;
}) {
  const dates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date.slice(0, 10))))].sort();
  const rows = dates.map((d) => {
    const row: Record<string, number | string> = { label: formatShortDate(d, locale) };
    for (const s of series) {
      const p = s.points.find((x) => x.date.slice(0, 10) === d);
      if (p) row[s.skill] = p.band;
    }
    return row;
  });
  return (
    <div>
      <div dir="ltr" style={{ height }} className="w-full">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis domain={[3, 9]} ticks={[3, 4, 5, 6, 7, 8, 9]} tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 }}
              formatter={(v, name) => [formatBand(Number(v), locale), labels[String(name)]]}
            />
            {series.map((s) => (
              <Line
                key={s.skill}
                dataKey={s.skill}
                stroke={SKILL_COLORS[s.skill]}
                strokeDasharray={SKILL_DASH[s.skill]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <li key={s.skill} className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" x2="22" y1="3" y2="3" stroke={SKILL_COLORS[s.skill]} strokeWidth="2" strokeDasharray={SKILL_DASH[s.skill]} />
            </svg>
            {labels[s.skill]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Study calendar: one square per day for the last N weeks, darker on study days. */
export function StudyCalendar({ days, weeks = 12, locale, label, countText }: { days: string[]; weeks?: number; locale: Locale; label: string; countText: (n: string) => string }) {
  const set = new Set(days);
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1) - start.getDay());
  const cells: { date: string; on: boolean; future: boolean }[] = [];
  for (let i = 0; i < weeks * 7 + 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d > today && d.getDay() === 0) break;
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, on: set.has(iso), future: d > today });
  }
  const count = cells.filter((c) => c.on).length;
  return (
    <div>
      <div dir="ltr" className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1" role="img" aria-label={label}>
        {cells.map((c) => (
          <i
            key={c.date}
            title={formatShortDate(c.date, locale)}
            className={cn("size-3.5 rounded-[3px]", c.future ? "bg-transparent" : c.on ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{countText(formatNumber(count, locale))}</p>
    </div>
  );
}

/** Two-line criterion tile used for Writing and Speaking feedback. */
export function CriterionTile({ label, band, low, locale }: { label: string; band: number; low?: boolean; locale: Locale }) {
  return (
    <div className="rounded-[14px] border border-border px-3.5 py-3">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <b className={cn("font-archivo text-2xl font-bold tracking-tight tabular-nums", low && "text-weak")}>{formatBand(band, locale)}</b>
    </div>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", fontSize: 12 };

/** Grouped bars, one group per full mock and one bar per skill (the reference dashboard's "Trend"). */
export function MockBars({
  mocks,
  labels,
  target,
  targetLabel,
  locale,
  height = 210,
  onPick,
}: {
  mocks: { attemptId: string; date: string; skills: { skill: string; band: number }[] }[];
  labels: Record<string, string>;
  target: number;
  targetLabel: string;
  locale: Locale;
  height?: number;
  onPick?: (attemptId: string) => void;
}) {
  const skills = ["listening", "reading", "writing", "speaking"];
  const rows = mocks.map((m) => {
    const row: Record<string, number | string> = { label: formatShortDate(m.date, locale), attemptId: m.attemptId };
    for (const s of m.skills) row[s.skill] = s.band;
    return row;
  });
  return (
    <div>
      <div dir="ltr" style={{ height }} className="w-full">
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: -22 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 9]} ticks={[0, 3, 6, 9]} tick={axisTick} axisLine={false} tickLine={false} />
            <ReferenceLine
              y={target}
              stroke="var(--foreground)"
              strokeDasharray="4 4"
              label={{ value: targetLabel, position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={tooltipStyle} formatter={(v, name) => [formatBand(Number(v), locale), labels[String(name)]]} />
            {skills.map((k) => (
              <RBar
                key={k}
                dataKey={k}
                fill={BAR_COLORS[k]}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
                isAnimationActive={false}
                cursor={onPick ? "pointer" : undefined}
                onClick={(d: unknown) => {
                  const id = (d as { attemptId?: string; payload?: { attemptId?: string } })?.payload?.attemptId ?? (d as { attemptId?: string })?.attemptId;
                  if (id && onPick) onPick(id);
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {skills.map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-sm" style={{ background: BAR_COLORS[k] }} aria-hidden="true" />
            {labels[k]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Bars use the reference palette; in dark mode the chart tokens lighten Ink Black and Rosewood. */
const BAR_COLORS: Record<string, string> = {
  listening: "var(--chart-1)",
  reading: "var(--frosted-blue)",
  writing: "var(--chart-3)",
  speaking: "var(--light-green)",
};

/** Donut of right and wrong answers with the accuracy in the middle. */
export function AccuracyDonut({
  correct,
  total,
  locale,
  centerNote,
  labels,
}: {
  correct: number;
  total: number;
  locale: Locale;
  centerNote: string;
  labels: { correct: string; wrong: string };
}) {
  const wrong = Math.max(0, total - correct);
  const data = [
    { name: labels.correct, value: correct, color: "var(--chart-1)" },
    { name: labels.wrong, value: wrong, color: "var(--rosewood)" },
  ];
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[190px]" role="img" aria-label={`${labels.correct} ${formatNumber(correct, locale)}, ${labels.wrong} ${formatNumber(wrong, locale)}`}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="66%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="var(--card)" strokeWidth={3} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-[28px] leading-none tracking-tight">{formatNumber(pct, locale)}%</div>
          <div className="mt-1 text-xs text-muted-foreground">{centerNote}</div>
        </div>
      </div>
    </div>
  );
}

/** Ring gauge for a 0–100 sub-skill score, as in the reference feedback screen. */
export function ScoreRing({ value, label, locale, size = 112 }: { value: number; label: string; locale: Locale; size?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const tone = v < 50 ? "var(--weak)" : v < 65 ? "var(--fair)" : "var(--strength)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={tone} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-archivo text-2xl leading-none font-bold tracking-tight tabular-nums" dir="ltr">
            {formatNumber(Math.round(v), locale)}%
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}

/*
 * Band line drawn as plain SVG, as on the mitooni canvas: a dashed target line,
 * one dot per test and dates under the first and last dot. `size="trend"` is the
 * Overview card (latest dot in Coral with its band); `size="mini"` is the small
 * chart on each Results card (every dot labelled). Time runs left to right in
 * both languages.
 */
export function BandLine({
  points,
  target,
  locale,
  label,
  targetLabel,
  size = "mini",
  color = "#3E4FC4",
  lineWidth = 2.5,
  className,
}: {
  points: { date: string; band: number }[];
  target: number;
  locale: Locale;
  /** Start of the accessible name, such as "Overall band by mock". */
  label: string;
  /** Text on the target line, such as "target 7.0". */
  targetLabel: string;
  size?: "trend" | "mini";
  /** Line and dot colour (the skill colour on the Results cards). */
  color?: string;
  lineWidth?: number;
  className?: string;
}) {
  const mini = size === "mini";
  const W = mini ? 200 : 360;
  const H = mini ? 112 : 190;
  const x0 = mini ? 16 : 24;
  const x1 = W - x0;
  const yTop = mini ? 34 : 54;
  const yLow = mini ? 90 : 136;
  const perBand = mini ? 28 : 48;
  const bands = points.map((p) => p.band);
  const top = Math.max(target, ...bands);
  const low = Math.min(target, ...bands);
  const per = top > low ? Math.min(perBand, (yLow - yTop) / (top - low)) : perBand;
  const y = (b: number) => yTop + (top - b) * per;
  const x = (i: number) => (points.length === 1 ? W / 2 : x0 + ((x1 - x0) * i) / (points.length - 1));
  const ty = y(target);
  const pts = points.map((p, i) => ({ ...p, cx: x(i), cy: y(p.band) }));
  const last = pts.length - 1;
  const aria = `${label}: ${points.map((p) => `${formatShortDate(p.date, locale)} ${formatBand(p.band, locale)}`).join(", ")}. ${targetLabel}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={aria}
      direction="ltr"
      className={cn("block h-auto w-full font-archivo tabular-nums", className)}
    >
      {mini ? (
        <>
          <line x1="4" x2={W - 4} y1={ty} y2={ty} stroke="#3E4FC4" strokeDasharray="3 3" />
          <text x="4" y={ty - 5} fontSize="9" fill="#556170">
            {targetLabel}
          </text>
        </>
      ) : (
        <>
          <line x1="10" x2={W - 10} y1={ty} y2={ty} stroke="#2B2470" strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round" />
          <text x={W - 10} y={ty - 10} textAnchor="end" fontSize="12" fontWeight="700" fill="#2B2470">
            {targetLabel}
          </text>
          <line x1="10" x2={W - 10} y1="160" y2="160" stroke="#e1e4e8" />
        </>
      )}
      {pts.length > 1 && (
        <polyline
          points={pts.map((p) => `${p.cx},${p.cy}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={lineWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {pts.map((p, i) => {
        const isLast = i === last;
        if (mini)
          return (
            <g key={i}>
              <circle cx={p.cx} cy={p.cy} r={isLast ? 4.5 : 3.5} fill={color} />
              <text x={p.cx} y={p.cy - 9} textAnchor="middle" fontSize="10" fill="#556170">
                {formatBand(p.band, locale)}
              </text>
            </g>
          );
        return (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r={isLast ? 6 : 5} fill={isLast ? "#D92F3A" : color} />
            {isLast && (
              <text x={p.cx} y={p.cy - 12} textAnchor="middle" fontSize="12" fontWeight="600" fill="#B8232D">
                {formatBand(p.band, locale)}
              </text>
            )}
          </g>
        );
      })}
      {pts.map((p, i) => {
        // Dates: every dot on the trend card when there is room, otherwise first and last.
        const show = i === 0 || i === last || (!mini && pts.length <= 5);
        if (!show) return null;
        const anchor = pts.length === 1 ? "middle" : i === 0 ? (mini ? "start" : "middle") : i === last ? "end" : "middle";
        return (
          <text key={`d${i}`} x={p.cx} y={mini ? 108 : 180} textAnchor={anchor} fontSize={mini ? 9 : 11} fill="#556170" className="font-sans">
            {formatShortDate(p.date, locale)}
          </text>
        );
      })}
    </svg>
  );
}
