import type { Localized } from "@/api/schemas";

/*
 * Dummy content for the Reading practice player (canvas board
 * PracticeReading): matching headings on a short academic passage. Five
 * paragraphs, eight headings, three of them distractors. The passage stays in
 * English; the feedback is localised.
 */

export type Heading = { key: string; text: string };

export type Paragraph = {
  key: string;
  text: string;
  /** The topic sentence, marked in the passage after a hint or a wrong answer. */
  topic: string;
  answer: string;
  /** What the paragraph is really about, for the "not quite" feedback. */
  about: Localized;
  hint: Localized;
};

export const readingPractice = {
  section: "Travel",
  issue: "Issue 12",
  title: "The quiet comeback of night trains",
  standfirst: "Once written off as slow and old fashioned, sleeper services are filling up again across Europe.",
  minutes: 20,
  headings: [
    { key: "i", text: "Delays caused by crowded tracks" },
    { key: "ii", text: "A route network that almost disappeared" },
    { key: "iii", text: "Better comfort and public support" },
    { key: "iv", text: "Why tickets cost more than flights" },
    { key: "v", text: "Plans for the years ahead" },
    { key: "vi", text: "The engineering behind sleeper carriages" },
    { key: "vii", text: "A new taste for slow travel" },
    { key: "viii", text: "Airlines respond to rail competition" },
  ] satisfies Heading[],
  paragraphs: [
    {
      key: "A",
      text: "Twenty years ago, the overnight train looked finished. Airlines were cheap, high speed lines were shortening daytime journeys, and one operator after another cut its sleeper routes. By 2010 many of the famous cross border services had simply stopped running.",
      topic: "Twenty years ago, the overnight train looked finished.",
      answer: "ii",
      about: { en: "how the sleeper network was cut back until many routes stopped", fa: "کوچیک شدن شبکه‌ی قطارهای شبانه، تا جایی که خیلی از مسیرها تعطیل شدن" },
      hint: {
        en: "Look at the last sentence too: many services had simply stopped running.",
        fa: "به جمله‌ی آخر هم نگاه کن: خیلی از سرویس‌ها کلاً تعطیل شده بودن.",
      },
    },
    {
      key: "B",
      text: "Today the picture is different. A growing number of travellers say they want the journey itself to feel slower and calmer, and they like arriving in a city centre after a night's sleep rather than queueing at an airport. For some, it also feels like a way to travel with a lighter conscience.",
      topic: "A growing number of travellers say they want the journey itself to feel slower and calmer",
      answer: "vii",
      about: { en: "why travellers are choosing slower journeys", fa: "دلیل اینکه مسافرها سفرهای آروم‌تر رو انتخاب می‌کنن" },
      hint: {
        en: "The first sentence only sets the scene. The second sentence carries the main idea.",
        fa: "جمله‌ی اول فقط زمینه رو می‌چینه. ایده‌ی اصلی توی جمله‌ی دومه.",
      },
    },
    {
      key: "C",
      text: "Operators have noticed. New carriages now offer small private cabins with a proper bed, a washbasin and a breakfast tray delivered at dawn. Several governments have also agreed to share the cost of running routes that cross national borders.",
      topic: "New carriages now offer small private cabins with a proper bed",
      answer: "iii",
      about: { en: "two things together: more comfortable cabins and money from governments", fa: "دو چیز با هم، کوپه‌های راحت‌تر و کمک مالی دولت‌ها" },
      hint: {
        en: "The paragraph makes two points. Pick the heading that covers both.",
        fa: "این پاراگراف دو نکته داره. تیتری رو انتخاب کن که هر دو رو پوشش بده.",
      },
    },
    {
      key: "D",
      text: "Not every problem has been solved. Tracks are busy at night with freight trains and repair work, so sleeper services often run late, and a single cancelled train can leave hundreds of passengers looking for a hotel.",
      topic: "Tracks are busy at night with freight trains and repair work, so sleeper services often run late",
      answer: "i",
      about: { en: "late trains caused by busy tracks at night", fa: "تأخیر قطارها به خاطر شلوغی ریل‌ها در شب" },
      hint: {
        en: "Ask why the trains run late. The answer is in the middle of the sentence.",
        fa: "از خودت بپرس چرا قطارها دیر می‌رسن. جوابش وسط جمله‌ست.",
      },
    },
    {
      key: "E",
      text: "Even so, planners are optimistic. New routes linking the north and south of the continent are planned for the next few years, and the people behind them believe the night train has found a lasting place in how Europeans travel.",
      topic: "New routes linking the north and south of the continent are planned for the next few years",
      answer: "v",
      about: { en: "new routes planned for the future", fa: "مسیرهای تازه‌ای که برای آینده برنامه‌ریزی شده" },
      hint: {
        en: "Look for words about time: next few years.",
        fa: "دنبال کلمه‌هایی درباره‌ی زمان باش: next few years.",
      },
    },
  ] satisfies Paragraph[],
};
