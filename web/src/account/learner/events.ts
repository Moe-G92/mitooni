const preferenceListeners = new Set<() => void>();
export function preferencesChanged() { preferenceListeners.forEach((listener) => listener()); }
export function subscribePreferences(listener: () => void) { preferenceListeners.add(listener); return () => { preferenceListeners.delete(listener); }; }
