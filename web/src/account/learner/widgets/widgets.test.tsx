import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ActivityFields } from "./ActivityFields";
import { PrivateMedia } from "./StimulusBlocks";
import { SpeakingRecorder } from "./SpeakingRecorder";
import type { LearnerResponse } from "./types";

const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "mediaDevices",
);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (mediaDevicesDescriptor)
    Object.defineProperty(navigator, "mediaDevices", mediaDevicesDescriptor);
  else Reflect.deleteProperty(navigator, "mediaDevices");
});
it("offers keyboard-only gap, choice, bounded multi, matching, order and essay responses in English LTR", async () => {
  const user = userEvent.setup();
  function Harness() {
    const [response, setResponse] = useState<LearnerResponse>({});
    return (
      <>
        <ActivityFields
          response={response}
          onChange={setResponse}
          items={[
            { id: "gap", kind: "gap", prompt: "Station" },
            {
              id: "choice",
              kind: "choice",
              prompt: "Transport",
              options: [
                { id: "bus", label: "Bus" },
                { id: "rail", label: "Rail" },
              ],
            },
            {
              id: "multi",
              kind: "multi",
              prompt: "Facilities",
              maxSelections: 1,
              options: [
                { id: "park", label: "Park" },
                { id: "cafe", label: "Cafe" },
              ],
            },
            {
              id: "matching",
              kind: "matching",
              prompt: "Match locations",
              pairs: [{ id: "north", prompt: "North" }],
              options: [{ id: "lake", label: "Lake" }],
            },
            {
              id: "order",
              kind: "ordered",
              prompt: "Order stages",
              options: [
                { id: "first", label: "First" },
                { id: "last", label: "Last" },
              ],
            },
            { id: "essay", kind: "essay", prompt: "Your essay" },
          ]}
        />
        <output data-testid="response">{JSON.stringify(response)}</output>
      </>
    );
  }
  render(<Harness />);
  await user.tab();
  await user.keyboard("Central");
  await user.tab();
  await user.keyboard(" ");
  await user.tab();
  await user.keyboard(" ");
  expect(screen.getByLabelText("Cafe")).toBeDisabled();
  await user.tab();
  await user.selectOptions(screen.getByLabelText("North"), "lake");
  await user.selectOptions(screen.getByLabelText("Position 1"), "first");
  expect(
    screen.getByLabelText("Position 2").querySelector('option[value="first"]'),
  ).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Position 2"), "last");
  await user.click(screen.getByLabelText("Your essay"));
  await user.keyboard("Two words");
  expect(screen.getByText("2 واژه")).toBeInTheDocument();
  expect(JSON.parse(screen.getByTestId("response").textContent!)).toEqual({
    gap: "Central",
    choice: "bus",
    multi: ["park"],
    matching: { north: "lake" },
    order: ["first", "last"],
    essay: "Two words",
  });
  expect(
    screen.getByLabelText("Station").closest('[lang="en"]'),
  ).toHaveAttribute("dir", "ltr");
});
it("revokes private blob URLs across owner changes and unmount; rejects SVG without creating a URL", async () => {
  const create = vi
    .spyOn(URL, "createObjectURL")
    .mockReturnValueOnce("blob:first")
    .mockReturnValueOnce("blob:second");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const blob = new Blob(["synthetic"], { type: "image/png" });
  const view = render(
    <PrivateMedia
      blob={blob}
      kind="image"
      alt="Task map"
      ownerKey="a"
      locale="en"
    />,
  );
  await waitFor(() =>
    expect(screen.getByAltText("Task map")).toHaveAttribute(
      "src",
      "blob:first",
    ),
  );
  view.rerender(
    <PrivateMedia
      blob={blob}
      kind="image"
      alt="Task map"
      ownerKey="b"
      locale="en"
    />,
  );
  await waitFor(() =>
    expect(screen.getByAltText("Task map")).toHaveAttribute(
      "src",
      "blob:second",
    ),
  );
  expect(revoke).toHaveBeenCalledWith("blob:first");
  view.rerender(
    <PrivateMedia
      blob={new Blob(["<svg/>"], { type: "image/svg+xml" })}
      kind="image"
      alt="Task map"
      ownerKey="b"
      locale="en"
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Media could not be loaded",
  );
  expect(create).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(revoke).toHaveBeenCalledWith("blob:second");
});
it("reports microphone permission denial without emitting a recording", async () => {
  const close = vi.fn(async () => {});
  vi.stubGlobal(
    "AudioContext",
    class {
      sampleRate = 48000;
      audioWorklet = { addModule: async () => {} };
      resume = async () => {};
      close = close;
    },
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => {
        throw new DOMException("Denied", "NotAllowedError");
      }),
    },
  });
  const ready = vi.fn();
  render(
    <SpeakingRecorder
      ownerKey="candidate:attempt"
      locale="en"
      onReady={ready}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Record" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Microphone access was denied",
    ),
  );
  expect(ready).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
it("stops a late microphone permission grant after owner replacement", async () => {
  const close = vi.fn(async () => {});
  vi.stubGlobal(
    "AudioContext",
    class {
      sampleRate = 48000;
      audioWorklet = { addModule: async () => {} };
      resume = async () => {};
      close = close;
    },
  );
  const stop = vi.fn();
  let grant!: (stream: MediaStream) => void;
  const getUserMedia = vi.fn(
    () =>
      new Promise<MediaStream>((resolve) => {
        grant = resolve;
      }),
  );
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  const ready = vi.fn();
  const view = render(
    <SpeakingRecorder ownerKey="a" locale="en" onReady={ready} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Record" }));
  await waitFor(() => expect(getUserMedia).toHaveBeenCalledOnce());
  view.rerender(<SpeakingRecorder ownerKey="b" locale="en" onReady={ready} />);
  grant({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  await waitFor(() => expect(stop).toHaveBeenCalledOnce());
  expect(close).toHaveBeenCalledOnce();
  expect(ready).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Record" })).toBeEnabled();
});
