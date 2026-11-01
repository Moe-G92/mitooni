import { createContext, useContext } from "react";

/** What a running section needs from the runner around it. */
export type RunnerCtx = {
  candidate: string;
  remaining: number;
  /** Listening starts the clock only when the candidate presses Play. */
  startClock: () => void;
  clockStarted: boolean;
  noTimeLimit: boolean;
  openOptions: () => void;
  finish: () => void;
  volume: number;
  setVolume: (v: number) => void;
  /** Speaking ends itself when Part 3 is done. */
  submitNow: () => void;
  /**
   * Speaking: submits the section without leaving the page, so the room can
   * show its own confirmation. Resolves true when the whole result is ready.
   */
  submitSection: () => Promise<boolean>;
  /** Goes up by one each time "Go to submission page" is chosen in Options during Speaking. */
  summaryRequest: number;
};

export const Runner = createContext<RunnerCtx | null>(null);

export function useRunner() {
  const c = useContext(Runner);
  if (!c) throw new Error("useRunner outside the section runner");
  return c;
}
