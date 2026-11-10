// Ported from mockup-sandbox project-alarm/_demo/model.ts (source of truth). Local copy.
export const STORAGE_KEY = 'momo-local-ritual-v1';
export const DEMO_NOW = '07:42';
export const tones = ['birds', 'piano', 'chimes'] as const;
export const avatars = ['scarf', 'flower', 'glasses'] as const;
export type Language = 'zh' | 'en';
export type Tone = (typeof tones)[number];
export type AvatarKind = (typeof avatars)[number];
export type Profile = { nickname: string; avatar: AvatarKind };
export type Settings = {
  time: string; days: number[]; duration: number; voice: 'Jenny' | 'Ailun' | '';
  volume: number; allowed: boolean; tone: Tone;
};
export type State = {
  version: 1; settings: Settings; profile: Profile; language: Language; saved: boolean; points: number; food: number;
  rewarded: boolean; status: 'waiting' | 'ready' | 'completed' | 'skipped';
  fed: boolean; contributor: '' | 'Peter'; pending: boolean; offline: boolean;
  active: boolean; progress: number; reminder: boolean;
  nudge: 'idle' | 'review' | 'delivered' | 'played'; recordSeconds: number;
};
export type Action =
  | { type: 'PROFILE'; profile: Profile } | { type: 'LANGUAGE'; value: Language } | { type: 'TONE'; value: Tone }
  | { type: 'SAVE'; settings: Settings } | { type: 'VOLUME'; value: number }
  | { type: 'ALLOW'; value: boolean } | { type: 'START' } | { type: 'TICK'; gain: boolean }
  | { type: 'STOP' } | { type: 'BUY' } | { type: 'FEED' } | { type: 'SYNC' }
  | { type: 'OFFLINE'; value: boolean } | { type: 'REMINDER'; value: boolean }
  | { type: 'RECORD'; seconds: number } | { type: 'SEND' } | { type: 'PLAY' }
  | { type: 'RETAKE' } | { type: 'RESET' } | { type: 'HYDRATE'; state: State };

