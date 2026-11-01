import { useT } from "@/i18n";
import { Rich, sectionTitle } from "@/components/public/ui";
import { cn } from "@/lib/utils";
import { CheckIcon, CrossIcon } from "./icons";

/* "Practice alone or with a coach?" comparison (canvas section #compare). */

const ROWS: { key: string; practice: boolean }[] = [
  { key: "r1", practice: true },
  { key: "r2", practice: true },
  { key: "r3", practice: true },
  { key: "r4", practice: false },
  { key: "r5", practice: false },
  { key: "r6", practice: false },
  { key: "r7", practice: false },
];

const colW = "w-[140px] max-sm:w-[84px]";

export function CompareTable() {
  const { t } = useT();
  const k = (key: string) => t(`mk.coachPage.compare.${key}`);
  return (
    <section id="compare" aria-labelledby="coach-compare-title" className="scroll-mt-6">
      <div className="mx-auto box-border max-w-[1000px] px-6 py-12 max-sm:px-4">
        <h2 id="coach-compare-title" className={cn(sectionTitle, "m-0 text-[clamp(30px,3.6vw,44px)]")}>
          <Rich text={k("title")} />
        </h2>
        <p className="mx-auto mt-3 max-w-[620px] text-center font-archivo text-[17px] leading-[27px] text-[#3a4855]">{k("lead")}</p>

        <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-white shadow-[0_14px_34px_rgba(43,36,112,0.08)]">
          <table className="w-full table-fixed border-collapse font-archivo">
            <thead>
              <tr>
                <th scope="col" className="px-[18px] py-4 text-start text-[13px] font-bold tracking-[0.08em] text-muted-foreground uppercase max-sm:px-3.5">
                  {k("colFeature")}
                </th>
                <th scope="col" className={cn(colW, "px-1 py-4 text-center text-[15px] font-bold text-foreground")}>
                  {k("colPractice")}
                </th>
                <th scope="col" className={cn(colW, "bg-midnight-iris px-1 py-4 text-center text-[15px] font-bold text-white")}>
                  {k("colCoaching")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, practice }) => (
                <tr key={key} className="border-t border-[#eef0f3]">
                  <th scope="row" className="px-[18px] py-[13px] text-start text-[16px] font-normal text-foreground max-sm:px-3.5 max-sm:text-[15px]">
                    {k(key)}
                  </th>
                  <td className="py-[13px]">
                    <span className="grid place-items-center">
                      {practice ? <CheckIcon /> : <CrossIcon />}
                      <span className="sr-only">{practice ? k("yes") : k("no")}</span>
                    </span>
                  </td>
                  <td className="bg-background py-[13px]">
                    <span className="grid place-items-center">
                      <CheckIcon color="#D92F3A" />
                      <span className="sr-only">{k("yes")}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
