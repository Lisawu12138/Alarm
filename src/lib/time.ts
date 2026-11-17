import type { AlarmDay } from '../types';

export const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];
// Display order Mon..Sun
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string) {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
    });
    dtfCache.set(tz, f);
  }
  return f;
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export interface ZParts { y: number; m: number; d: number; h: number; mi: number; s: number; wd: number }

export function zonedParts(ts: number, tz: string): ZParts {
  const p: Record<string, string> = {};
  for (const x of dtf(tz).formatToParts(new Date(ts))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, wd: WD[p.weekday] };
}

function tzOffset(ts: number, tz: string) {
  const z = zonedParts(ts, tz);
  return Date.UTC(z.y, z.m - 1, z.d, z.h, z.mi, z.s) - Math.floor(ts / 1000) * 1000;
}

/** Wall-clock time in `tz` -> epoch ms */
export function zonedToUtc(y: number, m: number, d: number, h: number, mi: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let ts = guess - tzOffset(guess, tz);
  const off2 = tzOffset(ts, tz);
  ts = guess - off2;
  return ts;
}

export function addDays(y: number, m: number, d: number, n: number) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

export function parseHM(t: string | null) {
  if (!t) return null;
  const [h, mi] = t.split(':').map(Number);
  return { h, mi };
}

export function hm(t: string | null) {
  const p = parseHM(t);
  return p ? `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}` : '';
}

/** All alarm instants from (local date -1) to +8 days */
export function alarmInstants(days: AlarmDay[], tz: string, now = Date.now()) {
  const today = zonedParts(now, tz);
  const out: number[] = [];
  for (let i = -1; i <= 8; i++) {
    const dd = addDays(today.y, today.m, today.d, i);
    const a = days.find((x) => x.weekday === dd.wd);
    const t = a && a.enabled ? parseHM(a.alarm_time) : null;
    if (!t) continue;
    out.push(zonedToUtc(dd.y, dd.m, dd.d, t.h, t.mi, tz));
  }
  return out.sort((a, b) => a - b);
}

export function nextAlarm(days: AlarmDay[], tz: string, now = Date.now()) {
  return alarmInstants(days, tz, now).find((t) => t > now) ?? null;
}

/** most recent alarm instant within `windowMin` minutes before now */
export function recentAlarm(days: AlarmDay[], tz: string, windowMin = 60, now = Date.now()) {
  const past = alarmInstants(days, tz, now).filter((t) => t <= now && now - t <= windowMin * 60000);
  return past.length ? past[past.length - 1] : null;
}

export function fmtClock(ts: number | string, tz?: string) {
  const z = zonedParts(typeof ts === 'string' ? Date.parse(ts) : ts, tz || localTz());
  return `${String(z.h).padStart(2, '0')}:${String(z.mi).padStart(2, '0')}`;
}

export function fmtUntil(ts: number, now = Date.now()) {
  const mins = Math.max(0, Math.round((ts - now) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `还有 ${m} 分钟`;
  return `还有 ${h} 小时 ${m} 分`;
}

export function dayLabel(ts: number, tz: string, now = Date.now()) {
  const a = zonedParts(ts, tz), b = zonedParts(now, tz);
  const da = Date.UTC(a.y, a.m - 1, a.d), db = Date.UTC(b.y, b.m - 1, b.d);
  const diff = Math.round((da - db) / 86400000);
  const wd = `周${WEEK_CN[a.wd]}`;
  if (diff === 0) return `今天 ${wd}`;
  if (diff === 1) return `明天 ${wd}`;
  if (diff === 2) return `后天 ${wd}`;
  return `${a.m}月${a.d}日 ${wd}`;
}

export function localTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; }
}

export function tzLabel(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date());
    const off = parts.find((p) => p.type === 'timeZoneName')?.value.replace('GMT', 'UTC') || '';
    const city = tz.split('/').pop()!.replace(/_/g, ' ');
    const cn: Record<string, string> = { New_York: '纽约', Los_Angeles: '洛杉矶', Chicago: '芝加哥', Denver: '丹佛', Shanghai: '上海', Tokyo: '东京', London: '伦敦', Paris: '巴黎', Berlin: '柏林', Hong_Kong: '香港', Taipei: '台北', Singapore: '新加坡', Seoul: '首尔', Sydney: '悉尼', Toronto: '多伦多', Vancouver: '温哥华' };
    const key = tz.split('/').pop()!;
    return `${cn[key] || city} · ${off === 'UTC' ? 'UTC±0' : off}`;
  } catch { return tz; }
}

export function allTimezones(): string[] {
  const anyIntl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  try { if (anyIntl.supportedValuesOf) return anyIntl.supportedValuesOf('timeZone'); } catch { /* */ }
  return ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Singapore', 'Australia/Sydney'];
}

export function minutesSince(iso: string | null, now = Date.now()) {
  if (!iso) return 0;
  return Math.floor((now - Date.parse(iso)) / 60000);
}
