import i18n from "@/i18n";

/**
 * English strings and number format for the landing page's product mock-ups.
 * They stay English and left to right on the Persian page too, as on the
 * canvas MainFa board.
 */
export function mockupStrings() {
  return { t: i18n.getFixedT("en"), locale: "en" as const };
}
