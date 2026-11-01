import type { Coach, CoachReview, Notification } from "@/api/schemas";

/* A generic tutor profile: no named person and no examiner credential. */
export const coach: Coach = {
  id: "coach-1",
  name: "Your coach",
  initials: "YC",
  credentials: {
    en: "Band 8.5 IELTS tutor",
    fa: "مدرس آیلتس با نمرهٔ ۸٫۵",
  },
  bio: {
    en: "Your coach helps Persian-speaking learners find the two or three habits that hold their band down and fix them first.",
    fa: "مربی شما به فارسی‌زبان‌ها کمک می‌کند آن دو سه عادتی را که جلوی بالا رفتن نمره‌شان را گرفته است پیدا کنند و اول همان‌ها را درست کنند.",
  },
};

export const coachReviewsSeed: CoachReview[] = [
  {
    id: "review-1",
    kind: "essay",
    title: "Task 2 essay: Working from home",
    attemptId: null,
    status: "returned",
    submittedAt: "2026-10-24T17:40:00Z",
    messages: [
      {
        author: "me",
        text: "Hi, this is my Task 2 from last week's mock. I always get 5.5 in writing and I don't know what to change first.",
        at: "2026-10-24T17:40:00Z",
      },
      {
        author: "coach",
        text: "Thanks for sending it. Your structure is fine, so don't worry about that. Two things cost you most: the essay is only 233 words, and almost every paragraph has a subject–verb error ('working from home save', 'it make'). I've marked all of them in the essay. For the next one, write 260–280 words, and after you finish, spend three minutes checking only the verbs.",
        at: "2026-10-25T09:15:00Z",
      },
      {
        author: "me",
        text: "Thank you! Should I also learn more advanced vocabulary? My teacher said my words are too simple.",
        at: "2026-10-26T11:02:00Z",
      },
      {
        author: "coach",
        text: "Not yet. Accurate simple words score better than inaccurate advanced ones. Fix the grammar first, then we'll work on collocations. Try the essay on young adults living with parents and send it to me when it's done.",
        at: "2026-10-27T14:30:00Z",
      },
    ],
  },
  {
    id: "review-2",
    kind: "recording",
    title: "Speaking Part 2: A skill learned from a family member",
    attemptId: null,
    status: "in-review",
    submittedAt: "2026-10-27T19:05:00Z",
    messages: [
      {
        author: "me",
        text: "Here is my Part 2 recording. I think I spoke too fast at the start. Can you check my pronunciation of 'th' and 'w' too?",
        at: "2026-10-27T19:05:00Z",
      },
    ],
  },
];

export const notificationsSeed: Notification[] = [
  {
    id: "n1",
    title: { en: "Your mock results are ready", fa: "نتیجهٔ آزمون آزمایشی شما آماده است" },
    body: {
      en: "Academic Mock 1 has been marked. See your band scores and detailed feedback on both writing tasks.",
      fa: "آزمون آزمایشی آکادمیک ۱ نمره‌دهی شد. نمره‌ها و بازخورد کامل هر دو تسک رایتینگ را ببینید.",
    },
    at: "2026-10-28T18:20:00Z",
    read: false,
    href: "/app/results",
  },
  {
    id: "n2",
    title: { en: "Your coach replied", fa: "مربی‌تان پاسخ داد" },
    body: {
      en: "Your coach left new comments on your Task 2 essay about working from home.",
      fa: "مربی‌تان نکته‌های تازه‌ای روی مقالهٔ تسک ۲ شما دربارهٔ دورکاری نوشت.",
    },
    at: "2026-10-27T14:30:00Z",
    read: false,
    href: "/app/coach",
  },
  {
    id: "n3",
    title: { en: "12 words to review today", fa: "۱۲ واژه برای مرور امروز" },
    body: {
      en: "A five-minute review now helps these words stay in long-term memory.",
      fa: "یک مرور پنج‌دقیقه‌ای همین حالا کمک می‌کند این واژه‌ها در حافظهٔ بلندمدت بمانند.",
    },
    at: "2026-10-26T07:00:00Z",
    read: true,
    href: "/app/vocabulary",
  },
  {
    id: "n4",
    title: { en: "Time for your next mock", fa: "وقت آزمون آزمایشی بعدی است" },
    body: {
      en: "It's been a week since your last full mock. Book a quiet 3-hour slot this weekend.",
      fa: "یک هفته از آخرین آزمون آزمایشی کاملتان گذشته است. این آخر هفته سه ساعت وقت آزاد و بی‌دغدغه برایش کنار بگذارید.",
    },
    at: "2026-10-24T08:30:00Z",
    read: true,
    href: "/app/mocks",
  },
  {
    id: "n5",
    title: { en: "30 days to your test", fa: "۳۰ روز تا آزمون شما" },
    body: {
      en: "One month to go. Focus on Writing Task 2 grammar and do one full mock each week.",
      fa: "یک ماه مانده است. روی دستور زبان در تسک ۲ رایتینگ تمرکز کنید و هر هفته یک آزمون آزمایشی کامل بدهید.",
    },
    at: "2026-10-22T06:00:00Z",
    read: true,
    href: "/app",
  },
];
