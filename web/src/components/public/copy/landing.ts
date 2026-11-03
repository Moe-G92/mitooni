/*
 * Copy for the landing page (route /, canvas Main.dc.html), namespace mk.home.
 * Rules: no full stops in titles, headings, card titles, labels or taglines
 * (body sentences keep them); never zero-pad numbers.
 * Persian follows MainFa.dc.html: a friendly spoken register, real half-spaces
 * (U+200C), "‌ی" after a final ه, and mitooni, IELTS, Mock and skill names in
 * Latin letters. The product mock-ups (dashboard, answer sheet, score tiles,
 * report and "Ready to book?" card) stay English and left to right on the
 * Persian page too, as on the board, so dash, note, report and the ready card
 * strings are English in both languages.
 * Skill, question-type and strength names come from the app strings
 * (skills.*, types.*, strength.*). Strings with <b>…</b> render through Mixed.
 */

export const landingEn = {
  hero: {
    kicker: "Practise for <b>IELTS Academic & General</b>",
    title: "Sit IELTS before you sit IELTS",
    lead: "Real test screens, a band you can trust and feedback in <b>English or Persian</b>.",
    cta: "Start practising",
    secondary: "How to use",
    point1: "Listening, Reading, Writing, Speaking",
    point2: "Computer-delivered format",
    chip1: "Real test screens",
    chip2: "A band you can trust",
    chip3: "Feedback in English or Persian",
    art: "A mitooni practice book with a Listening answer sheet being marked and stamped band 7.0",
  },
  diff: {
    title: "<b>What makes</b> mitooni <b>different?</b>",
    typesKicker: "Practise exactly what costs you marks",
    typesTitle: "Every question type, tracked and drilled",
    typesBody:
      "Your dashboard scores every official question type against your target, charts your band over time and picks the next ten minute drill for you. Matching headings costing you marks? You will see it, and fix it.",
    feedbackKicker: "Notes on your own sentences",
    feedbackTitle: "Feedback you can act on",
    feedbackBody: "<b>Writing:</b> Every essay comes back with a band for each criterion and notes on your own sentences.",
  },
  dash: {
    title: "Question types",
    note: "Correct answers across your last four tests",
    target: "target {{n}}",
    overall: "Overall band",
    since: "+{{n}} since September",
    targetBand: "Target {{n}}",
    focus: "Focus here next",
    drill: "Matching headings drill",
    drillMeta: "{{min}} min · {{q}} questions",
    start: "Start drill",
  },
  note: {
    kind: "Grammar",
    text: "No \"the\" before a group in general",
  },
  mock: {
    kicker: "Start with a",
    title: "Full mock exam",
    body: "2 hours 45 minutes. You get a band for every skill and one clear next step.",
    cta: "Create your account",
  },
  report: {
    title: "<b>What your report shows</b> after every mock",
    meta: "Sample report · Mock {{n}} · 28 October",
    name: "Sara's full mock result",
    overall: "Overall band",
    target: "Target {{n}}",
    marksTitle: "Where your Reading marks went",
    correct: "Correct",
    band: "Band {{n}}",
    outOf: "{{n}} out of {{total}} correct",
    bandsTitle: "Bands against your target",
    analysis: "Analysis",
    a1: "<b>Matching headings cost you 6 marks.</b> You picked headings that repeat words from the paragraph instead of its main idea.",
    a2: "<b>You ran out of time on Passage 3.</b> You spent 26 minutes on Passage 1, so the last 5 questions were guesses.",
    a3: "<b>Listening is on target at 7.0.</b> Keep it there with one Part 4 set a week.",
    next: "Next step",
    nextTitle: "Matching headings drill · {{n}} min",
    seeFull: "See full report",
  },
  ready: {
    title: "Walk into the test <b>knowing your band</b>",
    body: "No more guessing whether you are ready to book.",
    cta: "Start practising",
    card: "Ready to book?",
    target: "Target {{n}}",
    yes: "Yes, you can book your test",
  },
};

export const landingFa: typeof landingEn = {
  hero: {
    kicker: "هر چیزی که برای نمره‌ی دلخواهت نیاز داری",
    title: "قبل از آزمون، نمره‌ت رو بدون",
    lead: "همه‌چی مو به مو مثل روز امتحانه. نمره‌ای که می‌گیری واقعیه و هر جا اشتباه کنی، به <b>فارسی یا انگلیسی</b> برات توضیح می‌دیم.",
    cta: "همین الان شروع کن",
    secondary: "راهنمای استفاده",
    point1: "هر چهار مهارت، Listening, Reading, Writing, Speaking",
    point2: "فرمت Computer-delivered",
    chip1: "همون صفحه‌های آزمون اصلی",
    chip2: "نمره‌ای که می‌شه روش حساب کرد",
    chip3: "توضیح به فارسی یا انگلیسی",
    art: "کتاب تمرین mitooni با پاسخ‌برگ Listening که تصحیح می‌شه و مُهر نمره‌ی ۷٫۰ می‌خوره",
  },
  diff: {
    title: "<b>فرق</b> mitooni <b>با بقیه چیه؟</b>",
    typesKicker: "روی همون جایی کار کن که ازت نمره کم می‌کنه",
    typesTitle: "همه‌ی مدل سؤال‌ها، زیر ذره‌بین",
    typesBody:
      "داشبوردت هر مدل سؤال رسمی رو با نمره‌ی هدفت می‌سنجه، نمودار پیشرفتت رو جلوی چشمت می‌ذاره و تمرین ده دقیقه‌ای بعدی رو خودش برات انتخاب می‌کنه. اگه سؤال‌هایی مثل Matching headings نمره‌ت رو پایین میارن، همین‌جا می‌فهمی و درستش می‌کنی.",
    feedbackKicker: "نکته روی جمله‌های خودت",
    feedbackTitle: "بازخوردی که واقعاً به کارت میاد",
    feedbackBody: "<b>Writing:</b> هر essay که می‌نویسی، با نمره‌ی جدا برای هر معیار و نکته روی جمله‌های خودت برمی‌گرده.",
  },
  // English on the Persian page too (product mock-ups, see the note at the top).
  dash: landingEn.dash,
  note: landingEn.note,
  mock: {
    kicker: "با یه",
    title: "Mock کامل شروع کن",
    body: "۲ ساعت و ۴۵ دقیقه وقت می‌ذاری و برای هر مهارت یه نمره‌ی جدا می‌گیری، همراه با قدم بعدی‌ای که باید برداری.",
    cta: "حسابت رو بساز",
  },
  report: {
    ...landingEn.report,
    title: "<b>گزارشت چی بهت نشون می‌ده</b> بعد از هر Mock",
  },
  ready: {
    ...landingEn.ready,
    title: "با دونستن <b>نمره‌ت</b> برو سر جلسه",
    body: "دیگه لازم نیست حدس بزنی که برای ثبت‌نام آماده‌ای یا نه.",
    cta: "همین الان شروع کن",
  },
};
