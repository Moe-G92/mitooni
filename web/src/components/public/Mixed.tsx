import { Fragment } from "react";
import { useT } from "@/i18n";

/*
 * Renders a translated string that may hold <b>…</b> parts (like Rich) and, in
 * Persian, wraps every run of English words ("Listening, Reading", "Task 1",
 * "IELTS") in an isolated left-to-right <bdi lang="en">, the way the canvas
 * Persian boards do. Isolation keeps brackets and commas around English terms
 * in the right order inside right-to-left text. English text is left alone.
 * Only <b> is supported, so translated copy can never inject markup.
 */

const LATIN_RUN = /([A-Za-z][A-Za-z0-9+]*(?:(?:, | |-)[A-Za-z0-9][A-Za-z0-9+]*)*)/g;

function isolate(text: string) {
  return text.split(LATIN_RUN).map((part, i) =>
    i % 2 === 1 ? (
      <bdi key={i} dir="ltr" lang="en">
        {part}
      </bdi>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function Mixed({ text }: { text: string }) {
  const { locale } = useT();
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^<b>(.*)<\/b>$/.exec(p);
        const inner = m ? m[1] : p;
        const content = locale === "fa" ? isolate(inner) : inner;
        return m ? <b key={i}>{content}</b> : <Fragment key={i}>{content}</Fragment>;
      })}
    </>
  );
}
