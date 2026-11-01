import { expect, test } from "@playwright/test";
import { allowLeave, fakeMedia, signIn } from "./helpers";

test("Reading: answer, reload mid-test, resume, submit, see the score", async ({ page }) => {
  await signIn(page);
  await page.goto("/exam/new/academic-1-reading");
  await page.getByRole("button", { name: "My details are correct" }).click();
  await page.getByRole("button", { name: "Start test" }).click();
  await expect(page.getByText("60 minutes left")).toBeVisible();

  await page.getByRole("radiogroup", { name: "Question 1" }).getByLabel("TRUE").check();
  await page.getByRole("button", { name: /^Question 2,/ }).click();
  await page.getByRole("radiogroup", { name: "Question 2" }).getByLabel("NOT GIVEN").check();
  await page.getByRole("textbox", { name: "Question 6" }).fill("groundwater");
  await expect(page.getByRole("button", { name: "Question 6, attempted" })).toBeVisible();

  await page.waitForTimeout(800); // let autosave flush
  await allowLeave(page);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Question 6" })).toHaveValue("groundwater");
  await expect(page.getByRole("radiogroup", { name: "Question 1" }).getByLabel("TRUE")).toBeChecked();

  // Highlight a phrase in the passage.
  const para = page.locator("[data-hl-root$='-p0']").first();
  const box = await para.boundingBox();
  await page.mouse.move(box!.x + 5, box!.y + 8);
  await page.mouse.down();
  await page.mouse.move(box!.x + 200, box!.y + 8);
  await page.mouse.up();
  await page.getByRole("button", { name: "Create highlight" }).click();
  await expect(para.locator("mark")).toHaveCount(1);

  await page.getByRole("button", { name: "Review your answers" }).click();
  await expect(page.getByText("Submit your answers")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/results\/att-.*fresh=1/);
  await expect(page.getByText("Test submitted")).toBeVisible();
  await expect(page.getByText(/3\/40|2\/40/)).toBeVisible();
});

test("Listening: headphones notice, audio plays, auto submit when time runs out", async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await page.goto("/exam/new/academic-1-listening");
  await page.getByRole("button", { name: "My details are correct" }).click();
  await expect(page.getByRole("button", { name: "Start test" })).toBeDisabled();
  await page.getByLabel("I can hear the sound clearly").check();
  await page.getByRole("button", { name: "Start test" }).click();
  await expect(page.getByText("You will not be permitted to pause or rewind")).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByText("Audio is Playing")).toBeVisible();
  await page.getByRole("textbox", { name: "Question 1", exact: true }).fill("Tilbrook");
  await page.clock.fastForward("30:00");
  await expect(page).toHaveURL(/results\/att-/, { timeout: 20_000 });
  await expect(page.getByText("Listening").first()).toBeVisible();
});

test("Writing: type, live word count, submit, open feedback", async ({ page }) => {
  await signIn(page);
  await page.goto("/exam/new/academic-1-writing");
  await page.getByRole("button", { name: "My details are correct" }).click();
  await page.getByRole("button", { name: "Start test" }).click();
  const box = page.getByLabel("Your answer for Part 1");
  await expect(box).toHaveAttribute("spellcheck", "false");
  await box.fill("The chart compares how young people spent their free hours in three different years.");
  await expect(page.getByText("Words: 14")).toBeVisible();
  await page.getByRole("button", { name: "Part 2" }).click();
  await page.getByLabel("Your answer for Part 2").fill("Nowadays, in many countries the young adults continue to live with their parents.");
  await page.getByRole("button", { name: "Review your answers" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/results\//);
  await page.getByRole("link", { name: "Open feedback" }).nth(1).click();
  await expect(page.getByText("Writing task 2 feedback")).toBeVisible();
  await expect(page.getByText("in many countries the young adults")).toBeVisible();
});

test("Speaking: instructions first, one question at a time, recorded takes, playback on the feedback page", async ({ page }) => {
  test.setTimeout(150_000);
  await fakeMedia(page);
  await signIn(page);
  await page.goto("/exam/new/academic-1-speaking?mode=practice");
  await page.getByRole("button", { name: "Allow microphone" }).click();
  await expect(page.getByText("We can hear you")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Start test" }).click();

  // The examiner's instructions come first; practice mode may skip them.
  await expect(page.getByText("Speaking · Instructions")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start the questions" })).toBeDisabled();
  await page.getByRole("button", { name: "Skip the instructions" }).click();

  await expect(page.getByText("Speaking · Part 1 of 3")).toBeVisible();
  for (let i = 1; i <= 6; i++) {
    await expect(page.getByText(`Question ${i} of 6`)).toBeVisible();
    await page.getByRole("button", { name: "Start recording" }).click();
    await page.waitForTimeout(2300);
    await page.getByRole("button", { name: "Stop recording" }).click();
    await expect(page.getByRole("button", { name: /^Your answer · 0:0[1-3]$/ })).toBeVisible();
    await page.getByRole("button", { name: i < 6 ? "Next question" : "Finish" }).click();
  }
  await expect(page.getByRole("heading", { name: "Check your answers" })).toBeVisible();
  await page.getByRole("button", { name: "Submit for checking" }).click();
  await expect(page.getByRole("heading", { name: "Submitted for checking" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("link", { name: "See your feedback" }).click();
  await expect(page).toHaveURL(/results\/att-[^/]+\/speaking/);
  await page.getByRole("tab", { name: /Part 1/ }).click();
  await expect(page.locator("audio").first()).toBeVisible();
});