export function initialState(): State {
  return {
    version: 1, profile: { nickname: 'Peter', avatar: 'scarf' }, language: 'zh',
    settings: { time: '08:00', days: [0, 1, 2, 3, 4], duration: 30, voice: '', volume: 80, allowed: true, tone: 'birds' },
    saved: false, points: 20, food: 0, rewarded: false, status: 'waiting', fed: false, contributor: '', pending: false,
    offline: false, active: false, progress: 0, reminder: false, nudge: 'idle', recordSeconds: 0,
  };
}
export function validProfile(p: unknown): p is Profile {
  if (!p || typeof p !== 'object') return false;
  const v = p as Profile;
  return typeof v.nickname === 'string' && v.nickname === v.nickname.trim() && v.nickname.length > 0 &&
    v.nickname.length <= 16 && avatars.includes(v.avatar);
}
export function validTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t) && Number(t.slice(0, 2)) < 24 && Number(t.slice(3)) < 60;
}
export function validSettings(s: unknown): s is Settings {
  if (!s || typeof s !== 'object') return false;
  const v = s as Settings;
  return typeof v.time === 'string' && validTime(v.time) &&
    Array.isArray(v.days) && v.days.length > 0 && new Set(v.days).size === v.days.length &&
    v.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) &&
    Number.isInteger(v.duration) && v.duration >= 15 && v.duration <= 60 &&
    ['Jenny', 'Ailun', ''].includes(v.voice) && Number.isInteger(v.volume) && v.volume >= 0 && v.volume <= 100 &&
    typeof v.allowed === 'boolean' && tones.includes(v.tone);
}
export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'HYDRATE': return a.state;
    case 'PROFILE': return validProfile(a.profile) ? { ...s, profile: { ...a.profile } } : s;
    case 'LANGUAGE': return a.value === 'zh' || a.value === 'en' ? { ...s, language: a.value } : s;
    case 'TONE': return tones.includes(a.value) ? { ...s, settings: { ...s.settings, tone: a.value } } : s;
    case 'RESET': return initialState();
    case 'SAVE': return validSettings(a.settings)
      ? { ...s, settings: { ...a.settings, days: [...a.settings.days] }, saved: true, active: false, progress: 0, status: s.rewarded ? 'completed' : 'ready' }
      : s;
    case 'VOLUME': return Number.isFinite(a.value) ? { ...s, settings: { ...s.settings, volume: Math.max(0, Math.min(100, Math.round(a.value))) } } : s;
    case 'ALLOW': return { ...s, settings: { ...s.settings, allowed: a.value } };
    case 'START': return s.saved ? { ...s, active: true, progress: 0, status: 'ready', reminder: false } : s;
    case 'TICK': {
      if (!s.active) return s;
      const progress = Math.max(0, Math.min(s.settings.duration, s.progress + (a.gain ? 1 : -1)));
      if (progress < s.settings.duration) return { ...s, progress };
      return { ...s, progress, active: false, status: 'completed', rewarded: true, points: s.points + (s.rewarded ? 0 : 10), reminder: false };
    }
    case 'STOP': return { ...s, active: false, progress: 0, status: s.rewarded ? 'completed' : 'skipped', reminder: false };
    case 'BUY': return s.points < 10 ? s : { ...s, points: s.points - 10, food: s.food + 1 };
    case 'FEED':
      if (s.fed || s.pending || s.food < 1) return s;
      return s.offline ? { ...s, pending: true } : { ...s, food: s.food - 1, fed: true, contributor: 'Peter' };
    case 'SYNC':
      if (!s.pending || s.fed || s.food < 1) return s;
      return { ...s, offline: false, pending: false, food: s.food - 1, fed: true, contributor: 'Peter' };
    case 'OFFLINE': return { ...s, offline: a.value };
    case 'REMINDER': return { ...s, reminder: a.value };
    case 'RECORD': return s.nudge === 'idle' && a.seconds > 0 ? { ...s, nudge: 'review', recordSeconds: Math.min(8, Math.floor(a.seconds)) } : s;
    case 'SEND': return s.nudge === 'review' ? { ...s, nudge: 'delivered' } : s;
    case 'PLAY': return s.nudge === 'delivered' ? { ...s, nudge: 'played' } : s;
    case 'RETAKE': return { ...s, nudge: 'idle', recordSeconds: 0 };
    default: return s;
  }
}
const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
export function restore(raw: string): State | null {
  try {
    const v = JSON.parse(raw) as State;
    if (!v || typeof v !== 'object' || !v.settings || typeof v.settings !== 'object') return null;
    if (!has(v.settings, 'tone')) v.settings.tone = 'birds';
    if (!has(v, 'profile')) v.profile = initialState().profile;
    if (!has(v, 'language')) v.language = 'zh';
    const bools = ['saved', 'rewarded', 'fed', 'pending', 'offline', 'active', 'reminder'] as const;
    if (v.version !== 1 || !validSettings(v.settings) || !validProfile(v.profile) || !['zh', 'en'].includes(v.language) ||
      !bools.every(k => typeof v[k] === 'boolean') ||
      ![v.points, v.food, v.progress, v.recordSeconds].every(n => Number.isSafeInteger(n) && n >= 0) ||
      v.points > 30 || v.food > 3 || v.progress > v.settings.duration || v.recordSeconds > 8 ||
      !['waiting', 'ready', 'completed', 'skipped'].includes(v.status) ||
      !['idle', 'review', 'delivered', 'played'].includes(v.nudge) ||
      (v.contributor !== '' && v.contributor !== 'Peter') || v.fed !== (v.contributor === 'Peter') ||
      (v.pending && (v.fed || v.food < 1)) || (v.status === 'completed' && !v.rewarded) ||
      (v.active && !v.saved) || v.points + v.food * 10 + (v.fed ? 10 : 0) !== 20 + (v.rewarded ? 10 : 0)) return null;
    return v.active ? { ...v, active: false, progress: 0, reminder: false, status: v.rewarded ? 'completed' : 'skipped' } : v;
  } catch { return null; }
}
export function personalStatus(s: State): '已完成' | '已跳过' | '尚未到点' | '超时未完成' | '待挑战' {
  if (s.status === 'completed') return '已完成';
  if (s.status === 'skipped') return '已跳过';
  if (!s.saved || s.settings.time > DEMO_NOW) return '尚未到点';
  return s.settings.time < '07:12' ? '超时未完成' : '待挑战';
}
export const toneKey: Record<Tone, string> = { birds: '晨间鸟鸣', piano: '轻柔钢琴', chimes: '清晨风铃' };
export const avatarKey: Record<AvatarKind, string> = { scarf: '围巾', flower: '小花', glasses: '眼镜' };
