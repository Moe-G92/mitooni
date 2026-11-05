import { useId } from "react";
import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label: string };

/** Native keyboard/selection semantics inside Mo's existing button-like choices. */
export function RadioChoices<T extends string | number>({
  value,
  onChange,
  options,
  label,
  labelledBy,
  className,
  choiceClassName,
  dir,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label?: string;
  labelledBy?: string;
  className?: string;
  choiceClassName: (checked: boolean) => string;
  dir?: "ltr" | "rtl";
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={className}
      dir={dir}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label key={option.value} className="relative block min-w-11">
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 min-w-11 items-center justify-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
                checked && "border-2 font-semibold",
                choiceClassName(checked),
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
