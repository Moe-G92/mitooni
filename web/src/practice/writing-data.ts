import type { Localized } from "@/api/schemas";

/*
 * Dummy content for the Writing practice player (canvas board
 * PracticeWriting): a Task 2 opinion essay, a sample answer and canned
 * feedback. Each mark is tied to a phrase; the player finds those phrases in
 * whatever the learner submits, so the sample essay gets every mark and an
 * edited essay gets the ones that still apply.
 */

export type Criterion = "tr" | "cc" | "lr" | "gra";

export const CRITERIA: Record<Criterion, { name: string; tint: string; line: string; text: string }> = {
  tr: { name: "Task response", tint: "#E6EBFF", line: "#3E4FC4", text: "#2F3DA0" },
  cc: { name: "Coherence and cohesion", tint: "#FFE6F8", line: "#B02C8C", text: "#B02C8C" },
  lr: { name: "Lexical resource", tint: "#e6f7de", line: "#2c6e1a", text: "#2c6e1a" },
  gra: { name: "Grammatical range and accuracy", tint: "#FFE3E3", line: "#D92F3A", text: "#B8232D" },
};

export type Mark = {
  phrase: string;
  criterion: Criterion;
  kind: "strength" | "fix";
  /** Part of the phrase to highlight, when only part of it is the point. */
  show?: string;
  title: Localized;
  note: Localized;
};

export const writingPractice = {
  task: "Task 2",
  minutes: 40,
  minWords: 250,
  prompt: "Some people think cities should ban cars from their centres. To what extent do you agree or disagree?",
  instruction: "Give reasons for your answer and include any relevant examples from your own knowledge or experience.",
  sample: [
    "Many cities are struggling with traffic, pollution and noise, and some people think the best solution is to ban cars from city centres completely. In my opinion, this is a good idea in most cases, but it needs to be planned carefully. This essay will look at the benefits first and then at the difficulties.",
    "Firstly, removing cars would make the air cleaner and the streets more safer for people who walk or cycle. If cities bans cars, children could play outside and older people could cross the road without fear. Also, also shops in the centre may get more customers, because people would spend more time walking past them. In some cities where cars were removed from the centre, local shop owners say the streets became busier rather than quieter.",
    "However, there are some problems. Not everyone can walk long distances, and people who lives far away depend on their car to reach work. Public transport is important. If buses and trains are slow or expensive, a ban would simply make life harder for these groups. Delivery companies and emergency services would also need special access, which could be complicated and costly to organise. For this reason, a sudden and total ban could create new problems instead of solving old ones.",
    "In conclusion, I agree that cities should limit cars in their centres, but only if they give people good alternatives first. A gradual approach, with cheaper public transport and safe cycle lanes, would bring the benefits without leaving anyone behind.",
  ].join("\n\n"),
  /** Example bands for the sample essay, per criterion. */
  bands: { tr: 6, cc: 6, lr: 6.5, gra: 5.5 } satisfies Record<Criterion, number>,
  overall: 6,
  target: 7,
  marks: [
    {
      phrase: "to ban cars from city centres completely",
      criterion: "tr",
      kind: "strength",
      title: { en: "Clear position", fa: "موضع روشن" },
      note: {
        en: "You state your view in the introduction, good. Keep the same position all the way to the conclusion.",
        fa: "نظرت رو توی مقدمه گفتی، عالیه. همین موضع رو تا آخر، تا نتیجه‌گیری، حفظ کن.",
      },
    },
    {
      phrase: "more safer",
      criterion: "lr",
      kind: "fix",
      title: { en: "Double comparative", fa: "مقایسه‌ی دوتایی" },
      note: {
        en: "Say \"safer\", not \"more safer\". Comparatives with -er never take more.",
        fa: "بگو safer، نه more safer. صفت‌های تفضیلی که ‎-er می‌گیرن دیگه more نمی‌خوان.",
      },
    },
    {
      phrase: "If cities bans cars, children could play outside",
      criterion: "gra",
      kind: "fix",
      title: { en: "Subject and verb", fa: "فاعل و فعل" },
      note: {
        en: "Plural subject: \"If cities ban cars\". This kind of slip keeps grammar at 5.5.",
        fa: "فاعل جمعه: If cities ban cars. همین اشتباه‌های کوچیک نمره‌ی گرامر رو روی ۵٫۵ نگه می‌داره.",
      },
    },
    {
      phrase: "Also, also",
      criterion: "cc",
      kind: "fix",
      title: { en: "Repeated linker", fa: "کلمه‌ی ربط تکراری" },
      note: {
        en: "\"Also, also\" repeats the linker. Use one, or vary it with \"What is more\" or \"On top of this\".",
        fa: "Also, also کلمه‌ی ربط رو تکرار می‌کنه. یکی رو نگه دار، یا از What is more یا On top of this استفاده کن.",
      },
    },
    {
      phrase: "people who lives far away",
      criterion: "gra",
      kind: "fix",
      title: { en: "Subject and verb", fa: "فاعل و فعل" },
      note: {
        en: "\"people who live far away\": who refers to people, so the verb is plural.",
        fa: "people who live far away: کلمه‌ی who به people برمی‌گرده، پس فعل جمعه.",
      },
    },
    {
      phrase: "Public transport is important.",
      criterion: "tr",
      kind: "fix",
      title: { en: "Idea not developed", fa: "ایده باز نشده" },
      note: {
        en: "This sentence states a point but does not explain it. Add why, or give an example, to extend the idea.",
        fa: "این جمله یه نکته رو می‌گه ولی توضیحش نمی‌ده. دلیلش رو بگو یا یه مثال بیار تا ایده کامل‌تر بشه.",
      },
    },
    {
      phrase: "but only if they give people good alternatives first",
      criterion: "cc",
      kind: "strength",
      title: { en: "Strong conclusion", fa: "نتیجه‌گیری قوی" },
      note: {
        en: "Your conclusion links back to both sides of the argument. This is what examiners look for.",
        fa: "نتیجه‌گیریت به هر دو طرف بحث برمی‌گرده. این دقیقاً چیزیه که ممتحن‌ها دنبالشن.",
      },
    },
    {
      phrase: "benefits without",
      show: "benefits",
      criterion: "lr",
      kind: "strength",
      title: { en: "Good word choice", fa: "انتخاب واژه‌ی خوب" },
      note: {
        en: "\"benefits\" fits well here. Try \"advantages\" or \"gains\" earlier on to avoid repeating \"good\".",
        fa: "benefits اینجا خوب نشسته. قبل‌تر هم از advantages یا gains استفاده کن تا good تکرار نشه.",
      },
    },
  ] satisfies Mark[],
};
