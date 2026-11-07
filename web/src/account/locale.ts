import { createInstance } from "i18next";
import { getPrefs, setPrefs, usePrefs } from "@/lib/prefs";
import messages from "./messages.json";
const i18n = createInstance();
void i18n.init({
  resources: {
    en: { translation: messages.en },
    fa: { translation: messages.fa },
  },
  lng: getPrefs().locale,
  fallbackLng: "en",
  initAsync: false,
  interpolation: { escapeValue: false },
});
export function useT() {
  const { locale } = usePrefs();
  const t = i18n.getFixedT(locale);
  return {
    t,
    locale,
    pick: (v: { en: string; fa: string } | undefined | null) =>
      v?.[locale] ?? "",
  };
}
export function switchLocale(locale: "fa" | "en") {
  setPrefs({ locale });
}
export const words = {
  fa: {
    permission: "این حساب اجازهٔ ویرایش پروفایل ندارد",
    showPassword: "نمایش رمز عبور",
    hidePassword: "پنهان کردن رمز عبور",
    signin: "ورود",
    email: "آدرس ایمیل",
    password: "رمز عبور",
    continue: "ادامه",
    back: "بازگشت",
    name: "نام",
    newAccount: "برای ورود به حساب، اطلاعات دریافت‌شده را وارد کن",
    unavailable: "این سرویس هنوز متصل نیست",
    retry: "تلاش دوباره",
    access: "دسترسی حساب هنوز فعال نیست",
    outage: "اطلاعات حساب بارگذاری نشد",
    logout: "خروج",
    error: "انجام نشد؛ دوباره تلاش کن",
    conflict: "اطلاعات تغییر کرده؛ ابتدا نسخهٔ ذخیره‌شده را بررسی کن",
    reload: "کنار گذاشتن تغییرها و بارگذاری نسخهٔ ذخیره‌شده",
    saving: "در حال ذخیره",
    loading: "در حال بارگذاری",
    required: "نام و همهٔ هدف‌ها را انتخاب کن",
    request: "شناسهٔ پیگیری",
    worker: "پیش‌نمایش قبلی هنوز فعال است؛ این برگه را ببند و دوباره باز کن",
    local: "پیش‌نمایش محلی با حساب‌های مصنوعی",
    unconnected: "این بخش هنوز متصل نیست",
    settings: "تنظیمات",
  },
  en: {
    permission: "This account cannot edit a profile",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signin: "Sign in",
    email: "Email address",
    password: "Password",
    continue: "Continue",
    back: "Back",
    name: "Your name",
    newAccount: "Use the credentials provided for your account",
    unavailable: "This service is not connected yet",
    retry: "Retry",
    access: "Your account access is not active",
    outage: "Your account could not load",
    logout: "Sign out",
    error: "That did not work. Please try again",
    conflict: "Your information changed. Review the saved version first",
    reload: "Discard edits and load saved version",
    saving: "Saving",
    loading: "Loading",
    required: "Enter your name and choose every goal",
    request: "Reference",
    worker:
      "The previous preview still controls this tab. Close and reopen this tab",
    local: "Local preview with synthetic accounts",
    unconnected: "This section is not connected yet",
    settings: "Settings",
  },
};
export function useWords() {
  return words[usePrefs().locale];
}
