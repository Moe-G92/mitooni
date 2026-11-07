export type WidgetLocale = "fa" | "en";
export type LearnerValue = string | string[] | Record<string, string>;
export type LearnerResponse = Record<string, LearnerValue>;
export type LearnerItem = {
  id: string;
  kind: "gap" | "choice" | "multi" | "matching" | "ordered" | "essay";
  prompt: string;
  options?: readonly { id: string; label: string }[];
  maxSelections?: number;
  maxLength?: number;
  pairs?: readonly { id: string; prompt: string }[];
};
export type StimulusBlock =
  | { id: string; kind: "text"; text: string }
  | { id: string; kind: "image" | "audio"; mediaId: string; alt: string };
export type MediaState = { blob?: Blob; loading?: boolean; error?: string };
