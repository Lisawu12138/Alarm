import { createClient, type Session } from '@supabase/supabase-js';
import type { AlarmDay, Board, Feeding, FinishResult, Group, GroupPreview, Pet, Profile, Voice, Species, ColorName } from './types';
import { createDemoApi } from './demo';

export interface AppData {
  profile: Profile;
  group: Group | null;
  members: Profile[];
  pet: Pet | null;
  lastPet: Pet | null;
  alarms: AlarmDay[]; // all members' alarm days
}

export interface Api {
  demo: boolean;
  getUserId(): Promise<string | null>;
  onAuthChange(cb: (uid: string | null) => void): () => void;
  signUp(email: string, password: string, nickname: string, timezone: string): Promise<{ needsConfirm: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  load(): Promise<AppData>;
  dayBoard(): Promise<Board | null>;
  createGroup(name: string, tz: string): Promise<void>;
  previewGroup(code: string): Promise<GroupPreview | null>;
  joinGroup(code: string): Promise<void>;
  leaveGroup(): Promise<void>;
  updateGroup(patch: Partial<Pick<Group, 'name' | 'timezone'>>): Promise<void>;
  adoptPet(species: Species, name: string, color: ColorName, accessory: string): Promise<void>;
  updatePet(patch: Partial<Pick<Pet, 'color' | 'accessory' | 'name'>>): Promise<void>;
  updateProfile(patch: Partial<Profile>): Promise<void>;
  saveAlarmDays(days: Omit<AlarmDay, 'user_id'>[]): Promise<void>;
  startWake(scheduledAt: string): Promise<void>;
  finishWake(scheduledAt: string, status: 'done' | 'skipped', shakeSeconds?: number): Promise<FinishResult>;
  feedPet(): Promise<void>;
  feedings(limit?: number): Promise<Feeding[]>;
  voices(): Promise<Voice[]>; // received + sent
  sendVoice(blob: Blob, to: string, kind: Voice['kind'], forAlarmAt: string | null, durationMs: number): Promise<void>;
  voiceAudio(path: string): Promise<ArrayBuffer>;
  updateVoice(id: string, patch: Partial<Pick<Voice, 'selected' | 'used_at'>>): Promise<void>;
  deleteVoice(id: string): Promise<void>;
  subscribe(groupId: string, uid: string, onChange: (table: string, row: Record<string, unknown>) => void): () => void;
}

function friendly(e: unknown): Error {
  const msg = (e as { message?: string })?.message || String(e);
  const map: Record<string, string> = {
    already_in_group: '你已经在一个小组里了',
    code_not_found: '没有找到这个邀请码',
    already_has_pet: '小组已经有伙伴了',
    already_fed: '今天已经有人喂过了',
    no_food: '库存没有食物了',
    no_group: '还没有加入小组',
    'Invalid login credentials': '邮箱或密码不对',
    'User already registered': '这个邮箱已经注册过，直接登录吧',
  };
  for (const k of Object.keys(map)) if (msg.includes(k)) return new Error(map[k]);
  if (/Password should be/i.test(msg)) return new Error('密码至少 6 位');
  return new Error(msg);
}

function createSupabaseApi(): Api {
  // The publishable key is safe to ship in client code; env vars override it.
  const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://gvpszthflcuukekrkkrj.supabase.co';
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || 'sb_publishable_dMdM7rKM7E8mOJ8F8kAr5w_MnN0QqrL';
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  let session: Session | null = null;
  sb.auth.getSession().then(({ data }) => { session = data.session; });
  sb.auth.onAuthStateChange((_e, s) => { session = s; });
  const uid = async () => {
    if (session) return session.user.id;
    const { data } = await sb.auth.getSession();
    session = data.session;
    return session?.user.id ?? null;
  };
  const must = <T,>(r: { data: T; error: unknown }) => { if (r.error) throw friendly(r.error); return r.data; };

  return {
    demo: false,
    getUserId: uid,
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s?.user.id ?? null));
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password, nickname, timezone) {
      const r = await sb.auth.signUp({ email, password, options: { data: { nickname, timezone } } });
      if (r.error) throw friendly(r.error);
      return { needsConfirm: !r.data.session };
    },
    async signIn(email, password) {
      const r = await sb.auth.signInWithPassword({ email, password });
      if (r.error) throw friendly(r.error);
    },
    async signOut() { await sb.auth.signOut(); },
    async load() {
      const id = (await uid())!;
      const profile = must(await sb.from('profiles').select('*').eq('id', id).single()) as Profile;
      const mem = must(await sb.from('group_members').select('group_id').eq('user_id', id).maybeSingle()) as { group_id: string } | null;
      if (!mem) return { profile, group: null, members: [profile], pet: null, lastPet: null, alarms: must(await sb.from('alarm_days').select('*').eq('user_id', id)) as AlarmDay[] };
      const [g, ms, pets, al] = await Promise.all([
        sb.from('groups').select('*').eq('id', mem.group_id).single(),
        sb.from('group_members').select('user_id, joined_at, profiles(*)').eq('group_id', mem.group_id).order('joined_at'),
        sb.from('pets').select('*').eq('group_id', mem.group_id).order('adopted_at', { ascending: false }).limit(1),
        sb.from('alarm_days').select('*'),
      ]);
      const members = (must(ms) as unknown as { profiles: Profile }[]).map((x) => x.profiles);
      const petRows = must(pets) as Pet[];
      const latest = petRows[0] || null;
      return {
        profile, group: must(g) as Group, members,
        pet: latest && latest.status === 'active' ? latest : null,
        lastPet: latest, alarms: must(al) as AlarmDay[],
      };
    },
    async dayBoard() { return must(await sb.rpc('day_board')) as Board | null; },
    async createGroup(name, tz) { must(await sb.rpc('create_group', { p_name: name, p_timezone: tz })); },
    async previewGroup(code) { return must(await sb.rpc('preview_group', { p_code: code })) as GroupPreview | null; },
    async joinGroup(code) { must(await sb.rpc('join_group', { p_code: code })); },
    async leaveGroup() { must(await sb.rpc('leave_group')); },
    async updateGroup(patch) {
      const id = must(await sb.rpc('my_group_id')) as string;
      must(await sb.from('groups').update(patch).eq('id', id));
    },
    async adoptPet(species, name, color, accessory) {
      must(await sb.rpc('adopt_pet', { p_species: species, p_name: name, p_color: color, p_accessory: accessory }));
    },
    async updatePet(patch) {
      const gid = must(await sb.rpc('my_group_id')) as string;
      must(await sb.from('pets').update(patch).eq('group_id', gid).eq('status', 'active'));
    },
    async updateProfile(patch) {
      const id = (await uid())!;
      const { id: _drop, ...rest } = patch as Profile;
      must(await sb.from('profiles').update(rest).eq('id', id));
    },
    async saveAlarmDays(days) {
      const id = (await uid())!;
      must(await sb.from('alarm_days').upsert(days.map((d) => ({ ...d, user_id: id }))));
    },
    async startWake(at) { must(await sb.rpc('start_wake', { p_scheduled_at: at })); },
    async finishWake(at, status, shake) {
      return must(await sb.rpc('finish_wake', { p_scheduled_at: at, p_status: status, p_shake_seconds: shake ?? null })) as FinishResult;
    },
    async feedPet() { must(await sb.rpc('feed_pet')); },
    async feedings(limit = 10) {
      return must(await sb.from('feedings').select('id,user_id,group_day,fed_at').order('fed_at', { ascending: false }).limit(limit)) as Feeding[];
    },
    async voices() {
      return must(await sb.from('voices').select('*').order('created_at', { ascending: false }).limit(100)) as Voice[];
    },
    async sendVoice(blob, to, kind, forAlarmAt, durationMs) {
      const id = (await uid())!;
      const gid = must(await sb.rpc('my_group_id')) as string;
      const ext = blob.type.includes('mp4') || blob.type.includes('aac') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const path = `${gid}/${crypto.randomUUID()}.${ext}`;
      const up = await sb.storage.from('voices').upload(path, blob, { contentType: blob.type.split(';')[0] || 'audio/webm' });
      if (up.error) throw friendly(up.error);
      must(await sb.from('voices').insert({ group_id: gid, from_user: id, to_user: to, kind, storage_path: path, for_alarm_at: forAlarmAt, duration_ms: durationMs }));
    },
    async voiceAudio(path) {
      const r = await sb.storage.from('voices').download(path);
      if (r.error) throw friendly(r.error);
      return await r.data.arrayBuffer();
    },
    async updateVoice(id, patch) { must(await sb.from('voices').update(patch).eq('id', id)); },
    async deleteVoice(id) { must(await sb.from('voices').delete().eq('id', id)); },
    subscribe(groupId, userId, onChange) {
      const ch = sb.channel(`group-${groupId}`);
      for (const table of ['wake_events', 'pets', 'feedings']) {
        ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `group_id=eq.${groupId}` }, (p) => onChange(table, (p.new || p.old) as Record<string, unknown>));
      }
      ch.on('postgres_changes', { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, (p) => onChange('groups', p.new as Record<string, unknown>));
      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voices', filter: `to_user=eq.${userId}` }, (p) => onChange('voices', p.new as Record<string, unknown>));
      ch.subscribe();
      return () => { sb.removeChannel(ch); };
    },
  };
}

const isDemo = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
export const api: Api = isDemo ? createDemoApi() : createSupabaseApi();
