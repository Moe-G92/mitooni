/*
 * Copy for the FAQ page (route /faq, canvas FAQ.dc.html), namespace mk.faqPage.
 * Rules: no full stops in titles, headings, card titles, labels or taglines
 * (body sentences keep them); never zero-pad numbers; Persian uses real
 * half-spaces (U+200C) and keeps "mitooni" in Latin letters.
 */

export const faqPageEn = {
  kicker: "Help centre",
  title: "Frequently asked questions",
  lead: "Quick answers about mitooni, your band, practising and coaching.",
  jump: "Jump to a topic",
  groups: {
    about: "About mitooni",
    bands: "Bands and results",
    practice: "Practising",
    coaching: "Coaching",
  },
  about: {
    q1: "Is this the official IELTS test?",
    a1: "No. mitooni is an independent practice platform and is not affiliated with IELTS, the British Council, IDP or Cambridge. Our screens follow the published computer-delivered test, so your practice transfers to the real one.",
    q2: "Does it cover both Academic and General Training?",
    a2: "Yes. Listening and Speaking are the same for both. You choose Academic or General Training for Reading and Writing, and your mocks, drills and band tables follow that choice.",
    q3: "Does it work in Persian?",
    a3: "Yes. You can switch the whole site to Farsi, and feedback and answer explanations are available in English or Farsi. The tests themselves stay in English, just like the real exam.",
  },
  bands: {
    q1: "How accurate is the band?",
    a1: "Listening and Reading are marked against the answer key and the published band tables, so those bands are close to what you would get. Writing and Speaking bands use the four official criteria and are shown as a range that narrows as you practise more.",
    q2: "What does my report show?",
    a2: "A band for each skill against your target, the question types where you lost marks, where time ran out, and one clear next step. Every Listening and Reading answer links to the exact words in the transcript or passage.",
  },
  practice: {
    q1: "Can I practise without a time limit?",
    a1: "Yes. Full mocks are timed like the real test, but skill practice and question type drills can be done untimed while you learn a technique, then timed when you are ready.",
    q2: "Can I use it on my phone?",
    a2: "You can review results, follow your study plan and do vocabulary practice on your phone. For full mocks we recommend a laptop or desktop, because the real computer-delivered test is taken on a computer.",
    q3: "How is Speaking practised?",
    a3: "The Speaking room plays each question, records your answer and shows a clock of how long you spoke. You get notes on fluency, vocabulary, grammar and pronunciation.",
  },
  coaching: {
    q1: "What does a coach do?",
    a1: "A Band 8.5 tutor marks your essays, listens to your Speaking recordings and meets you on a live call to plan the next weeks of practice.",
    q2: "Do I need coaching to use mitooni?",
    a2: "No. All practice, mocks, reports and your study plan work without a coach. Coaching is an extra for people who want personal feedback and accountability.",
  },
  contactTitle: "Still have a question?",
  contactBody: "Send us a message and we'll reply within one working day.",
  contact: "Contact us",
};

