import type { Localized } from "@/api/schemas";

/*
 * Dummy content for the Speaking practice player (canvas board
 * PracticeSpeaking): Part 2 cue cards with one minute to prepare and a two
 * minute long turn. Speaking time and long pauses are measured from the
 * learner's own recording; fillers, linking words and the next step are
 * example notes, labelled as such on screen.
 */

export type CueCard = {
  topic: string;
  points: string[];
  explain: string;
  /** Placeholder ideas for the four sticky notes. */
  notes: [string, string, string, string];
  fillers: { word: string; times: number }[];
  linking: string[];
  nextStep: Localized;
  hint: Localized;
};

export const speakingPractice = {
  prepSec: 60,
  talkSec: 120,
  /** A take this long or longer counts as a good length. */
  goodSec: 100,
  pauseSec: 2,
  cards: [
    {
      topic: "Describe a place you visited that was more interesting than you expected.",
      points: ["where the place was", "when and why you went there", "what you expected it to be like"],
      explain: "and explain why it turned out to be more interesting than you expected.",
      notes: ["Old market, Kashan", "Expected: dusty, boring", "Rose water workshop", "Stayed till sunset"],
      fillers: [
        { word: "um", times: 4 },
        { word: "like", times: 2 },
      ],
      linking: ["actually", "what surprised me", "in the end"],
      nextStep: {
        en: "Open with one full sentence from your first sticky note, like \"Last spring I went to the old market in Kashan\". Starting strong cuts most of the early \"um\"s.",
        fa: "صحبتت رو با یه جمله‌ی کامل از اولین یادداشتت شروع کن، مثلاً Last spring I went to the old market in Kashan. یه شروع محکم بیشتر umهای اول کار رو حذف می‌کنه.",
      },
      hint: {
        en: "Talk through the card in order: where, when and why, what you expected. Save the surprise for the last 40 seconds.",
        fa: "به ترتیب کارت جلو برو: کجا، کی و چرا، چه انتظاری داشتی. غافلگیری رو برای ۴۰ ثانیه‌ی آخر نگه دار.",
      },
    },
    {
      topic: "Describe a skill you learned from an older person.",
      points: ["what the skill is", "who taught it to you", "how you learned it"],
      explain: "and explain why this skill is still useful to you.",
      notes: ["Baking bread", "Grandmother, every Friday", "Watched, then tried", "Calm, patient"],
      fillers: [
        { word: "you know", times: 3 },
        { word: "so", times: 5 },
      ],
      linking: ["at first", "after a while", "these days"],
      nextStep: {
        en: "You started many sentences with \"so\". Try \"At first\", \"After a while\" and \"These days\" to move through time instead.",
        fa: "خیلی از جمله‌هات رو با so شروع کردی. به جاش از At first، After a while و These days استفاده کن تا داستان توی زمان جلو بره.",
      },
      hint: {
        en: "Tell it as a short story with a beginning, a middle and today.",
        fa: "مثل یه داستان کوتاه تعریفش کن: شروع، وسط، و امروز.",
      },
    },
    {
      topic: "Describe a time you had to wait for something.",
      points: ["what you were waiting for", "how long you waited", "what you did while you waited"],
      explain: "and explain how you felt when the wait was over.",
      notes: ["Exam results", "Six weeks", "Started running", "Relief, then pride"],
      fillers: [
        { word: "er", times: 6 },
        { word: "basically", times: 2 },
      ],
      linking: ["meanwhile", "to be honest", "finally"],
      nextStep: {
        en: "Most of your pauses came before feelings. Prepare two feeling words on your notes, like \"anxious\" and \"relieved\", so they are ready.",
        fa: "بیشتر مکث‌هات قبل از گفتن احساس‌ها بود. دو کلمه‌ی احساسی مثل anxious و relieved رو توی یادداشت‌هات آماده کن.",
      },
      hint: {
        en: "Spend about 30 seconds on each point, and keep 30 seconds for how you felt.",
        fa: "برای هر نکته حدود ۳۰ ثانیه وقت بذار و ۳۰ ثانیه هم برای احساست نگه دار.",
      },
    },
  ] satisfies CueCard[],
};
