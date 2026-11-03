/*
 * Copy for the public site and the sign-in pages (namespace "mk").
 * The shared header and footer live here; each page keeps its own copy file in
 * src/components/public/copy/ and is merged in below.
 * Rules: no full stops in titles, headings, labels or taglines; no prices, no
 * "free". Persian follows the canvas Fa boards: a friendly spoken register,
 * real half-spaces (U+200C), "‌ی" after a final ه, and IELTS, Mock and
 * "mitooni" kept in Latin letters (Mixed wraps them in <bdi> at render time).
 * Letter-spacing and upper case are switched off for Persian in CSS.
 */

import { authEn, authFa } from "@/components/public/copy/auth";
import { landingEn, landingFa } from "@/components/public/copy/landing";
import { whatEn, whatFa } from "@/components/public/copy/whatIsIelts";
import { faqPageEn, faqPageFa } from "@/components/public/copy/faq";
import { howToEn, howToFa } from "@/components/public/copy/howToUse";
import { coachPageEn, coachPageFa } from "@/components/public/copy/coaching";

export const marketingEn = {
  nav: {
    label: "Site",
    home: "mitooni home",
    how: "How to use",
    what: "What is IELTS?",
    coaching: "Coaching",
    studyRoom: "Your study room",
    mocks: "Mock exams",
    faq: "FAQ",
    try: "Try now",
    open: "Open the app",
    signIn: "Sign in",
    menu: "Menu",
    close: "Close menu",
  },
  footer: {
    product: "Product",
    account: "Account",
    language: "Language",
    create: "Create account",
    rights: "© 2026 mitooni. Prototype.",
    disclaimer: "Independent practice platform. Not affiliated with IELTS, the British Council, IDP or Cambridge.",
  },
  home: landingEn,
  what: whatEn,
  faqPage: faqPageEn,
  howTo: howToEn,
  coachPage: coachPageEn,
  auth: authEn,
};

export type MarketingMessages = typeof marketingEn;

export const marketingFa: MarketingMessages = {
  nav: {
    label: "سایت",
    home: "صفحه‌ی اصلی mitooni",
    how: "راهنمای استفاده",
    what: "درباره‌ی IELTS",
    coaching: "کوچینگ",
    studyRoom: "اتاق مطالعه",
    mocks: "آزمون‌های Mock",
    faq: "سؤال‌های رایج",
    try: "شروع کن",
    open: "برو به اتاق مطالعه",
    signIn: "ورود",
    menu: "منو",
    close: "بستن منو",
  },
  footer: {
    product: "محصول",
    account: "حساب کاربری",
    language: "زبان",
    create: "ساخت حساب",
    rights: "© ۲۰۲۶ mitooni. نسخه‌ی نمونه.",
    disclaimer: "یه پلتفرم تمرینی مستقلیم و به IELTS، British Council، IDP یا Cambridge هیچ ربطی نداریم.",
  },
  home: landingFa,
  what: whatFa,
  faqPage: faqPageFa,
  howTo: howToFa,
  coachPage: coachPageFa,
  auth: authFa,
};
