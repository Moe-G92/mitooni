import { memo, type CSSProperties } from "react";
import { GLOBE_PINS, GLOBE_ROWS } from "./globeDots";
import "./what.css";

type Vars = CSSProperties & { "--lon": string; "--lat": string };
const at = (lon: number, lat: number): Vars => ({ "--lon": `${lon}deg`, "--lat": `${lat}deg` });

/** Every land dot, built once. */
const DOTS = GLOBE_ROWS.flatMap(([lat, lons]) => lons.split(" ").map((lon) => [Number(lon), lat] as const));

/**
 * The spinning dotted globe from the hero of the What is IELTS? page.
 * Purely decorative (hidden from screen readers). Stays left to right in Persian.
 */
export const Globe = memo(function Globe() {
  return (
    <div aria-hidden="true" dir="ltr" className="wi-globe-scene relative grid aspect-square w-[400px] max-w-full place-items-center">
      <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_36%_30%,#4a41a8_0%,#2B2470_55%,#17123f_100%)] shadow-[0_0_0_6px_rgba(201,210,255,0.18),0_0_50px_10px_rgba(124,140,255,0.35),0_24px_48px_rgba(43,36,112,0.35)]" />
      <div className="absolute top-1/2 left-1/2 size-0 [transform-style:preserve-3d] [transform:scale3d(1.17,1.17,1.17)_rotateX(-14deg)_rotateZ(8deg)]">
        <div className="wi-globe-spin">
          {DOTS.map(([lon, lat]) => (
            <i key={`${lon}:${lat}`} style={at(lon, lat)} />
          ))}
          {GLOBE_PINS.map(([lon, lat]) => (
            <b key={`${lon}:${lat}`} style={at(lon, lat)}>
              <u />
            </b>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.20),rgba(255,255,255,0)_40%)] shadow-[inset_-30px_-24px_56px_rgba(8,6,40,0.55)]" />
    </div>
  );
});
