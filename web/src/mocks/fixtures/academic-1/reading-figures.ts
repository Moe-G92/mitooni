/*
 * Figures for Academic mock 1, Reading. Original drawings for the prototype.
 * Only currentColor is used, so the figures follow the contrast themes
 * (black on white, white on black, yellow on black).
 *
 * r1-diagram (Questions 12–13): cross-section of a traditional solar saltworks.
 * Blank answer areas (about 20% x 10% of the figure each, no text drawn there):
 *   Q12 top-left at x 70%, y 12.5%  (420, 40)  -> 540 x 72   (windmill)
 *   Q13 top-left at x 72%, y 82%    (432, 262) -> 552 x 294  (clay floor of the pan)
 */
export const readingFigures: Record<string, string> = {
  "r1-diagram": `<svg viewBox="0 0 600 320" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cross-section of a solar saltworks: sea, concentrating ponds, a pump powered by the wind, a crystallising pan and a salt heap" font-family="Arial, sans-serif" font-size="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- sea -->
  <rect x="0" y="192" width="86" height="68" fill="currentColor" fill-opacity="0.12" stroke="none"/>
  <path d="M0 192 q10 -6 20 0 t20 0 t20 0 t20 0"/>
  <path d="M4 212 q8 -5 16 0 t16 0 t16 0 t16 0" stroke-width="1"/>
  <path d="M4 232 q8 -5 16 0 t16 0 t16 0 t16 0" stroke-width="1"/>
  <!-- bank and sluice gate (unlabelled) -->
  <path d="M86 260 L86 195 L100 195"/>
  <line x1="93" y1="180" x2="93" y2="198" stroke-width="4"/>
  <!-- ground line with concentrating ponds -->
  <path d="M100 195 L100 215 L176 215 L176 195 L188 195 L188 215 L264 215 L264 195 L276 195 L276 215 L350 215 L350 195 L400 195"/>
  <rect x="101" y="203" width="74" height="11" fill="currentColor" fill-opacity="0.15" stroke="none"/>
  <rect x="189" y="205" width="74" height="9" fill="currentColor" fill-opacity="0.2" stroke="none"/>
  <rect x="277" y="207" width="72" height="7" fill="currentColor" fill-opacity="0.25" stroke="none"/>
  <!-- flow arrows -->
  <path d="M150 182 L190 182 M184 177 L190 182 L184 187" stroke-width="1.5"/>
  <path d="M238 182 L278 182 M272 177 L278 182 L272 187" stroke-width="1.5"/>
  <!-- wind-powered pump between the ponds and the pan -->
  <path d="M362 195 L366 122 L378 122 L382 195"/>
  <line x1="372" y1="112" x2="352" y2="92"/>
  <line x1="372" y1="112" x2="392" y2="92"/>
  <line x1="372" y1="112" x2="352" y2="132"/>
  <line x1="372" y1="112" x2="392" y2="132"/>
  <circle cx="372" cy="112" r="3" fill="currentColor"/>
  <!-- crystallising pan with its floor -->
  <path d="M400 195 L400 215 L500 215 L500 195 L600 195"/>
  <rect x="401" y="207" width="98" height="7" fill="currentColor" fill-opacity="0.3" stroke="none"/>
  <rect x="400" y="215" width="100" height="8" fill="currentColor" fill-opacity="0.45" stroke="none"/>
  <!-- salt heap -->
  <path d="M515 195 L550 158 L585 195 Z" fill="currentColor" fill-opacity="0.1"/>
  <!-- printed labels and leader lines -->
  <g stroke-width="1">
    <line x1="44" y1="276" x2="44" y2="244"/>
    <line x1="225" y1="276" x2="225" y2="216"/>
    <line x1="450" y1="184" x2="450" y2="205"/>
    <line x1="550" y1="140" x2="550" y2="160"/>
    <!-- leaders to the blank answer areas -->
    <line x1="397" y1="87" x2="420" y2="64"/>
    <line x1="470" y1="222" x2="480" y2="262"/>
  </g>
  <g fill="currentColor" stroke="none" text-anchor="middle">
    <text x="44" y="292">sea</text>
    <text x="225" y="292">concentrating ponds</text>
    <text x="460" y="180">crystallising pan</text>
    <text x="550" y="134">salt heap</text>
  </g>
</svg>`,
};
