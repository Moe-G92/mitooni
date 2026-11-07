import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  MockListeningPlayer,
  type MockListeningAsset,
} from "./MockListeningPlayer";
const assets: MockListeningAsset[] = Array.from({ length: 4 }, (_, i) => ({
  id: `part-${i + 1}`,
  durationSeconds: 10,
  blob: new Blob([`synthetic-${i}`], { type: "audio/mpeg" }),
}));
const start = "2026-11-07T12:00:00.000Z";
let now = 0;
let play: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  let index = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(
    () => `blob:part-${++index}`,
  );
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function player(startedAt: string | null = start, serverNow = start) {
  const onStart = vi.fn();
  const view = render(
    <MockListeningPlayer
      assets={assets}
      startedAt={startedAt}
      serverNow={serverNow}
      starting={false}
      onStart={onStart}
      locale="en"
    />,
  );
  return { ...view, onStart, audio: view.container.querySelector("audio")! };
}
async function tick(ms: number) {
  now += ms;
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}
it("starts once only after four blobs are ready and never renders pause, seek, replay or native controls", () => {
  const p = player(null);
  expect(p.audio).not.toHaveAttribute("controls");
  expect(p.audio).toHaveAttribute("hidden");
  expect(screen.getAllByRole("slider")).toHaveLength(1);
  expect(screen.getByRole("slider", { name: "Volume" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Start audio" }));
  fireEvent.click(screen.getByRole("button", { name: "Start audio" }));
  expect(p.onStart).toHaveBeenCalledOnce();
  p.rerender(
    <MockListeningPlayer
      assets={assets.slice(0, 3)}
      startedAt={null}
      serverNow={start}
      starting={false}
      onStart={p.onStart}
      locale="en"
    />,
  );
  expect(screen.getByRole("button", { name: "Start audio" })).toBeDisabled();
});
it("maps reload elapsed into ordered segments and moves through the remaining four-part chain without rewind", async () => {
  const p = player(start, "2026-11-07T12:00:15.000Z");
  expect(p.audio.src).toContain("blob:part-2");
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  expect(p.audio.currentTime).toBe(5);
  expect(play).toHaveBeenCalledOnce();
  expect(
    screen.queryByRole("button", { name: "Start audio" }),
  ).not.toBeInTheDocument();
  await tick(6000);
  expect(p.audio.src).toContain("blob:part-3");
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  expect(p.audio.currentTime).toBe(1);
  await tick(10000);
  expect(p.audio.src).toContain("blob:part-4");
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  expect(p.audio.currentTime).toBe(1);
  await tick(10000);
  expect(screen.getByRole("status")).toHaveTextContent("Audio has finished");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("autoplay denial and network playback error resume at current server elapsed, including later segments", async () => {
  play.mockRejectedValueOnce(
    new DOMException("synthetic autoplay denied", "NotAllowedError"),
  );
  const p = player();
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  expect(
    screen.getByRole("button", { name: "Resume audio" }),
  ).toBeInTheDocument();
  await tick(7000);
  fireEvent.click(screen.getByRole("button", { name: "Resume audio" }));
  await act(async () => {});
  expect(p.audio.currentTime).toBe(7);
  fireEvent.error(p.audio);
  await tick(5000);
  expect(p.audio.src).toContain("blob:part-2");
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  expect(p.audio.currentTime).toBe(2);
  expect(p.onStart).not.toHaveBeenCalled();
});
it("never moves backwards on a stale server snapshot and revokes private URLs on unmount", async () => {
  const p = player(start, "2026-11-07T12:00:15.000Z");
  fireEvent.loadedMetadata(p.audio);
  await act(async () => {});
  await tick(3000);
  p.rerender(
    <MockListeningPlayer
      assets={assets}
      startedAt={start}
      serverNow="2026-11-07T12:00:11.000Z"
      starting={false}
      onStart={p.onStart}
      locale="en"
    />,
  );
  fireEvent.pause(p.audio);
  fireEvent.click(screen.getByRole("button", { name: "Resume audio" }));
  await act(async () => {});
  expect(p.audio.currentTime).toBe(8);
  const revoke = vi.mocked(URL.revokeObjectURL);
  p.unmount();
  expect(revoke).toHaveBeenCalledTimes(4);
});
