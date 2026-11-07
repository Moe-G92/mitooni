import { useId } from "react";
import type {
  LearnerItem,
  LearnerResponse,
  LearnerValue,
  WidgetLocale,
} from "./types";

const fieldClass =
  "min-h-11 w-full min-w-0 rounded-[10px] border border-input bg-card px-3 py-2 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60";

/** Controlled candidate inputs only: checking and marking belong to the server. */
export function ActivityFields({
  items,
  response,
  onChange,
  disabled = false,
  locale = "fa",
}: {
  items: readonly LearnerItem[];
  response: LearnerResponse;
  onChange: (response: LearnerResponse) => void;
  disabled?: boolean;
  locale?: WidgetLocale;
}) {
  const prefix = useId();
  const update = (id: string, value: LearnerValue) =>
    onChange({ ...response, [id]: value });
  return (
    <div lang="en" dir="ltr" className="min-w-0 space-y-7 text-left">
      {items.map((item) => {
        const id = `${prefix}-${item.id}`;
        const value =
          typeof response[item.id] === "string"
            ? (response[item.id] as string)
            : "";
        if (
          item.kind === "ordered" ||
          (item.kind === "matching" && item.pairs)
        ) {
          const raw = response[item.id];
          const ordered = Array.isArray(raw) ? raw : [];
          const matches =
            raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
          const rows =
            item.kind === "ordered"
              ? (item.options ?? []).map((_, index) => ({
                  id: String(index),
                  prompt: `Position ${index + 1}`,
                }))
              : item.pairs!;
          return (
            <fieldset
              key={item.id}
              disabled={disabled}
              className="min-w-0 space-y-3"
            >
              <legend className="mb-3 whitespace-pre-wrap font-medium">
                {item.prompt}
              </legend>
              {rows.map((row, index) => (
                <label key={row.id} className="grid min-w-0 gap-2">
                  {row.prompt}
                  <select
                    className={fieldClass}
                    value={
                      item.kind === "ordered"
                        ? (ordered[index] ?? "")
                        : (matches[row.id] ?? "")
                    }
                    onChange={(event) => {
                      if (item.kind === "matching")
                        update(item.id, {
                          ...matches,
                          [row.id]: event.target.value,
                        });
                      else {
                        const next = Array.from(
                          { length: rows.length },
                          (_, i) => ordered[i] ?? "",
                        );
                        next[index] = event.target.value;
                        update(item.id, next);
                      }
                    }}
                  >
                    <option value="">Choose an answer</option>
                    {item.options?.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={
                          item.kind === "ordered" &&
                          ordered.some(
                            (entry, i) => entry === option.id && i !== index,
                          )
                        }
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </fieldset>
          );
        }
        if (item.kind === "choice" || item.kind === "multi") {
          const selected = Array.isArray(response[item.id])
            ? (response[item.id] as string[])
            : [];
          return (
            <fieldset
              key={item.id}
              disabled={disabled}
              className="min-w-0 space-y-2"
            >
              <legend className="mb-3 whitespace-pre-wrap font-medium">
                {item.prompt}
              </legend>
              {item.options?.map((option) => (
                <label
                  key={option.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-input bg-card px-3 py-2 has-[:checked]:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
                >
                  <input
                    type={item.kind === "multi" ? "checkbox" : "radio"}
                    name={id}
                    value={option.id}
                    checked={
                      item.kind === "multi"
                        ? selected.includes(option.id)
                        : value === option.id
                    }
                    disabled={
                      disabled ||
                      (item.kind === "multi" &&
                        !selected.includes(option.id) &&
                        item.maxSelections !== undefined &&
                        selected.length >= item.maxSelections)
                    }
                    className="size-5 shrink-0 accent-primary"
                    onChange={(event) =>
                      update(
                        item.id,
                        item.kind === "choice"
                          ? option.id
                          : event.target.checked
                            ? [...selected, option.id]
                            : selected.filter((entry) => entry !== option.id),
                      )
                    }
                  />
                  <span className="whitespace-pre-wrap break-words">
                    {option.label}
                  </span>
                </label>
              ))}
            </fieldset>
          );
        }
        return (
          <div key={item.id} className="grid min-w-0 gap-3">
            <label htmlFor={id} className="whitespace-pre-wrap font-medium">
              {item.prompt}
            </label>
            {item.kind === "matching" ? (
              <select
                id={id}
                value={value}
                disabled={disabled}
                className={fieldClass}
                onChange={(event) => update(item.id, event.target.value)}
              >
                <option value="">Choose an answer</option>
                {item.options?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : item.kind === "essay" ? (
              <>
                <textarea
                  id={id}
                  value={value}
                  rows={12}
                  maxLength={item.maxLength}
                  disabled={disabled}
                  className={`${fieldClass} resize-y leading-7`}
                  onChange={(event) => update(item.id, event.target.value)}
                />
                <p
                  className="text-sm text-muted-foreground"
                  dir={locale === "fa" ? "rtl" : "ltr"}
                  lang={locale}
                >
                  {value.trim() ? value.trim().split(/\s+/u).length : 0}{" "}
                  {locale === "fa" ? "واژه" : "words"}
                </p>
              </>
            ) : (
              <input
                id={id}
                value={value}
                maxLength={item.maxLength}
                disabled={disabled}
                autoComplete="off"
                className={fieldClass}
                onChange={(event) => update(item.id, event.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
