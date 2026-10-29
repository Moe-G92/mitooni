#!/usr/bin/env python3
"""Convert the plan markdown into a print-styled HTML report with inline SVG figures."""
import re, html, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD = ROOT / "iran-ielts-market-and-gtm-plan.md"
OUT = ROOT / "build" / "report.html"

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    return t

def svg_of(path):
    s = (ROOT / path).read_text()
    m = re.search(r"<svg.*?</svg>", s, re.S)
    return m.group(0)

lines = MD.read_text().splitlines()
out = []
i = 0
fig_n = 0
first_h1 = True
while i < len(lines):
    ln = lines[i]
    if not ln.strip():
        i += 1; continue
    if ln.startswith("# "):
        if first_h1:
            first_h1 = False
            i += 1; continue  # title goes on the cover
        out.append(f"<h1>{inline(ln[2:])}</h1>"); i += 1; continue
    if ln.startswith("## "):
        out.append(f'<h2>{inline(ln[3:])}</h2>'); i += 1; continue
    if ln.startswith("### "):
        out.append(f"<h3>{inline(ln[4:])}</h3>"); i += 1; continue
    if ln.strip() == "---":
        i += 1; continue
    m = re.match(r"!\[(.*?)\]\((.*?)\)", ln.strip())
    if m:
        fig_n += 1
        cap, path = m.group(1), m.group(2)
        out.append(f'<figure><div class="fig">{svg_of(path)}</div><figcaption><span class="fn">Figure {fig_n}</span>{inline(cap)}</figcaption></figure>')
        i += 1; continue
    if ln.startswith(">"):
        buf = []
        while i < len(lines) and lines[i].startswith(">"):
            buf.append(lines[i].lstrip("> ").rstrip()); i += 1
        out.append(f"<blockquote><p>{inline(' '.join(buf))}</p></blockquote>"); continue
    if ln.startswith("|"):
        rows = []
        while i < len(lines) and lines[i].startswith("|"):
            rows.append(lines[i]); i += 1
        cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
        head = cells[0]; body = [r for r in cells[1:] if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
        cls = "wide" if len(head) >= 7 else ("mid" if len(head) >= 4 else "")
        t = [f'<table class="{cls}"><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"]
        for r in body:
            t.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
        t.append("</tbody></table>")
        out.append("".join(t)); continue
    if re.match(r"^\s*- ", ln):
        items = []
        while i < len(lines) and re.match(r"^\s*- ", lines[i]):
            item = lines[i].strip()[2:]
            # continuation lines indented under the bullet
            j = i + 1
            while j < len(lines) and lines[j].startswith("  ") and not re.match(r"^\s*- ", lines[j]) and lines[j].strip():
                item += " " + lines[j].strip(); j += 1
            # nested bullets
            sub = []
            while j < len(lines) and re.match(r"^\s{2,}- ", lines[j]):
                sub.append(lines[j].strip()[2:]); j += 1
            li = inline(item)
            if sub:
                li += "<ul>" + "".join(f"<li>{inline(s)}</li>" for s in sub) + "</ul>"
            items.append(f"<li>{li}</li>"); i = j
        out.append("<ul>" + "".join(items) + "</ul>"); continue
    if re.match(r"^\d+\. ", ln):
        items = []
        while i < len(lines) and re.match(r"^\d+\. ", lines[i]):
            item = re.sub(r"^\d+\. ", "", lines[i]).strip()
            j = i + 1
            sub = []
            while j < len(lines) and re.match(r"^\s{2,}- ", lines[j]):
                sub.append(lines[j].strip()[2:]); j += 1
            li = inline(item)
            if sub:
                li += "<ul>" + "".join(f"<li>{inline(s)}</li>" for s in sub) + "</ul>"
            items.append(f"<li>{li}</li>"); i = j
        out.append("<ol>" + "".join(items) + "</ol>"); continue
    # paragraph
    buf = [ln.strip()]
    i += 1
    while i < len(lines) and lines[i].strip() and not re.match(r"^(#|\||>|-\s|\d+\.\s|!\[|---)", lines[i].strip()):
        buf.append(lines[i].strip()); i += 1
    out.append(f"<p>{inline(' '.join(buf))}</p>")

body = "\n".join(out)
# turn the Sources section into a smaller block
body = body.replace("<h2>Sources</h2>", '<h2 class="src">Sources</h2>')

CSS = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --paper: #faf9f5; --paper-2: #f0efe8; --ink: #1a1a2e; --muted: #4f5a57; --soft: #5c6663;
  --rule: rgba(26,26,46,0.12); --ink-30: rgba(26,26,46,0.30); --ink-20: rgba(26,26,46,0.20);
  --ink-10: rgba(26,26,46,0.10); --ink-06: rgba(26,26,46,0.06); --ink-05: rgba(26,26,46,0.05);
  --ink-03: rgba(26,26,46,0.03); --ink-02: rgba(26,26,46,0.02); --ink-40: rgba(26,26,46,0.40);
  --muted-15: rgba(79,90,87,0.15); --muted-45: rgba(79,90,87,0.45);
  --accent: #c2410c; --accent-tint: rgba(194,65,12,0.08); --accent-12: rgba(194,65,12,0.12); --accent-04: rgba(194,65,12,0.04);
  --link: #1a4f4e; --node-fill: #ffffff;
  --font-sans: 'Roboto', system-ui, sans-serif; --font-title: 'Barlow Condensed', 'Roboto', sans-serif; --font-mono: 'Geist Mono', ui-monospace, monospace;
}
@page { size: A4; margin: 18mm 16mm 20mm 16mm; @bottom-right { content: counter(page); font-family: 'Geist Mono', monospace; font-size: 7.5pt; color: #5c6663; } @bottom-left { content: 'Iran IELTS market and go-to-market plan'; font-family: 'Geist Mono', monospace; font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; color: #5c6663; } }
@page :first { @bottom-right { content: none; } @bottom-left { content: none; } }
html { background: #ffffff; }
body { font-family: var(--font-sans); color: var(--ink); background: #ffffff; font-size: 10pt; line-height: 1.45; }
.cover { height: 257mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; }
.cover .eyebrow { margin-top: 18mm; }
.cover h1.title { font-family: var(--font-title); font-weight: 700; text-transform: uppercase; font-size: 40pt; line-height: 1.0; letter-spacing: 0.005em; max-width: 150mm; margin-top: 6mm; }
.cover .sub { font-size: 13pt; color: var(--muted); max-width: 140mm; margin-top: 8mm; line-height: 1.45; }
.cover .meta { font-family: var(--font-mono); font-size: 8pt; color: var(--soft); letter-spacing: 0.06em; text-transform: uppercase; border-top: 1px solid var(--rule); padding-top: 4mm; display: flex; justify-content: space-between; gap: 6mm; }
.cover .band { width: 36mm; height: 3mm; background: var(--accent); margin-top: 10mm; }
.eyebrow { font-family: var(--font-mono); font-size: 7.5pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
h1 { font-family: var(--font-title); font-weight: 700; text-transform: uppercase; font-size: 22pt; line-height: 1.05; margin: 0 0 4mm; }
h2 { font-family: var(--font-title); font-weight: 700; text-transform: uppercase; font-size: 19pt; line-height: 1.05; margin: 6mm 0 3mm; padding-top: 3mm; border-top: 1px solid var(--ink); page-break-after: avoid; }
h2 { page-break-before: always; }
h2:first-of-type, h2.src { page-break-before: auto; }
h2.src { font-size: 13pt; }
h3 { font-size: 12pt; font-weight: 700; margin: 6mm 0 2mm; page-break-after: avoid; }
p { margin: 0 0 2.5mm; }
p + p { margin-top: 0; }
strong { font-weight: 700; }
blockquote { border-left: 2px solid var(--accent); padding: 1mm 0 1mm 4mm; margin: 2mm 0 3mm; color: var(--muted); }
blockquote p { margin: 0; }
ul, ol { margin: 0 0 3.5mm 5mm; }
li { margin-bottom: 1.2mm; }
li ul { margin-top: 1mm; margin-bottom: 1mm; }
hr { border: 0; height: 0; margin: 0; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 8.5pt; line-height: 1.35; page-break-inside: auto; }
table.wide { font-size: 7.3pt; line-height: 1.3; }
th { text-align: left; font-family: var(--font-mono); font-weight: 500; font-size: 6.8pt; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--ink); padding: 1.5mm 1.5mm 1.5mm 0; vertical-align: bottom; }
td { border-bottom: 1px solid var(--rule); padding: 1.6mm 1.5mm 1.6mm 0; vertical-align: top; }
tr { page-break-inside: avoid; }
table:not(.wide) { page-break-inside: avoid; }
td:first-child { font-weight: 500; }
figure { margin: 3mm 0 5mm; page-break-inside: avoid; }
.fig { border: 1px solid var(--rule); border-radius: 6px; padding: 2mm 2mm 0; background: var(--paper); }
.fig svg { width: 80%; height: auto; display: block; margin: 0 auto; }
svg text { font-family: var(--font-sans); }
svg text.mono { font-family: var(--font-mono); }
figcaption { font-size: 8.5pt; color: var(--muted); margin-top: 2mm; }
figcaption .fn { font-family: var(--font-mono); font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-right: 3mm; }
h2.src + p, h2.src ~ p { font-size: 8pt; color: var(--muted); line-height: 1.45; }
code { font-family: var(--font-mono); font-size: 0.9em; }
"""

doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Iran IELTS market and go-to-market plan</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<section class="cover">
  <div>
    <p class="eyebrow">Market research and go-to-market plan</p>
    <h1 class="title">Iran IELTS market, competitors and the plan to enter it</h1>
    <div class="band"></div>
    <p class="sub">Who sells IELTS preparation to Iranians today, where the gaps are after the exam left the country in January 2026, how an AI-first tutor can be different, and a fourteen-month launch plan.</p>
  </div>
  <div class="meta"><span>26 October 2026 · 4 Aban 1405</span><span>Prices in toman, as seen that day</span><span>Internal draft</span></div>
</section>
{body}
</body></html>"""
OUT.write_text(doc)
print("wrote", OUT, len(doc), "bytes;", fig_n, "figures")
