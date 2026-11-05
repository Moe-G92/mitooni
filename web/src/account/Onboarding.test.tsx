import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { setPrefs } from "@/lib/prefs";
import Onboarding from "./Onboarding";

const { onboard } = vi.hoisted(() => ({
  onboard: vi.fn(async (_profile: unknown, _key: string) => {}),
}));
vi.mock("./state", () => ({ useAccount: () => ({ onboard }) }));
beforeEach(() => {
  onboard.mockClear();
  setPrefs({ locale: "en" });
});

it("keeps native group selection through both steps and saves zero-valued goals/hours", async () => {
  const user = userEvent.setup();
  render(
    <BrowserRouter>
      <Onboarding />
    </BrowserRouter>,
  );
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 })).not.toHaveFocus();
  await user.type(screen.getByLabelText("Your name"), "Local learner");
  const zero = screen.getByRole("radio", { name: "0.0", exact: true });
  expect(zero).toHaveAttribute("type", "radio");
  await user.click(zero);
  expect(zero).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Next", exact: true }));
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Back", exact: true }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  expect(screen.getByRole("radio", { name: "0.0", exact: true })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Next", exact: true }));
  expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(2);
  expect(
    radios.filter((input) => (input as HTMLInputElement).checked),
  ).toHaveLength(1);
  await user.type(screen.getByRole("spinbutton"), "0");
  await user.click(
    screen.getByRole("button", { name: "Save and open settings" }),
  );
  await waitFor(() => expect(onboard).toHaveBeenCalledOnce());
  expect(onboard.mock.calls[0][0]).toMatchObject({
    name: "Local learner",
    weeklyHours: 0,
    testDate: null,
    targets: { overall: 0, listening: 0, reading: 0, writing: 0, speaking: 0 },
  });
});
