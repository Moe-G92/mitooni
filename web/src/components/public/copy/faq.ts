/*
 * Copy for the FAQ page (route /faq, canvas FAQ.dc.html), namespace mk.faqPage.
 * Rules: no full stops in titles, headings, card titles, labels or taglines
 * (body sentences keep them); never zero-pad numbers; Persian uses real
 * half-spaces (U+200C) and keeps "mitooni" in Latin letters.
 * The Persian copy follows the canvas FAQFa.dc.html: a casual, spoken tone,
 * with IELTS, skill and test names left in English (the page isolates those
 * English runs with <bdi>). Numbers use Persian digits.
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
  title: "سؤال‌های رایج",
  lead: "جواب کوتاهِ سؤال‌هایی که بیشتر از همه می‌پرسن؛ درباره‌ی mitooni، نمره، تمرین و کوچینگ.",
  jump: "برو سراغ یه موضوع",
  groups: {
    about: "درباره‌ی mitooni",
    bands: "نمره و نتیجه",
    practice: "تمرین",
    coaching: "کوچینگ",
  },
  about: {
    q1: "این همون آزمون رسمی IELTSـه؟",
    a1: "نه. mitooni یه پلتفرم مستقل برای تمرینه و هیچ ارتباطی با IELTS، British Council، IDP یا Cambridge نداره. صفحه‌های آزمون رو از روی نسخه‌ی کامپیوتریِ منتشرشده ساختیم، که هر چی اینجا تمرین می‌کنی، سر جلسه‌ی اصلی هم به کارت بیاد.",
    q2: "هم Academic داره هم General Training؟",
    a2: "آره. Listening و Speaking توی هر دو یکیه. برای Reading و Writing خودت انتخاب می‌کنی کدوم رو می‌دی، و Mockها، تمرین‌ها و جدول نمره‌ها هم با همون تنظیم می‌شن.",
    q3: "فارسی هم داره؟",
    a3: "آره. زبان سایت رو می‌تونی فارسی کنی و نکته‌ها و توضیح جواب‌ها هم فارسی هست، هم انگلیسی. خود آزمون‌ها ولی مثل آزمون اصلی انگلیسی‌ان.",
  },
  bands: {
    q1: "نمره‌ها چقدر دقیقن؟",
    a1: "Listening و Reading با کلید جواب و جدول‌های رسمی نمره تصحیح می‌شن، برای همین نمره‌شون خیلی به آزمون اصلی نزدیکه. Writing و Speaking با همون چهار معیار رسمی سنجیده می‌شن و نمره‌شون یه بازه‌ست؛ هر چی بیشتر تمرین کنی، این بازه تنگ‌تر و دقیق‌تر می‌شه.",
    q2: "توی کارنامه چی می‌بینم؟",
    a2: "نمره‌ی هر مهارت کنار نمره‌ی هدفت، نوع سؤال‌هایی که ازت نمره گرفتن، جاهایی که وقت کم آوردی و این‌که قدم بعدی چیه. جواب هر سؤال Listening و Reading هم مستقیم به همون جمله‌ی متن یا صدا وصله.",
  },
  practice: {
    q1: "می‌شه بدون تایمر تمرین کرد؟",
    a1: "آره. Mockهای کامل مثل آزمون اصلی تایمر دارن، ولی تمرین‌های مهارت و نوع سؤال رو تا وقتی داری تکنیک‌ها رو یاد می‌گیری، می‌تونی بی‌عجله انجام بدی و هر وقت آماده بودی تایمر رو روشن کنی.",
    q2: "با گوشی هم می‌شه؟",
    a2: "با گوشی نتایجت رو می‌بینی، برنامه‌ی مطالعه‌ت رو دنبال می‌کنی و لغت تمرین می‌کنی. ولی Mock کامل رو با لپ‌تاپ یا کامپیوتر بده، چون آزمون کامپیوتری اصلی هم پشت کامپیوتر برگزار می‌شه.",
    q3: "Speaking رو چطور تمرین کنم؟",
    a3: "اتاق Speaking سؤال رو برات پخش می‌کنه، جوابت رو ضبط می‌کنه و نشون می‌ده چقدر حرف زدی. بعدش درباره‌ی روانی، لغت، گرامر و تلفظت نکته می‌گیری.",
  },
  coaching: {
    q1: "مربی چی‌کار می‌کنه؟",
    a1: "یه مدرس با نمره‌ی ۸٫۵ نوشته‌هات رو تصحیح می‌کنه، صداهای Speakingت رو گوش می‌ده و توی یه جلسه‌ی آنلاین، برنامه‌ی هفته‌های بعد رو با هم می‌چینین.",
    q2: "بدون کوچینگ هم می‌شه از mitooni استفاده کرد؟",
    a2: "آره، حتماً. همه‌ی تمرین‌ها، Mockها، کارنامه‌ها و برنامه‌ی مطالعه بدون مربی هم در دسترسه. کوچینگ یه گزینه‌ی اضافه‌ست برای کسی که دلش می‌خواد یکی نکته‌های شخصی بهش بده و هر هفته پیگیرش باشه.",
  },
  contactTitle: "سؤالت اینجا نبود؟",
  contactBody: "بهمون پیام بده؛ تا یه روز کاری جوابت رو می‌دیم.",
  contact: "پیام بده",
};
