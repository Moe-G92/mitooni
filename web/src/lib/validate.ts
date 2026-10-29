export const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** Iranian mobile (09…, +989…, 00989…) or any international number in + form. Persian digits allowed. */
const IR_MOBILE = /^(?:\+98|0098|0)?9\d{9}$/;
export const toLatin = (s: string) => s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export const phoneOk = (s: string) => {
  const v = toLatin(s).replace(/[\s()-]/g, "");
  return IR_MOBILE.test(v) || /^\+\d{8,15}$/.test(v);
};
