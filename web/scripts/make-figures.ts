/*
 * Writes every exam figure to public/figures/<id>.svg. The API refers to figures
 * by id, and the shell loads /figures/<id>.svg and inlines it so currentColor
 * follows the candidate's contrast setting. The backend should serve the same files.
 *
 *   npm run figures
 */
import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { readingFigures } from "../src/mocks/fixtures/academic-1/reading-figures";
import { listeningFigures } from "../src/mocks/fixtures/academic-1/listening-figures";
import { task1Chart } from "../src/mocks/fixtures/academic-1/writing-speaking";

const OUT = path.resolve(import.meta.dirname, "../public/figures");
mkdirSync(OUT, { recursive: true });

/** Grouped bar chart in the style of an IELTS Task 1 figure, monochrome so it works in every contrast mode. */
function barChart(c: typeof task1Chart): string {
  const W = 640, H = 400, L = 56, R = 16, T = 64, B = 92;
  const max = Math.ceil(Math.max(...c.series.flatMap((s) => s.values)) / 4) * 4;
  const plotW = W - L - R, plotH = H - T - B;
  const groupW = plotW / c.categories.length;
  const barW = Math.min(22, (groupW - 18) / c.series.length);
  const fills = ["none", "currentColor", "url(#hatch)"];
  const opacity = [1, 0.85, 1];
  const y = (v: number) => T + plotH - (v / max) * plotH;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" font-family="Arial, sans-serif" fill="currentColor" role="img" aria-label="${c.title}">`;
  s += `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="2"/></pattern></defs>`;
  s += `<text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="bold">${c.title.length > 70 ? c.title.slice(0, c.title.lastIndexOf(" ", 70)) : c.title}</text>`;
  if (c.title.length > 70) s += `<text x="${W / 2}" y="40" text-anchor="middle" font-size="15" font-weight="bold">${c.title.slice(c.title.lastIndexOf(" ", 70) + 1)}</text>`;
  for (let v = 0; v <= max; v += max / 4) {
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity="${v === 0 ? 1 : 0.2}"/>`;
    s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12">${v}</text>`;
  }
  s += `<text transform="translate(16 ${T + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="12">${c.unit}</text>`;
  c.categories.forEach((cat, i) => {
    const gx = L + i * groupW + (groupW - barW * c.series.length) / 2;
    c.series.forEach((ser, j) => {
      const v = ser.values[i];
      s += `<rect x="${gx + j * barW}" y="${y(v)}" width="${barW - 2}" height="${y(0) - y(v)}" fill="${fills[j % 3]}" fill-opacity="${opacity[j % 3]}" stroke="currentColor" stroke-width="1"/>`;
    });
    const words = cat.split(" ");
    const mid = Math.ceil(words.length / 2);
    const lines = words.length > 2 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [cat];
    lines.forEach((ln, k) => (s += `<text x="${L + i * groupW + groupW / 2}" y="${y(0) + 18 + k * 14}" text-anchor="middle" font-size="12">${ln}</text>`));
  });
  const lx = W / 2 - (c.series.length * 90) / 2;
  c.series.forEach((ser, j) => {
    s += `<rect x="${lx + j * 90}" y="${H - 26}" width="14" height="14" fill="${fills[j % 3]}" fill-opacity="${opacity[j % 3]}" stroke="currentColor"/>`;
    s += `<text x="${lx + j * 90 + 20}" y="${H - 14}" font-size="13">${ser.name}</text>`;
  });
  return `${s}</svg>`;
}

const all: Record<string, string> = { ...readingFigures, ...listeningFigures, [task1Chart.id]: barChart(task1Chart) };
for (const [id, svg] of Object.entries(all)) {
  writeFileSync(path.join(OUT, `${id}.svg`), svg);
  console.log("figure", id);
}
