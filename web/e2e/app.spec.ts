import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("sign up, onboarding, then the dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start practising" }).first().click();
  // One page for everyone: a new email leads to the create-account step.
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await page.getByLabel("Email address").fill("reza@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByLabel("Your name").fill("Reza Karimi");
  await page.getByLabel("Password", { exact: true }).fill("prototype-demo");
  // Validation: the box must be ticked.
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Tick the box to continue")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/onboarding/);
  await page.getByRole("radio", { name: "7.5" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  // Step 2 must not submit early (distinct Next and Finish buttons).
  await expect(page.getByText("When is your test?")).toBeVisible();
  await page.getByLabel("Test date").fill("2026-12-20");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Last details")).toBeVisible();
  await page.getByRole("button", { name: "Go to my dashboard" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByText("target 7.5", { exact: true })).toBeVisible();
  await expect(page.getByText("Target band 7.5")).toBeVisible();
});

test("the dashboard matches the approved mockup's numbers", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("6.0 – 7.0")).toBeVisible();
  await expect(page.getByText(/Exam in \d+ days/)).toBeVisible();
  await expect(page.getByText("Matching headings").first()).toBeVisible();
  await page.getByRole("button", { name: "Focus here" }).click();
  await expect(page).toHaveURL(/practice\?type=matching-headings/);
});

test("results review shows the explanation and the passage evidence", async ({ page }) => {
  await signIn(page);
  await page.goto("/app/results/att-demo-4");
  await expect(page.getByText("Competent user")).toBeVisible();
  await page.getByRole("radio", { name: "Only mistakes" }).click();
  const first = page.locator("li button[aria-expanded]").first();
  await first.click();
  await expect(page.locator("blockquote").first()).toBeVisible();
  await page.goto("/app/results/att-demo-4/writing/a1-w-p2");
  await expect(page.getByText("Grammatical range")).toBeVisible();
  await expect(page.locator("mark").first()).toBeVisible();
});

test("vocabulary review: show, then grade", async ({ page }) => {
  await signIn(page);
  await page.goto("/app/vocabulary");
  const due = Number(await page.locator(".font-mono.text-5xl").first().innerText());
  await page.getByRole("link", { name: "Start review" }).click();
  await page.getByRole("button", { name: /Show answer/ }).click();
  await page.getByRole("button", { name: /Good/ }).click();
  await expect(page.getByText(/^1 \/ /)).toBeVisible();
  await page.goto("/app/vocabulary");
  await expect(page.locator(".font-mono.text-5xl").first()).toHaveText(String(due - 1));
});

test("coach: join, book a call, send a message and get a reply", async ({ page }) => {
  await signIn(page);
  await page.goto("/app/coach");
  await page.getByRole("button", { name: "Add coach support" }).click();
  await page.getByRole("button", { name: /^Book a call on/ }).first().click();
  await expect(page.getByText("No calls booked")).toHaveCount(0);
  await page.getByPlaceholder("Write a reply").fill("Thanks, see you on the call.");
  await page.getByRole("button", { name: "Send reply" }).click();
  await expect(page.getByText("Thanks, see you on the call.")).toBeVisible();
  // The mock coach answers a few seconds later.
  await expect(page.locator("ol li").last()).not.toContainText("Thanks, see you on the call.", { timeout: 15_000 });
});

test("Persian switches the app to right to left; the exam stays English", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "تغییر زبان به فارسی" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
  await page.goto("/exam/new/practice-a1-r-g1?mode=practice");
  const root = page.locator(".exam-root");
  await expect(root).toHaveAttribute("dir", "ltr");
  await expect(root).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Start test" })).toBeVisible();
});

test("a new mobile number signs up with a one-time code, in Persian digits", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByRole("tab", { name: "Mobile number" }).click();
  await page.getByLabel("Mobile number").fill("۰۹۳۵۱۱۱۲۲۳۳");
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("Enter the 6 digits")).toBeVisible();
  await page.getByLabel("6-digit code").fill("۱۲۳۴۵۶");
  await expect(page.getByLabel("6-digit code")).toHaveValue("123456");
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByLabel("Your name").fill("Maryam Ahmadi");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/onboarding/);
});

test("the seeded mobile number signs straight in after the code", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("tab", { name: "Mobile number" }).click();
  await page.getByLabel("Mobile number").fill("0912 123 4567");
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("246810");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("forgot password keeps the email and confirms", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("sara@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue("sara@example.com");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByText("sara@example.com")).toBeVisible();
});
