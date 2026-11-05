import { expect, test } from "@playwright/test";
import { fakeMedia, signIn } from "./helpers";

/* The four skill practice players (/practice/*), on dummy content. */

test("listening: answer, check, feedback, next question, audio controls", async ({ page }) => {
  await signIn(page);
  await page.goto("/practice/listening");
  await expect(page.getByRole("heading", { name: "Map labelling" })).toBeVisible();

  const check = page.getByRole("button", { name: "Check answer" });
  await expect(check).toBeDisabled();
  await page.getByLabel("Bird hide").selectOption("E");
  await check.click();
  await expect(page.getByText("Question 14, not quite")).toBeVisible();
  await expect(page.getByText("You chose E. Listen again at 1:37")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play from 1:37" })).toBeVisible();

  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByLabel("Picnic area").selectOption("G");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Question 15, correct")).toBeVisible();
  await expect(page.getByText("1 right · 1 to review · 2 to go")).toBeVisible();

  // Hint for the next question.
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("button", { name: "Hint" }).click();
  await expect(page.getByText("Hint for question 16")).toBeVisible();

  // Audio: speed, transcript, play from a moment, replay 10 seconds.
  await page.getByRole("button", { name: "0.75x" }).click();
  await expect(page.getByRole("button", { name: "0.75x" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Transcript" }).click();
  await expect(page.getByText("Good morning, everyone, and welcome to Hollins Marsh.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Play from 1:52" }).click();
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(112);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.playbackRate)).toBe(0.75);
  await page.getByRole("button", { name: "Replay last 10s" }).click();
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeLessThan(110);
});

test("reading: place headings, check, fix a wrong one", async ({ page }) => {
  await signIn(page);
  await page.goto("/practice/reading");
  await expect(page.getByRole("heading", { name: "Matching headings", level: 1 })).toBeVisible();

  // Paragraph A is active: a wrong heading first.
  await page.getByRole("button", { name: /Why tickets cost more than flights/ }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Heading iv does not fit", { exact: false })).toBeVisible();
  await expect(page.getByText("0 right · 1 to fix · 4 to go")).toBeVisible();

  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("button", { name: /A route network that almost disappeared/ }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("1 right · 0 to fix · 4 to go")).toBeVisible();

  // Checking moves on to paragraph B; Next question skips to C and back round.
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByRole("button", { name: "Drop a heading here" })).toHaveCount(1);
  await page.getByRole("button", { name: "Empty" }).first().click();
  await page.getByRole("button", { name: /A new taste for slow travel/ }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("2 right · 0 to fix · 3 to go")).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
});

test("writing: submit the sample essay and see colour coded marks", async ({ page }) => {
  await signIn(page);
  await page.goto("/practice/writing");
  await expect(page.getByRole("button", { name: "Submit for feedback" })).toBeDisabled();
  await page.getByRole("button", { name: "Use the sample essay" }).click();
  await page.getByRole("button", { name: "Submit for feedback" }).click();
  await expect(page.getByText("Submitted · feedback ready")).toBeVisible();
  await expect(page.locator("mark")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: "What we marked" })).toBeVisible();
  await expect(page.getByText("Double comparative")).toBeVisible();
  await expect(page.getByText("Overall about")).toBeVisible();

  // Edit: fix one mistake and resubmit, that mark goes away.
  await page.getByRole("button", { name: "Edit and resubmit" }).click();
  const box = page.getByRole("textbox", { name: "Your essay" });
  await box.fill((await box.inputValue()).replace("more safer", "safer"));
  await page.getByRole("button", { name: "Submit for feedback" }).click();
  await expect(page.locator("mark")).toHaveCount(7);
  await expect(page.getByText("7 of 8 matched your text", { exact: false })).toBeVisible();
});

test("speaking: record a take and get notes on it", async ({ page }) => {
  await fakeMedia(page);
  await signIn(page);
  await page.goto("/practice/speaking");
  await page.getByRole("button", { name: "Start the minute" }).click();
  await expect(page.getByRole("button", { name: "Skip to speaking" })).toBeVisible();
  await page.getByLabel("Note 1").fill("Old market");

  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("ON AIR")).toBeVisible();
  await page.waitForTimeout(7000);
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByRole("heading", { name: "How take 1 flowed" })).toBeVisible();
  await expect(page.getByText("Too short, aim for 1:40 or more")).toBeVisible();
  await expect(page.getByText("Measured from your recording")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play take 1" })).toBeEnabled();

  await page.getByRole("button", { name: "Save take 1" }).click();
  await expect(page.getByRole("button", { name: "Take 1 saved" })).toBeDisabled();
  await page.getByRole("button", { name: "Next card →" }).click();
  await expect(page.getByText("Describe a skill you learned from an older person.")).toBeVisible();
});

test("speaking: works without a microphone", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
  });
  await signIn(page);
  await page.goto("/practice/speaking");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("No microphone found", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Add a sample take" }).click();
  await expect(page.getByRole("heading", { name: "How take 1 flowed" })).toBeVisible();
  await expect(page.getByText("Sample take, not measured")).toBeVisible();
});

test("practice screens in Persian are right to left and fit a phone", async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => localStorage.setItem("mitooni-ui-prefs-v1", JSON.stringify({ locale: "fa" })));
  await page.setViewportSize({ width: 375, height: 800 });
  for (const [path, label] of [
    ["/practice/listening", "بررسی پاسخ"],
    ["/practice/reading", "فهرست تیترها"],
    ["/practice/writing", "ثبت برای بازخورد"],
    ["/practice/speaking", "شروع ضبط"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByText(label).first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await page.getByRole("link", { name: "خروج" }).isVisible();
  }
  await page.getByRole("link", { name: "خروج" }).click();
  await expect(page).toHaveURL(/\/app\/practice$/);
});
