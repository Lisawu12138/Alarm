// In-memory demo backend: open the app with ?demo (or ?demo=fresh to start from sign-up).
import type { Api, AppData } from './api';
import type { AlarmDay, Board, Feeding, Group, Pet, Profile, Voice } from './types';
import { alarmInstants, localTz, zonedParts } from './lib/time';

export function createDemoApi(): Api {
  const fresh = new URLSearchParams(location.search).get('demo') === 'fresh';
  const tz = localTz();
  const P = (id: string, nickname: string, ch: string, color: Profile['avatar_color']): Profile => ({
    id, nickname, avatar_char: ch, avatar_color: color, timezone: tz, volume: 70, challenge_seconds: 30, allow_live_autoplay: true, favorite_voice_id: null,
  });
  let uid: string | null = fresh ? null : 'me';
  const profiles: Profile[] = [P('me', '小满', '满', 'sun'), P('u2', '栗子', '栗', 'peach'), P('u3', '阿鹿', '鹿', 'mint'), P('u4', '周周', '周', 'darkMuted')];
  let group: Group | null = fresh ? null : { id: 'g1', name: '早八互助会', invite_code: 'MORN26', timezone: tz, food_stock: 2, created_by: 'me' };
  let memberIds = fresh ? ['me'] : ['me', 'u2', 'u3', 'u4'];
  let pet: Pet | null = fresh ? null : { id: 'p1', group_id: 'g1', species: 'frog', name: '豆豆', color: 'mint', accessory: 'leaf', fed_days: 9, hunger_days: 0, status: 'active', adopted_at: new Date(Date.now() - 12 * 864e5).toISOString(), left_at: null };
  const now = Date.now();
  const z = zonedParts(now, tz);
  const soon = new Date(now + 3 * 60000); const sz = zonedParts(soon.getTime(), tz);
  const t = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  const alarms: AlarmDay[] = [];
  for (let w = 0; w < 7; w++) {
    alarms.push({ user_id: 'me', weekday: w, alarm_time: w === 0 || w === 6 ? null : t(7, 30), enabled: true });
    alarms.push({ user_id: 'u2', weekday: w, alarm_time: t(6, 45), enabled: true });
    alarms.push({ user_id: 'u3', weekday: w, alarm_time: t(Math.max(0, z.h - 1), z.mi), enabled: true });
    alarms.push({ user_id: 'u4', weekday: w, alarm_time: null, enabled: true });
  }
  // demo: make my alarm ring 3 minutes from now today
  const mine = alarms.find((a) => a.user_id === 'me' && a.weekday === sz.wd)!; mine.alarm_time = t(sz.h, sz.mi);
  const events: Record<string, { status: 'ringing' | 'done' | 'skipped'; started_at: string; completed_at: string | null; shake: number | null }> = {
    u2: { status: 'done', started_at: new Date(now - 3 * 36e5).toISOString(), completed_at: new Date(now - 3 * 36e5 + 40e3).toISOString(), shake: 30 },
    u3: { status: 'ringing', started_at: new Date(now - 62 * 60000).toISOString(), completed_at: null, shake: null },
  };
  const feedings: Feeding[] = [
    { id: 'f1', user_id: 'u2', group_day: '', fed_at: new Date(now - 864e5).toISOString() },
    { id: 'f2', user_id: 'me', group_day: '', fed_at: new Date(now - 2 * 864e5).toISOString() },
  ];
  let fedToday: Board['fed_today'] = null;
  let rewardToday = false;
  const voices: Voice[] = [
    { id: 'v1', group_id: 'g1', from_user: 'u2', to_user: 'me', kind: 'morning', storage_path: 'demo', duration_ms: 7000, for_alarm_at: null, selected: false, used_at: null, created_at: new Date(now - 8 * 36e5).toISOString() },
    { id: 'v2', group_id: 'g1', from_user: 'u3', to_user: 'me', kind: 'morning', storage_path: 'demo', duration_ms: 5000, for_alarm_at: null, selected: false, used_at: null, created_at: new Date(now - 9 * 36e5).toISOString() },
    { id: 'v3', group_id: 'g1', from_user: 'u3', to_user: 'me', kind: 'favorite', storage_path: 'demo', duration_ms: 4000, for_alarm_at: null, selected: false, used_at: null, created_at: new Date(now - 5 * 864e5).toISOString() },
  ];
  const myNext = () => alarmInstants(alarms.filter((a) => a.user_id === 'me'), tz).find((x) => x > Date.now() - 60 * 60000);
  voices.forEach((v) => { if (v.kind === 'morning') v.for_alarm_at = new Date(myNext() ?? now).toISOString(); });
  const listeners = new Set<(t: string, r: Record<string, unknown>) => void>();
  const emit = (table: string) => listeners.forEach((l) => l(table, {}));
  const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
  const authCbs = new Set<(id: string | null) => void>();

  function participants() {
    const out: { id: string; at: number }[] = [];
    for (const id of memberIds) {
      const ins = alarmInstants(alarms.filter((a) => a.user_id === id), tz);
      const today = zonedParts(Date.now(), tz);
      const at = ins.find((x) => { const p = zonedParts(x, tz); return p.y === today.y && p.m === today.m && p.d === today.d; });
      if (at) out.push({ id, at });
    }
    return out;
  }

  const api: Api = {
    demo: true,
    getUserId: async () => uid,
    onAuthChange(cb) { authCbs.add(cb); return () => authCbs.delete(cb); },
    async signUp(_e, _p, nickname) { uid = 'me'; profiles[0].nickname = nickname; profiles[0].avatar_char = nickname.slice(0, 1); authCbs.forEach((c) => c(uid)); return { needsConfirm: false }; },
    async signIn() { uid = 'me'; authCbs.forEach((c) => c(uid)); },
    async signOut() { uid = null; authCbs.forEach((c) => c(null)); },
    async load(): Promise<AppData> {
      return delay({ profile: profiles[0], group, members: profiles.filter((p) => memberIds.includes(p.id)), pet, lastPet: pet, alarms: alarms.filter((a) => memberIds.includes(a.user_id)) });
    },
    async dayBoard() {
      if (!group) return null;
      const parts = participants();
      return delay({
        group_day: '',
        members: memberIds.map((id) => {
          const p = profiles.find((x) => x.id === id)!; const pa = parts.find((x) => x.id === id); const ev = events[id];
          return { user_id: id, nickname: p.nickname, avatar_char: p.avatar_char, avatar_color: p.avatar_color, timezone: p.timezone, scheduled_at: pa ? new Date(pa.at).toISOString() : null, status: pa && ev ? ev.status : null, started_at: ev?.started_at ?? null, completed_at: ev?.completed_at ?? null, shake_seconds: ev?.shake ?? null };
        }),
        reward_today: rewardToday, fed_today: fedToday,
      } as Board);
    },
    async createGroup(name, gtz) { group = { id: 'g1', name, invite_code: 'MORN26', timezone: gtz, food_stock: 0, created_by: 'me' }; await delay(0); },
    async previewGroup(code) { return delay(code.toUpperCase() === 'MORN26' ? { id: 'g1', name: '早八互助会', timezone: tz, members: profiles.slice(1).map((p) => ({ nickname: p.nickname, avatar_char: p.avatar_char, avatar_color: p.avatar_color })), pet: null } : null); },
    async joinGroup() { group = { id: 'g1', name: '早八互助会', invite_code: 'MORN26', timezone: tz, food_stock: 1, created_by: 'u2' }; memberIds = ['u2', 'u3', 'u4', 'me']; await delay(0); },
    async leaveGroup() { group = null; memberIds = ['me']; pet = null; },
    async updateGroup(p) { if (group) Object.assign(group, p); emit('groups'); },
    async adoptPet(species, name, color, accessory) { pet = { id: 'p1', group_id: 'g1', species, name, color, accessory, fed_days: 0, hunger_days: 0, status: 'active', adopted_at: new Date().toISOString(), left_at: null }; await delay(0); },
    async updatePet(p) { if (pet) Object.assign(pet, p); },
    async updateProfile(p) { Object.assign(profiles[0], p); },
    async saveAlarmDays(days) { for (const d of days) { const a = alarms.find((x) => x.user_id === 'me' && x.weekday === d.weekday); if (a) Object.assign(a, d); else alarms.push({ ...d, user_id: 'me' }); } },
    async startWake() { events.me = { status: 'ringing', started_at: new Date().toISOString(), completed_at: null, shake: null }; emit('wake_events'); },
    async finishWake(_at, status, shake) {
      events.me = { status, started_at: events.me?.started_at || new Date().toISOString(), completed_at: new Date().toISOString(), shake: shake ?? null };
      if (status === 'done') { events.u3 = { ...events.u3, status: 'done', completed_at: new Date().toISOString() }; }
      const parts = participants(); const done = parts.filter((p) => events[p.id]?.status === 'done').length;
      let granted = false;
      if (done === parts.length && !rewardToday) { rewardToday = true; granted = true; if (group) group.food_stock += 1; }
      emit('wake_events');
      return { group_day: '', done, total: parts.length, reward_granted: granted, reward_today: rewardToday, food_stock: group?.food_stock ?? 0 };
    },
    async feedPet() {
      if (!group || !pet) throw new Error('还没有伙伴');
      if (fedToday) throw new Error('今天已经有人喂过了');
      if (group.food_stock <= 0) throw new Error('库存没有食物了');
      group.food_stock -= 1; pet.fed_days += 1; pet.hunger_days = 0; fedToday = { user_id: 'me', fed_at: new Date().toISOString() };
      feedings.unshift({ id: 'f' + Date.now(), user_id: 'me', group_day: '', fed_at: fedToday.fed_at }); emit('feedings');
    },
    async feedings() { return delay(feedings.slice()); },
    async voices() { return delay(voices.slice()); },
    async sendVoice(_b, to, kind, forAlarmAt, ms) { voices.unshift({ id: 'v' + Date.now(), group_id: 'g1', from_user: 'me', to_user: to, kind, storage_path: 'demo', duration_ms: ms, for_alarm_at: forAlarmAt, selected: false, used_at: null, created_at: new Date().toISOString() }); await delay(0); },
    async voiceAudio() { throw new Error('demo'); },
    async updateVoice(id, p) { const v = voices.find((x) => x.id === id); if (v) Object.assign(v, p); },
    async deleteVoice(id) { const i = voices.findIndex((x) => x.id === id); if (i >= 0) voices.splice(i, 1); },
    subscribe(_g, _u, cb) { listeners.add(cb); return () => listeners.delete(cb); },
  };
  return api;
}
