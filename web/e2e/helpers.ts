import { expect, type Page } from "@playwright/test";

/** Signs in as the seeded learner (any password works; this is a local test value). */
export async function signIn(page: Page) {
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("sara@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Sara" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("prototype-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

/**
 * Replaces getUserMedia with a synthetic camera (an animated canvas) and a
 * synthetic voice (a tone that "speaks" in bursts with pauses between), so the
 * Speaking room can be tested end to end: level meter, silence detection,
 * MediaRecorder, upload and playback. Real capture needs macOS permissions
 * that automated browsers do not get.
 */
export async function fakeMedia(page: Page) {
  await page.addInitScript(() => {
    const make = async (c: MediaStreamConstraints) => {
      const tracks: MediaStreamTrack[] = [];
      if (c.audio) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 220;
        gain.gain.value = 0;
        osc.connect(gain);
        const dest = ctx.createMediaStreamDestination();
        gain.connect(dest);
        osc.start();
        void ctx.resume();
        // 2.5 s of "speech", then 3.5 s of silence, repeating.
        let t = 0;
        setInterval(() => {
          t = (t + 1) % 60;
          gain.gain.value = t < 25 ? 0.5 : 0;
        }, 100);
        tracks.push(...dest.stream.getAudioTracks());
      }
      if (c.video) {
        const canvas = Object.assign(document.createElement("canvas"), { width: 320, height: 180 });
        const g = canvas.getContext("2d")!;
        let f = 0;
        setInterval(() => {
          g.fillStyle = `hsl(${(f += 3) % 360} 40% 40%)`;
          g.fillRect(0, 0, 320, 180);
        }, 100);
        tracks.push(...canvas.captureStream(10).getVideoTracks());
      }
      return new MediaStream(tracks);
    };
    navigator.mediaDevices.getUserMedia = make;
  });
}

/** Leaves the exam without the "leave site?" prompt getting in the way. */
export async function allowLeave(page: Page) {
  await page.evaluate(() => {
    window.onbeforeunload = null;
  });
}
