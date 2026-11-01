/*
 * Copy for the What is IELTS? page (route /what-is-ielts, canvas WhatIsIELTS.dc.html), namespace mk.what.
 * Rules: no full stops in titles, headings, card titles, labels or taglines
 * (body sentences keep them); never zero-pad numbers; Persian uses real
 * half-spaces (U+200C) and keeps "mitooni" in Latin letters.
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
    listening: { name: "Listening", time: "About 30 minutes", detail: "4 parts · 40 questions" },
    reading: { name: "Reading", time: "60 minutes", detail: "3 passages · 40 questions" },
    writing: { name: "Writing", time: "60 minutes", detail: "Task 1 and Task 2" },
    speaking: { name: "Speaking", time: "11 to 14 minutes", detail: "3 parts, face to face" },
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
  kicker: "آزمونی را که برایش آماده می‌شوید بشناسید",
  title: "آیلتس چیست؟",
  lead: "آیلتس (IELTS، سامانهٔ بین‌المللی آزمون زبان انگلیسی) انگلیسی شما را در چهار مهارت می‌سنجد: <b>شنیدن، خواندن، نوشتن و صحبت کردن</b>. برای هر مهارت یک نمره (باند) از ۰ تا ۹ می‌گیرید و یک نمرهٔ کلی هم دارید. آزمون را می‌توانید روی کاغذ یا با کامپیوتر بدهید و حدود ۲ ساعت و ۴۵ دقیقه طول می‌کشد.",
  chips: {
    bands: "نمره از ۰ تا ۹",
    orgs: "بیش از ۱۲٬۰۰۰ سازمان",
    format: "کاغذی یا کامپیوتری",
  },
  countries: "پذیرفته‌شده در بیش از ۱۴۰ کشور",
  skills: {
    title: "چهار مهارت آزمون",
    lead: "شنیدن، خواندن و نوشتن در یک روز و پشت سر هم، بدون استراحت برگزار می‌شوند. صحبت کردن ممکن است همان روز باشد یا تا یک هفته قبل یا بعد از آن.",
    listening: { name: "شنیدن", time: "حدود ۳۰ دقیقه", detail: "۴ بخش · ۴۰ سؤال" },
    reading: { name: "خواندن", time: "۶۰ دقیقه", detail: "۳ متن · ۴۰ سؤال" },
    writing: { name: "نوشتن", time: "۶۰ دقیقه", detail: "تسک ۱ و تسک ۲" },
    speaking: { name: "صحبت کردن", time: "۱۱ تا ۱۴ دقیقه", detail: "۳ بخش، رودررو با ممتحن" },
  },
  types: {
    title: "به کدام آزمون نیاز دارید؟",
    lead: "پیش از ثبت‌نام، حتماً بررسی کنید دانشگاه، کارفرما یا سفارت چه نمره‌ای و کدام نوع آزمون را از شما می‌خواهد.",
    cta: "تمرین را شروع کنید",
    academic: {
      name: "آیلتس آکادمیک",
      body: "برای تحصیل در دانشگاه (کارشناسی یا تحصیلات تکمیلی) و ثبت مدرک حرفه‌ای، مثلاً برای پزشکان و پرستاران.",
    },
    general: {
      name: "آیلتس جنرال ترینینگ",
      body: "برای سابقهٔ کار یا دورهٔ آموزشی، تحصیل در دبیرستان و مهاجرت به کشورهایی مانند استرالیا، کانادا، نیوزیلند و بریتانیا.",
    },
    ukvi: {
      name: "آیلتس UKVI",
      body: "همان آزمون آکادمیک یا جنرال که در یک مرکز تأییدشده برگزار می‌شود، برای درخواست ویزا و اقامت بریتانیا.",
    },
    life: {
      name: "آیلتس لایف اسکیلز",
      body: "آزمون صحبت کردن و شنیدن در سطح A1،‏ A2 یا B1، برای برخی ویزاهای خانوادگی، اقامت دائم و شهروندی بریتانیا.",
    },
    note: "بخش‌های شنیدن و صحبت کردن در آکادمیک و جنرال یکسان‌اند. خواندن و نوشتن با هم فرق دارند.",
  },
};
