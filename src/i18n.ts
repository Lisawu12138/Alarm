import { useEffect, useState } from 'react';

export type Lang = 'en' | 'zh';
const KEY = 'pa_lang';

let lang: Lang = (() => {
  try { const s = localStorage.getItem(KEY); if (s === 'zh' || s === 'en') return s; } catch { /* */ }
  return 'en'; // English by default
})();
const listeners = new Set<() => void>();
if (typeof document !== 'undefined') document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

export const getLang = () => lang;

export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* */ }
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
  listeners.forEach((f) => f());
}

/** t('中文', 'English') */
export const t = (zh: string, en: string) => (lang === 'zh' ? zh : en);

/** re-render on language change */
export function useLang() {
  const [, force] = useState(0);
  useEffect(() => { const cb = () => force((x) => x + 1); listeners.add(cb); return () => { listeners.delete(cb); }; }, []);
  return lang;
}

/** English plural helper: n('1 day' / '3 days') */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
