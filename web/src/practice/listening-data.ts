import type { Localized } from "@/api/schemas";

/*
 * Dummy content for the Listening practice player: Part 2 of the Academic 1
 * test (Hollins Marsh), questions 14 to 17, map labelling. The audio is the
 * real Part 2 recording; line start times were measured from its pauses.
 * Content stays in English in both languages; feedback is localised.
 */

export type TranscriptLine = { at: number; speaker: string; text: string };

export type MapQuestion = {
  n: number;
  prompt: string;
  answer: string;
  /** Where the answer is heard (seconds), and the end of that stretch. */
  from: number;
  to: number;
  explanation: Localized;
  hint: Localized;
};

export const listeningPractice = {
  src: "/audio/academic-1/listening-part-2.m4a",
  durationSec: 206,
  title: "A guided walk round Hollins Marsh",
  mapTitle: "Hollins Marsh nature reserve",
  letters: ["A", "B", "C", "D", "E", "F", "G", "H"],
  transcript: [
  { at: 0, speaker: "Narrator", text: "Part 2. You will hear a volunteer coordinator talking to a group of new volunteers at a wetland nature reserve. First, you have some time to look at questions 11 to 17." },
  { at: 19.2, speaker: "Narrator", text: "Now listen carefully and answer questions 11 to 17." },
  { at: 25.5, speaker: "Fiona", text: "Good morning, everyone, and welcome to Hollins Marsh. I'm Fiona, and I coordinate the volunteer programme here. Before we head outside, let me tell you a little about the place." },
  { at: 36.4, speaker: "Fiona", text: "Many visitors assume the reserve was once farmland, and it's true there were sheep grazing nearby. But this site was actually a gravel quarry until the late nineteen-eighties." },
  { at: 47.0, speaker: "Fiona", text: "When the digging stopped, the pits filled with water, and that's how the lakes were formed. Nobody planned it, and the river is nowhere near here." },
  { at: 55.5, speaker: "Fiona", text: "On your first day, you won't be sent off to work on your own. Some people expect a long safety lecture, but we keep that very short." },
  { at: 64.1, speaker: "Fiona", text: "What you'll actually do is spend the morning walking the site with an experienced volunteer, so you learn where everything is." },
  { at: 71.6, speaker: "Fiona", text: "As for what to bring, we lend out binoculars, so don't worry about those, and the caf\u00e9 does sandwiches, so you needn't pack a lunch." },
  { at: 79.9, speaker: "Fiona", text: "The one thing we can't supply is waterproof boots in every size, so please bring your own." },
  { at: 86.1, speaker: "Fiona", text: "Now, if you look at the map, you'll see we're in the visitor centre, just to the right of the main path as you come in through the main gate. Let me point out a few places you'll need." },
  { at: 96.6, speaker: "Fiona", text: "First, the bird hide. Walk north up the main path until you reach the crossroads, then turn right onto the lake path." },
  { at: 104.3, speaker: "Fiona", text: "Follow it past the little jetty, right to the end. The hide is just beyond that, looking out over the eastern shore of the lake." },
  { at: 112.2, speaker: "Fiona", text: "Next, the picnic area. A lot of people look for it beside the car park, but it's actually directly opposite where we're standing now, on the other side of the main path." },
  { at: 122.9, speaker: "Fiona", text: "The tool store is where you'll collect your equipment each morning. Keep going up the main path, past the crossroads, all the way to the top where it ends." },
  { at: 132.0, speaker: "Fiona", text: "The woodland is on your left there, but the tool store is on your right." },
  { at: 137.1, speaker: "Fiona", text: "And finally, the first aid point. It's at the crossroads, in the corner between the main path and the lake path, on the side nearest the lake." },
  { at: 145.9, speaker: "Narrator", text: "Before you hear the rest of the talk, you have some time to look at questions 18 to 20." },
  { at: 158.1, speaker: "Narrator", text: "Now listen and answer questions 18 to 20." },
  { at: 163.7, speaker: "Fiona", text: "Lastly, let me tell you when our regular team activities take place, as the timetable has changed this year." },
  { at: 171.0, speaker: "Fiona", text: "Hedge laying used to happen on Saturdays, but so many of you asked for a weekday that we've moved it to Tuesday mornings." },
  { at: 178.5, speaker: "Fiona", text: "The bird survey is early on Sunday, I'm afraid, because that's when the reserve is quietest. Some of you may have seen Thursday on the old leaflet, but please ignore that." },
  { at: 189.1, speaker: "Fiona", text: "And path repairs, which are hard work but very satisfying, are on Monday, after the weekend visitors have worn things down." },
  { at: 197.4, speaker: "Fiona", text: "Right, if there are no questions, let's find you some boots and head out." },
  { at: 202.4, speaker: "Narrator", text: "That is the end of part 2." },
  ] satisfies TranscriptLine[],
  questions: [
    {
      n: 14,
      prompt: "Bird hide",
      answer: "D",
      from: 96.6,
      to: 112.2,
      explanation: {
        en: "the speaker goes north to the crossroads, turns right onto the lake path and walks past the jetty to the very end. The hide looks out over the eastern shore, so the answer is D.",
        fa: "گوینده از مسیر اصلی به سمت شمال تا چهارراه می‌ره، به راست می‌پیچه توی مسیر دریاچه و از کنار اسکله تا ته مسیر می‌ره. پناهگاه رو به ساحل شرقیه، پس جواب درست D است.",
      },
      hint: {
        en: "Listen for the crossroads, then follow the lake path. The jetty is passed on the way, so it is not the answer.",
        fa: "دنبال کلمه‌ی crossroads باش و بعد مسیر دریاچه رو دنبال کن. از کنار jetty رد می‌شه، پس جواب اون نیست.",
      },
    },
    {
      n: 15,
      prompt: "Picnic area",
      answer: "G",
      from: 112.2,
      to: 122.9,
      explanation: {
        en: "many people look for it beside the car park, but it is directly opposite the visitor centre, across the main path. That is G.",
        fa: "خیلی‌ها کنار car park دنبالش می‌گردن، ولی درست روبه‌روی visitor centre و اون طرف مسیر اصلیه. یعنی جواب درست G است.",
      },
      hint: {
        en: "The speaker is standing in the visitor centre. Listen for the word opposite.",
        fa: "گوینده توی visitor centre ایستاده. دنبال کلمه‌ی opposite باش.",
      },
    },
    {
      n: 16,
      prompt: "Tool store",
      answer: "C",
      from: 122.9,
      to: 137.1,
      explanation: {
        en: "go up the main path, past the crossroads, to the top where it ends. The woodland is on the left and the tool store on the right, at C.",
        fa: "از مسیر اصلی بالا برو، از چهارراه رد شو تا جایی که مسیر تموم می‌شه. جنگل سمت چپه و انبار ابزار سمت راست، یعنی C.",
      },
      hint: {
        en: "Two places are named at the top of the path. Listen for left and right.",
        fa: "بالای مسیر دو جا اسم برده می‌شه. دنبال left و right باش.",
      },
    },
    {
      n: 17,
      prompt: "First aid point",
      answer: "H",
      from: 137.1,
      to: 145.9,
      explanation: {
        en: "it is at the crossroads, in the corner between the main path and the lake path, on the side nearest the lake. That is H.",
        fa: "سر چهارراهه، توی گوشه‌ی بین مسیر اصلی و مسیر دریاچه، سمتی که به دریاچه نزدیک‌تره. یعنی جواب درست H است.",
      },
      hint: {
        en: "It is at the crossroads. Which corner is nearest the lake?",
        fa: "سر چهارراهه. کدوم گوشه به دریاچه نزدیک‌تره؟",
      },
    },
  ] satisfies MapQuestion[],
};

/** Letter positions on the map (same layout as public/figures/l2-map.svg). */
export const mapPins: Record<string, [number, number]> = {
  A: [100, 236],
  B: [215, 72],
  C: [318, 62],
  D: [566, 108],
  E: [392, 178],
  F: [500, 318],
  G: [232, 287],
  H: [310, 172],
};
