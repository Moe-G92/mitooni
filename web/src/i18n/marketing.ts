/*
 * Copy for the public site and the sign-in pages (namespace "mk").
 * The shared header and footer live here; each page keeps its own copy file in
 * src/components/public/copy/ and is merged in below.
 * Rules: no full stops in titles, headings, labels or taglines; no prices, no
 * "free"; Persian uses real half-spaces (U+200C) and keeps "mitooni" in Latin
 * letters. Letter-spacing and upper case are switched off for Persian in CSS.
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
    mocks: "Mock exams",
    practice: "Practice",
    coaching: "Coaching",
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
    home: "صفحهٔ اصلی mitooni",
    how: "راهنمای استفاده",
    what: "آیلتس چیست؟",
    mocks: "آزمون‌های آزمایشی",
    practice: "تمرین",
    coaching: "مربی",
    faq: "پرسش‌های پرتکرار",
    try: "شروع کنید",
    open: "رفتن به برنامه",
    signIn: "ورود",
    menu: "منو",
    close: "بستن منو",
  },
  footer: {
    product: "محصول",
    account: "حساب",
    language: "زبان",
    create: "ساخت حساب",
    rights: "© ۲۰۲۶ mitooni. نسخهٔ نمایشی.",
    disclaimer: "پلتفرم تمرینی مستقل. هیچ ارتباطی با آیلتس، بریتیش کانسل، آی‌دی‌پی یا کمبریج ندارد.",
  },
  home: landingFa,
  what: whatFa,
  faqPage: faqPageFa,
  howTo: howToFa,
  coachPage: coachPageFa,
  auth: authFa,
};
