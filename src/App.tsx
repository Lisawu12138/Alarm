import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type AppData } from './api';
import { AppCtx, type Ctx, type Route } from './store';
import type { Board, Voice } from './types';
import { TabBar } from './components/ui';
import { AuthScreen } from './screens/Auth';
import { Onboard } from './screens/Onboard';
import { Adopt } from './screens/Adopt';
import { GroupHome } from './screens/Group';
import { AlarmTab, SoundPicker } from './screens/Alarm';
import { PetTab } from './screens/Pet';
import { RecordVoice, LiveWake } from './screens/Voice';
import { Ringing } from './screens/Ringing';
import { Settings } from './screens/Settings';
import { recentAlarm } from './lib/time';
import { t, useLang } from './i18n';
import { audio } from './lib/audio';
import { keepAwake, requestMotionPermission } from './lib/device';

const HANDLED_KEY = 'pa_handled_alarms';
function loadHandled(): string[] { try { return JSON.parse(localStorage.getItem(HANDLED_KEY) || '[]'); } catch { return []; } }
function markHandled(iso: string) { try { const l = loadHandled().filter((x) => Date.now() - Date.parse(x) < 3 * 864e5); l.push(iso); localStorage.setItem(HANDLED_KEY, JSON.stringify(l)); } catch { /* */ } }

export default function App() {
  const lang = useLang();
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [data, setData] = useState<AppData | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [stack, setStack] = useState<Route[]>([{ name: 'tabs' }]);
  const [tab, setTab] = useState<'group' | 'alarm' | 'pet'>('group');
  const [toastMsg, setToast] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [ringing, setRinging] = useState<{ at: string; test?: boolean } | null>(null);
  const [liveIn, setLiveIn] = useState<Voice | null>(null);
  const toastTimer = useRef<number>();

  const toast = useCallback((m: string) => {
    setToast(m); clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    api.getUserId().then(setUid);
    return api.onAuthChange((id) => setUid(id));
  }, []);

  const reload = useCallback(async () => {
    try { setData(await api.load()); } catch (e) { toast((e as Error).message); }
  }, [toast]);
  const reloadBoard = useCallback(async () => { try { setBoard(await api.dayBoard()); } catch { /* */ } }, []);
  const reloadVoices = useCallback(async () => { try { setVoices(await api.voices()); } catch { /* */ } }, []);

  useEffect(() => { if (uid) { reload(); } else { setData(null); } }, [uid, reload]);
  useEffect(() => { if (data?.group) { reloadBoard(); reloadVoices(); } }, [data?.group?.id, reloadBoard, reloadVoices]);
  useEffect(() => { const t = setInterval(() => { if (data?.group) reloadBoard(); }, 60000); return () => clearInterval(t); }, [data?.group, reloadBoard]);

  // realtime
  useEffect(() => {
    if (!data?.group || !uid) return;
    return api.subscribe(data.group.id, uid, (table, row) => {
      if (table === 'voices') {
        reloadVoices();
        if ((row as Partial<Voice>).kind === 'live') setLiveIn(row as unknown as Voice);
      } else if (table === 'pets' || table === 'groups') { reload(); reloadBoard(); }
      else { reloadBoard(); if (table === 'feedings') reload(); }
    });
  }, [data?.group?.id, uid, reload, reloadBoard, reloadVoices]);

  // invite link ?code=XXXX
  useEffect(() => {
    const c = new URLSearchParams(location.search).get('code');
    if (c) sessionStorage.setItem('pa_invite', c.toUpperCase());
  }, []);

  // ---- alarm engine ----
  const myDays = useMemo(() => (data ? data.alarms.filter((a) => a.user_id === uid) : []), [data, uid]);
  const tz = data?.profile.timezone || 'America/New_York';
  const boardRef = useRef(board); boardRef.current = board;

  useEffect(() => {
    if (!data?.group || ringing) return;
    const check = () => {
      const recent = recentAlarm(myDays, tz, 60);
      if (!recent) return;
      const iso = new Date(recent).toISOString();
      if (loadHandled().includes(iso)) return;
      const mine = boardRef.current?.members.find((m) => m.user_id === uid);
      if (mine && (mine.status === 'done' || mine.status === 'skipped') && mine.scheduled_at && Math.abs(Date.parse(mine.scheduled_at) - recent) < 60000) { markHandled(iso); return; }
      setRinging({ at: iso });
    };
    check();
    const t = setInterval(check, 1000);
    return () => clearInterval(t);
  }, [data?.group, myDays, tz, ringing, uid]);

  const arm = useCallback(async (on: boolean) => {
    if (on) {
      await audio.unlock();
      audio.setVolume(data?.profile.volume ?? 70);
      await requestMotionPermission();
      const ok = await keepAwake(true);
      setArmed(true);
      toast(ok ? t('待命中：保持这个页面打开、屏幕常亮，插上电', 'Standing by: keep this page open, screen on, phone plugged in') : t('待命中：请把自动锁屏关掉，保持页面打开', 'Standing by: turn off auto-lock and keep this page open'));
    } else { await keepAwake(false); setArmed(false); }
  }, [data?.profile.volume, toast]);

  const ctx: Ctx | null = data && uid ? {
    api, uid, data, board, voices, reload, reloadBoard, reloadVoices, toast,
    go: (r) => setStack((s) => [...s, r]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    tab, setTab,
    member: (id) => data.members.find((m) => m.id === id),
    armed, arm,
    testRing: () => { audio.unlock(); setRinging({ at: new Date().toISOString(), test: true }); },
  } : null;

  if (uid === undefined) return <div className="app"><div className="loading">…</div></div>;
  if (!uid) return <div className="app"><AuthScreen /></div>;
  if (!ctx) return <div className="app"><div className="loading">{t('载入中…', 'Loading…')}</div></div>;

  const route = stack[stack.length - 1];
  let body: JSX.Element;
  if (!data!.group) body = <Onboard />;
  else if (!data!.lastPet) body = <Adopt />;
  else if (route.name === 'record') body = <RecordVoice to={route.to} initialKind={route.kind} />;
  else if (route.name === 'live') body = <LiveWake to={route.to} />;
  else if (route.name === 'sounds') body = <SoundPicker />;
  else if (route.name === 'settings') body = <Settings />;
  else body = (
    <>
      {tab === 'group' && <GroupHome />}
      {tab === 'alarm' && <AlarmTab />}
      {tab === 'pet' && <PetTab />}
      <TabBar tab={tab} onTab={setTab} />
    </>
  );

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app" key={lang}>
        {body}
        {ringing && (
          <Ringing at={ringing.at} test={ringing.test} liveIn={liveIn} clearLive={() => setLiveIn(null)}
            onClose={() => { if (!ringing.test) markHandled(ringing.at); setRinging(null); reloadBoard(); reload(); }} />
        )}
        {!ringing && liveIn && (
          <div className="toast" onClick={() => setLiveIn(null)}>{t(`${ctx.member(liveIn.from_user)?.nickname || '朋友'} 给你发了一段实时叫醒`, `${ctx.member(liveIn.from_user)?.nickname || 'A friend'} sent you a live wake-up`)}</div>
        )}
        {toastMsg && <div className="toast" onClick={() => setToast(null)}>{toastMsg}</div>}
      </div>
    </AppCtx.Provider>
  );
}
