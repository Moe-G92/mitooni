# Site teardown: Reasonal

**URL:** https://reasonal.co/
**Platform:** Next.js (Turbopack chunks under `/_next/static`), Tailwind CSS v4, `next/font`
**Date analysed:** 29 October 2026, from computed styles in a live browser

Used as the visual reference for the IELTS simulator's public pages. Colours, fonts and layout are copied; text, illustrations and content are our own.

## Design system

### Colours

| Use | Value |
|---|---|
| Page background between cards | `#FFFFFF` |
| Ink (headings, buttons) | `#181D1F` |
| Body text | `#424647` |
| Hero gradient | `linear-gradient(#15AEEA → #73CEF2)` (top to bottom) |
| Hero title text gradient | `linear-gradient(169deg, rgba(3,123,181,.85) 20%, rgba(3,120,176,.9) 74%)` clipped to text |
| Peach section | `#FDDBCE` |
| Beige section and pills | `#EAE4DC` |
| Lavender card | `#D7CEF0` |
| Orange accent (pill, logo) | `#FD956D` |
| Light blue card | `#DBE5F0` |
| Sage card | `#D5E2DA` |
| Pink card | `#F4E1E1` |
| Butter section | `#F6E7CF` |
| Green section | `#E4EED2` |
| Teal FAQ section | `#DCEEEF` |
| Footer | `#181D1F`, text white and white at 60% |

### Typography

| Role | Font | Weight | Size / line height | Letter-spacing |
|---|---|---|---|---|
| Hero title | Archivo | 600 | 128 / 140px (clamp 40–120px below 1200px) | -0.015em |
| Section title (large) | Archivo | 600 | 64 / 72px (48px under 1200px) | -0.5 to -0.96px |
| Card title | Archivo | 600 | 40 / 48px (32px) | -0.6px |
| Big statement paragraph | Archivo | 400 | 32 / 40px (24, 20px) | -0.48px |
| Body | Archivo | 400 | 20 / 28px (16px) | 0.5px |
| Eyebrow | Gabarito | 600 | 18 / 24px (16, 14px), uppercase | 0.1em |
| Nav links | Archivo | 500 | 18 / 24px | normal |
| Base and buttons | Gabarito | 400–600 | 16 / 24px | normal |
| FAQ question | Archivo | 600 | 20 / 24px | normal |

Both fonts are Google Fonts (OFL). We self-host them with `@fontsource-variable/archivo` and `@fontsource-variable/gabarito`.

### Layout

- Every section is a rounded card (`border-radius: 32px`) inside a white page with 16px side and bottom padding (12px on phones), so white gaps separate the cards.
- The header is fixed, floating over the hero: a translucent white rounded bar with the logo on the left, centred nav links in pill buttons and a dark "Try Now" button (`#181D1F`, 8px radius).
- Sections alternate between a single full-width card and pairs of cards side by side (beige and lavender, light blue and sage).
- Feature cards: title, short body, then an illustration or product UI mock in the lower half.
- "What's inside": three rows of white pill cards (an icon square plus a label) that overflow sideways with fades at the edges.
- Testimonials: outlined rounded cards (`1px` ink border, 24px radius).
- FAQ: white rounded rows with a circled plus or minus.

## Effects

| Effect | Implementation | Cloneable |
|---|---|---|
| Hero sky | Gradient plus two cloud images (`cloud.webp`) | Yes, with our own soft CSS clouds |
| Gradient headline | `background-clip: text` with the gradient above | Yes |
| Header | Fixed, translucent, with backdrop blur | Yes |
| Lesson pill rows | Static rows offset sideways with edge fades | Yes |

## What we changed

- Our own copy about IELTS practice, our own icons and product mock-ups. No Reasonal images, text or logo.
- No testimonials, because we have no real learners yet. That card shows what every mock report contains.
- Dark mode added (Reasonal is light only): every pastel gets a dark counterpart that keeps AA contrast.
- Persian uses Vazirmatn at the same sizes and colours, with no letter-spacing and taller line height.
