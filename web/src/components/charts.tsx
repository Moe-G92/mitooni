import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale } from "@/api/schemas";
import { formatBand, formatNumber, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * Charts for the learner pages, drawn with Recharts (what shadcn/ui charts use)
 * and coloured from the theme tokens, so they follow light and dark mode.
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
      <b className={cn("font-mono text-2xl font-normal tracking-tight", low && "text-weak")}>{formatBand(band, locale)}</b>
    </div>
  );
}
