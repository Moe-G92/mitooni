/**
 * Figures for Academic Test 1, Listening. Original artwork for the prototype.
 * Drawn with currentColor only, so they follow every contrast theme.
 */

const letter = (key: string, x: number, y: number) =>
  `<g><circle cx="${x}" cy="${y}" r="11" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5"/>` +
  `<text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="13" font-weight="bold">${key}</text></g>`;

const tree = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="6" fill="none" stroke="currentColor" stroke-width="1"/>`;

/** Hollins Marsh nature reserve (Part 2, Questions 14–17). */
const l2Map = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" role="img" aria-label="Map of Hollins Marsh nature reserve with locations labelled A to H" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="currentColor" stroke="none">
<title>Hollins Marsh nature reserve</title>
<path d="M262 355 H10 V10 H590 V355 H298" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="280" y="374" text-anchor="middle" font-size="14" font-weight="bold">Main gate</text>
<path d="M262 355 L268 355 M292 355 L298 355" stroke="currentColor" stroke-width="2"/>

<rect x="40" y="40" width="200" height="130" rx="14" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1" stroke-dasharray="5 4"/>
${tree(70, 65)}${tree(95, 140)}${tree(185, 140)}${tree(160, 62)}${tree(60, 115)}
<text x="135" y="108" text-anchor="middle" font-size="14">Woodland</text>

<ellipse cx="430" cy="110" rx="110" ry="58" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5"/>
<text x="455" y="105" text-anchor="middle" font-size="14">Lake</text>

<path d="M268 355 V50 H292 V355" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="285" y="130" text-anchor="middle" font-size="13" transform="rotate(-90 280 130)">Main path</text>

<path d="M60 190 H268 M60 210 H268 M60 190 V210" fill="none" stroke="currentColor" stroke-width="1.5"/>
<path d="M292 190 H560 V125 M292 210 H572 V125" fill="none" stroke="currentColor" stroke-width="1.5"/>
<text x="500" y="204" text-anchor="middle" font-size="13">Lake path</text>
<rect x="416" y="158" width="10" height="32" fill="none" stroke="currentColor" stroke-width="1.5"/>

<rect x="304" y="262" width="112" height="50" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5"/>
<text x="360" y="285" text-anchor="middle" font-size="13">Visitor centre</text>
<text x="360" y="302" text-anchor="middle" font-size="12" font-style="italic">You are here</text>

<rect x="40" y="262" width="130" height="70" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="1.5"/>
<text x="105" y="302" text-anchor="middle" font-size="14">Car park</text>
<path d="M170 318 H268 M170 332 H268" fill="none" stroke="currentColor" stroke-width="1.5"/>

<text x="500" y="345" text-anchor="middle" font-size="13">Meadow</text>

<g stroke="currentColor" stroke-width="2" fill="none"><path d="M565 335 V290 M558 300 L565 288 L572 300"/></g>
<text x="565" y="283" text-anchor="middle" font-size="14" font-weight="bold">N</text>

${letter("A", 100, 236)}
${letter("B", 215, 72)}
${letter("C", 318, 62)}
${letter("D", 566, 108)}
${letter("E", 392, 178)}
${letter("F", 500, 318)}
${letter("G", 232, 287)}
${letter("H", 310, 172)}
</svg>`;

export const listeningFigures: Record<string, string> = {
  "l2-map": l2Map,
};
