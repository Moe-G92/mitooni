/*
 * Copy for the What is IELTS? page (route /what-is-ielts, canvas WhatIsIELTS.dc.html), namespace mk.what.
 * Rules: no full stops in titles, headings, card titles, labels or taglines
 * (body sentences keep them); never zero-pad numbers; Persian uses real
 * half-spaces (U+200C) and keeps "mitooni" in Latin letters.
 * The Persian copy follows the canvas WhatIsIELTSFa.dc.html: a casual, spoken
 * tone, with IELTS, skill and test names left in English (the page isolates
 * those English runs with <bdi>). Numbers use Persian digits.
 */

export const whatEn = {
  kicker: "Know the test you're preparing for",
  title: "What is IELTS?",
  lead: "IELTS (International English Language Testing System) measures your English in four skills: <b>Listening, Reading, Writing and Speaking</b>. You get a band from 0 to 9 for each skill and an overall band. You can take it on paper or on computer, and it takes about 2 hours 45 minutes.",
  chips: {
    bands: "Bands 0 to 9",
    orgs: "12,000+ organisations",
    format: "Paper or computer",
  },
  countries: "Recognised in 140+ countries",
  skills: {
    title: "The four skills",
    lead: "Listening, Reading and Writing are taken on the same day, with no breaks between them. Speaking can be on the same day or up to a week before or after.",
    listening: {
      name: "Listening",
      time: "About 30 minutes",
      detail: "4 parts · 40 questions",
    },
    reading: {
      name: "Reading",
      time: "60 minutes",
      detail: "3 passages · 40 questions",
    },
    writing: {
      name: "Writing",
      time: "60 minutes",
      detail: "Task 1 and Task 2",
    },
    speaking: {
      name: "Speaking",
      time: "11 to 14 minutes",
      detail: "3 parts, face to face",
    },
  },
  types: {
    title: "Which test do you need?",
    lead: "Always check the band and test type your university, employer or visa asks for before you book.",
    cta: "Start practising",
    academic: {
      name: "IELTS Academic",
      body: "For university study (undergraduate or postgraduate) and professional registration, such as doctors and nurses.",
    },
    general: {
      name: "IELTS General Training",
      body: "For work experience or training, secondary school, and migration to countries such as Australia, Canada, New Zealand and the UK.",
    },
    ukvi: {
      name: "IELTS for UKVI",
      body: "The Academic or General Training test taken at an approved centre, for UK visa and immigration applications.",
    },
    life: {
      name: "IELTS Life Skills",
      body: "A Speaking and Listening test at A1, A2 or B1 level, for some UK family, settlement and citizenship visas.",
    },
    note: "Listening and Speaking are the same in Academic and General Training. Reading and Writing are different.",
  },
};

export const whatFa: typeof whatEn = {
  kicker: "اول ببین با چه آزمونی طرفی",
  title: "درباره‌ی IELTS",
  lead: "IELTS (International English Language Testing System) انگلیسیت رو توی چهار مهارت محک می‌زنه: <b>Listening, Reading, Writing, Speaking</b>. برای هر مهارت یه نمره از ۰ تا ۹ می‌گیری و یه Overall band هم برای کل آزمون. می‌تونی کاغذی یا کامپیوتری بدیش و کلش حدود ۲ ساعت و ۴۵ دقیقه طول می‌کشه.",
  chips: {
    bands: "Band از ۰ تا ۹",
    orgs: "بیش از ۱۲٬۰۰۰ سازمان",
    format: "کاغذی یا کامپیوتری",
  },
  countries: "پذیرفته‌شده در بیش از ۱۴۰ کشور",
  skills: {
    title: "چهار مهارت",
    lead: "Listening، Reading و Writing توی یه روز و پشت سر هم برگزار می‌شن، بدون استراحت. Speaking ممکنه همون روز باشه یا تا یه هفته قبل یا بعدش.",
    listening: {
      name: "Listening",
      time: "حدود ۳۰ دقیقه",
      detail: "۴ بخش · ۴۰ سؤال",
    },
    reading: { name: "Reading", time: "۶۰ دقیقه", detail: "۳ متن · ۴۰ سؤال" },
    writing: { name: "Writing", time: "۶۰ دقیقه", detail: "Task 1 و Task 2" },
    speaking: {
      name: "Speaking",
      time: "۱۱ تا ۱۴ دقیقه",
      detail: "۳ بخش، رو در رو",
    },
  },
  types: {
    title: "کدوم آزمون به کارت میاد؟",
    lead: "قبل از ثبت‌نام یه بار چک کن دانشگاه، کارفرما یا مرجع ویزا چه آزمونی و چه نمره‌ای ازت خواسته.",
    cta: "تمرین رو شروع کن",
    academic: {
      name: "IELTS Academic",
      body: "اگه می‌خوای دانشگاه بری، از کارشناسی تا تحصیلات تکمیلی، یا برای کارت ثبت‌نام حرفه‌ای لازم داری، مثل پزشک‌ها و پرستارها.",
    },
    general: {
      name: "IELTS General Training",
      body: "برای سابقه‌ی کار، دوره‌ی آموزشی، دبیرستان و مهاجرت به کشورهایی مثل استرالیا، کانادا، نیوزیلند و بریتانیا.",
    },
    ukvi: {
      name: "IELTS for UKVI",
      body: "همون آزمون Academic یا General Training که توی یه مرکز تأییدشده برگزار می‌شه و برای ویزا و مهاجرت به بریتانیا به کار میاد.",
    },
    life: {
      name: "IELTS Life Skills",
      body: "آزمونی برای Speaking و Listening در سطح A1، A2 یا B1، برای بعضی ویزاهای خانوادگی، اقامت و شهروندی بریتانیا.",
    },
    note: "Listening و Speaking در Academic و General Training یکیه. Reading و Writing فرق داره.",
  },
};