export const faqPageFa: typeof faqPageEn = {
  kicker: "مرکز راهنما",
  title: "پرسش‌های پرتکرار",
  lead: "پاسخ‌های کوتاه دربارهٔ mitooni، نمرهٔ شما، تمرین و مربی‌گری.",
  jump: "رفتن به یک موضوع",
  groups: {
    about: "دربارهٔ mitooni",
    bands: "نمره‌ها و نتیجه‌ها",
    practice: "تمرین",
    coaching: "مربی‌گری",
  },
  about: {
    q1: "آیا این آزمون رسمی آیلتس است؟",
    a1: "نه. mitooni یک پلتفرم تمرینی مستقل است و هیچ ارتباطی با آیلتس، بریتیش کانسل، آی‌دی‌پی یا کمبریج ندارد. صفحه‌های ما از آزمون کامپیوتری منتشرشده پیروی می‌کنند، پس تمرین شما مستقیم به آزمون واقعی منتقل می‌شود.",
    q2: "آیا هم آکادمیک و هم جنرال را پوشش می‌دهد؟",
    a2: "بله. لیسنینگ و اسپیکینگ برای هر دو یکسان است. برای ریدینگ و رایتینگ، آکادمیک یا جنرال را انتخاب می‌کنید و آزمون‌های آزمایشی، تمرین‌ها و جدول‌های نمره از همان انتخاب پیروی می‌کنند.",
    q3: "آیا به فارسی هم کار می‌کند؟",
    a3: "بله. می‌توانید کل سایت را فارسی کنید و بازخورد و توضیح پاسخ‌ها به فارسی یا انگلیسی در دسترس است. خود آزمون‌ها مثل آزمون واقعی انگلیسی می‌مانند.",
  },
  bands: {
    q1: "نمره چقدر دقیق است؟",
    a1: "لیسنینگ و ریدینگ با کلید پاسخ و جدول‌های رسمی نمره تصحیح می‌شوند، پس این نمره‌ها به نمرهٔ واقعی شما نزدیک‌اند. نمرهٔ رایتینگ و اسپیکینگ بر پایهٔ چهار معیار رسمی است و به‌صورت یک بازه نشان داده می‌شود که با تمرین بیشتر باریک‌تر می‌شود.",
    q2: "گزارش من چه چیزهایی را نشان می‌دهد؟",
    a2: "نمرهٔ هر مهارت در برابر هدفتان، نوع سؤال‌هایی که در آن‌ها نمره از دست دادید، جایی که وقت کم آوردید و یک قدم بعدی روشن. هر پاسخ لیسنینگ و ریدینگ به همان واژه‌ها در متن گفتار یا متن خواندنی پیوند دارد.",
  },
  practice: {
    q1: "می‌توانم بدون محدودیت زمانی تمرین کنم؟",
    a1: "بله. آزمون‌های آزمایشی کامل مثل آزمون واقعی زمان‌دار هستند، اما تمرین مهارت‌ها و انواع سؤال را می‌توانید وقتی تکنیکی را یاد می‌گیرید بدون زمان انجام دهید و هر وقت آماده بودید زمان‌دار.",
    q2: "می‌توانم با گوشی از آن استفاده کنم؟",
    a2: "دیدن نتیجه‌ها، دنبال‌کردن برنامهٔ مطالعه و تمرین واژگان روی گوشی کار می‌کند. برای آزمون آزمایشی کامل لپ‌تاپ یا کامپیوتر را پیشنهاد می‌کنیم، چون آزمون کامپیوتری واقعی هم روی کامپیوتر برگزار می‌شود.",
    q3: "اسپیکینگ چطور تمرین می‌شود؟",
    a3: "اتاق اسپیکینگ هر سؤال را پخش می‌کند، پاسخ شما را ضبط می‌کند و نشان می‌دهد چقدر صحبت کردید. دربارهٔ روانی، واژگان، دستور زبان و تلفظ یادداشت می‌گیرید.",
  },
  coaching: {
    q1: "مربی چه کاری انجام می‌دهد؟",
    a1: "یک مدرس با نمرهٔ ۸٫۵ نوشته‌های شما را تصحیح می‌کند، به ضبط‌های اسپیکینگ شما گوش می‌دهد و در یک تماس زنده با شما برنامهٔ تمرین هفته‌های بعد را می‌چیند.",
    q2: "برای استفاده از mitooni به مربی نیاز دارم؟",
    a2: "نه. همهٔ تمرین‌ها، آزمون‌های آزمایشی، گزارش‌ها و برنامهٔ مطالعه بدون مربی کار می‌کنند. مربی‌گری یک امکان اضافه برای کسانی است که بازخورد شخصی و پیگیری می‌خواهند.",
  },
  contactTitle: "هنوز پرسشی دارید؟",
  contactBody: "برایمان پیام بفرستید؛ تا یک روز کاری پاسخ می‌دهیم.",
  contact: "تماس با ما",
};
