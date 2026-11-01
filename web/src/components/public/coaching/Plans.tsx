import { Link } from "react-router";
import { useT } from "@/i18n";
import { Rich, sectionTitle } from "@/components/public/ui";
import { cn } from "@/lib/utils";
import { CheckIcon } from "./icons";

/*
 * "Pick your plan" (canvas section #plans): three plan cards, the middle one
 * dark and lifted. Prices are prototype values, labelled as such under the cards.
 * Choosing a plan sends a new visitor to create an account.
 */

const PLANS = [
  { id: "starter", features: ["f1", "f2", "f3"], featured: false },
  { id: "plus", features: ["f1", "f2", "f3", "f4"], featured: true },
  { id: "intensive", features: ["f1", "f2", "f3", "f4"], featured: false },
] as const;

export function Plans() {
  const { t } = useT();
  const k = (key: string) => t(`mk.coachPage.plans.${key}`);
  return (
    <section id="plans" aria-labelledby="coach-plans-title" className="scroll-mt-6">
      <div className="mx-auto box-border flex min-h-[clamp(640px,100vh,900px)] max-w-[1100px] flex-col justify-center px-6 py-12 max-sm:min-h-0 max-sm:px-4">
        <h2 id="coach-plans-title" className={cn(sectionTitle, "m-0 text-[clamp(30px,3.6vw,44px)]")}>
          <Rich text={k("title")} />
        </h2>
        <p className="mt-2.5 text-center font-archivo text-[16px] text-muted-foreground">{k("lead")}</p>

        <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(min(100%,290px),1fr))] items-stretch gap-5 max-sm:gap-7">
          {PLANS.map(({ id, features, featured }) => (
            <article
              key={id}
              className={cn(
                "relative flex flex-col rounded-[26px] px-6 py-7",
                featured
                  ? "scale-[1.03] bg-midnight-iris text-white shadow-[0_24px_48px_rgba(43,36,112,0.30)] max-sm:scale-100"
                  : "border border-border bg-white text-foreground shadow-[0_10px_26px_rgba(43,36,112,0.06)]",
              )}
            >
              {featured && (
                <span className="absolute inset-x-0 -top-[13px] mx-auto w-fit rounded-full bg-canary-yellow px-3.5 py-1 font-archivo text-[13px] font-extrabold whitespace-nowrap text-midnight-iris">
                  {k("popular")}
                </span>
              )}
              <h3 className={cn("m-0 font-archivo text-[20px] font-extrabold", featured ? "text-white" : "text-foreground")}>{k(`${id}.name`)}</h3>
              <p className={cn("mt-1 font-archivo text-[14px]", featured ? "text-white/80" : "text-muted-foreground")}>{k(`${id}.tagline`)}</p>
              <div className="mt-4 font-archivo">
                <b className="text-[44px] leading-none font-extrabold">{k(`${id}.price`)}</b>
                <span className={cn("ms-1 text-[15px]", featured ? "text-white/80" : "text-muted-foreground")}>{k("perMonth")}</span>
              </div>
              <ul className="mt-5 mb-6 flex list-none flex-col gap-2.5 p-0">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-archivo text-[15px] leading-[22px]">
                    <CheckIcon color={featured ? "#FAFF7F" : "#2c6e1a"} className="mt-[3px]" />
                    {k(`${id}.${f}`)}
                  </li>
                ))}
              </ul>
              <Link
                to="/sign-up"
                className={cn(
                  "mt-auto block rounded-full py-3 text-center font-gabarito text-[16px] font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                  featured
                    ? "bg-coral text-white hover:bg-[#B8232D] hover:text-white focus-visible:outline-canary-yellow"
                    : "bg-pale-wisteria text-primary hover:bg-periwinkle hover:text-primary focus-visible:outline-primary",
                )}
              >
                {k(`${id}.cta`)}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-[18px] text-center font-archivo text-[13px] text-muted-foreground">{k("note")}</p>
      </div>
    </section>
  );
}
