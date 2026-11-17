import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { Avatar, BackHeader, Icon, Seg, Wave } from '../components/ui';
import { Recorder, audio } from '../lib/audio';
import { dayLabel, fmtClock, minutesSince, nextAlarm } from '../lib/time';
import { memberState } from './Group';

const MAX_MS = 30000;

export function RecordVoice({ to, initialKind }: { to: string; initialKind?: 'morning' | 'favorite' }) {
  const { api, data, back, toast, reloadVoices } = useApp();
  const who = data.members.find((m) => m.id === to)!;
  const theirNext = nextAlarm(data.alarms.filter((a) => a.user_id === to), who.timezone);
  const [kind, setKind] = useState<'morning' | 'favorite'>(initialKind || (theirNext ? 'morning' : 'favorite'));
  const [state, setState] = useState<'idle' | 'rec' | 'done'>('idle');
  const [ms, setMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; ms: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rec = useRef<Recorder | null>(null);
  const timer = useRef<number>();

  useEffect(() => () => { rec.current?.cancel(); clearInterval(timer.current); audio.stopAll(); }, []);

  const start = async () => {
    try {
      await audio.unlock();
      rec.current = new Recorder();
      await rec.current.start(setLevel);
      setState('rec'); setMs(0); setClip(null);
      const t0 = Date.now();
      timer.current = window.setInterval(() => { const e = Date.now() - t0; setMs(e); if (e >= MAX_MS) stop(); }, 100);
    } catch { toast('需要麦克风权限才能录音'); }
  };
  const stop = async () => {
    clearInterval(timer.current);
    if (!rec.current) return;
    const r = await rec.current.stop(); rec.current = null;
    setClip(r); setMs(r.ms); setState('done'); setLevel(0);
  };
  const preview = async () => {
    if (!clip) return;
    if (playing) { audio.stopVoice(); setPlaying(false); return; }
    try { setPlaying(true); const b = await audio.decode(await clip.blob.arrayBuffer()); await audio.playBuffer(b); } catch { toast('这段录音播放不了，重录一下试试'); }
    setPlaying(false);
  };
  const send = async () => {
    if (!clip) return;
    setBusy(true);
    try {
      await api.sendVoice(clip.blob, to, kind, kind === 'morning' && theirNext ? new Date(theirNext).toISOString() : null, clip.ms);
      await reloadVoices();
      toast(kind === 'morning' ? `已发送，${who.nickname}明早会听到` : `已发送，${who.nickname}可以把它设为常用起床音效`);
      back();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };
  const sec = (x: number) => `0:${String(Math.floor(x / 1000)).padStart(2, '0')}`;
  const morningOff = kind === 'morning' && !theirNext;

  return (
    <div className="screen" style={{ paddingBottom: 28 }}>
      <BackHeader title={`给${who.nickname}录一段`} onBack={back} />
      <Seg value={kind} options={[['morning', '明早语音'], ['favorite', '常用音效']]} onChange={setKind} />
      <div className="card row" style={{ padding: '14px 16px', gap: 12 }}>
        <Avatar ch={who.avatar_char} color={who.avatar_color} size={44} />
        <div className="grow col" style={{ gap: 2 }}>
          <span style={{ fontWeight: 700 }}>{who.nickname}</span>
          <span className="row" style={{ gap: 5, fontSize: 13, color: morningOff ? 'var(--muted)' : 'var(--green)' }}>
            <Icon name={kind === 'morning' ? 'alarm' : 'heart'} size={14} />
            {kind === 'morning' ? (theirNext ? `${dayLabel(theirNext, who.timezone).split(' ')[0]} ${fmtClock(theirNext, who.timezone)} 响铃，只播这一次` : 'TA 接下来没有闹钟 · 未排程') : '可以反复用，TA 选它当常用起床声'}
          </span>
        </div>
      </div>

      <div className="soft col" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: '28px 16px', position: 'relative', overflow: 'hidden', minHeight: 300, opacity: morningOff ? 0.5 : 1 }}>
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'var(--mint)', opacity: 0.6, left: -80, top: -90 }} />
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'var(--peach)', opacity: 0.45, right: -60, bottom: -60 }} />
        <div className="serif" style={{ position: 'relative', fontSize: 64, fontStyle: 'italic', fontWeight: 300, color: 'var(--deep)', lineHeight: 1 }}>{sec(ms)}</div>
        <div className="cap" style={{ position: 'relative' }}>{state === 'rec' ? '录音中 · 再点一下停止' : '最长 0:30'}</div>
        <div style={{ position: 'relative', height: 44 }}><Wave bars={26} height={40} color={state === 'rec' ? 'var(--orange)' : 'var(--green)'} level={state === 'rec' ? level : state === 'done' ? undefined : 0.05} seed={state === 'done' ? 3 : 1 + Math.floor(ms / 150)} /></div>
        <div className="row" style={{ gap: 32, position: 'relative', marginTop: 8 }}>
          <RoundBtn icon="redo" label="重录" size={56} disabled={state !== 'done'} onClick={() => { setClip(null); setState('idle'); setMs(0); }} />
          {state === 'rec' ? (
            <RoundBtn icon="pause" label="停止" size={76} bg="var(--orange)" color="var(--deep)" onClick={stop} pulse />
          ) : state === 'done' ? (
            <RoundBtn icon={playing ? 'pause' : 'play'} label="试听" size={76} bg="var(--deep)" color="var(--paper)" onClick={preview} />
          ) : (
            <RoundBtn icon="mic" label="录音" size={76} bg="var(--deep)" color="var(--paper)" disabled={morningOff} onClick={start} />
          )}
          <div style={{ width: 56 }} />
        </div>
      </div>
      <button className="btn primary" disabled={!clip || busy || morningOff} onClick={send}><Icon name="send" size={18} />发送给{who.nickname}</button>
    </div>
  );
}

function RoundBtn({ icon, label, size, bg = 'var(--white)', color = 'var(--ink)', onClick, disabled, pulse }: { icon: string; label: string; size: number; bg?: string; color?: string; onClick: () => void; disabled?: boolean; pulse?: boolean }) {
  return (
    <div className="col" style={{ alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1 }}>
      <button className={`center ${pulse ? 'pulse' : ''}`} disabled={disabled} onClick={onClick} style={{ width: size, height: size, borderRadius: 999, background: bg, border: bg === 'var(--white)' ? '1px solid var(--line)' : 0 }}>
        <Icon name={icon} size={size * 0.4} color={color} />
      </button>
      <span className="cap" style={{ fontWeight: 500 }}>{label}</span>
    </div>
  );
}

export function LiveWake({ to }: { to: string }) {
  const { api, data, board, back, toast } = useApp();
  const who = data.members.find((m) => m.id === to)!;
  const bm = board?.members.find((m) => m.user_id === to);
  const st = bm ? memberState(bm) : null;
  const finished = st && (st.kind === 'done' || st.kind === 'skipped');
  const [phase, setPhase] = useState<'idle' | 'rec' | 'sending' | 'sent'>('idle');
  const [level, setLevel] = useState(0);
  const rec = useRef<Recorder | null>(null);
  const t0 = useRef(0);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 200); return () => { clearInterval(t); rec.current?.cancel(); }; }, []);

  const down = async (e: React.PointerEvent) => {
    e.preventDefault();
    if (finished || phase === 'rec' || phase === 'sending') return;
    try {
      rec.current = new Recorder(); t0.current = Date.now();
      setPhase('rec');
      await rec.current.start(setLevel);
    } catch { setPhase('idle'); toast('需要麦克风权限'); }
  };
  const up = async () => {
    if (!rec.current) return;
    const r = await rec.current.stop(); rec.current = null; setLevel(0);
    if (r.ms < 600) { setPhase('idle'); toast('按住久一点再松开'); return; }
    setPhase('sending');
    try { await api.sendVoice(r.blob, to, 'live', bm?.scheduled_at || null, r.ms); setPhase('sent'); }
    catch (err) { toast((err as Error).message); setPhase('idle'); }
  };

  const status = finished ? `${who.nickname}已经起来了` : phase === 'rec' ? '正在传声… 松开结束' : phase === 'sending' ? '发送中…' : phase === 'sent' ? (who.allow_live_autoplay ? `已送到，${who.nickname}那边会直接播放` : `已送到，等${who.nickname}接听`) : `按住说话，松开就发给${who.nickname}`;
  const mins = bm?.scheduled_at ? minutesSince(bm.scheduled_at) : 0;

  return (
    <div className="screen night" style={{ alignItems: 'center', gap: 16, paddingBottom: 40 }}>
      <div className="row" style={{ width: '100%' }}>
        <span className="row grow" style={{ gap: 6, fontSize: 13, color: 'var(--darkMuted)' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--orange)' }} />{who.nickname}已响铃 {Math.max(0, mins)} 分钟</span>
        <button className="icon-btn" onClick={back}><Icon name="x" size={16} color="var(--darkMuted)" /></button>
      </div>
      <div style={{ position: 'relative', width: 280, height: 280, marginTop: 10 }}>
        {[[280, 0.1], [220, 0.18], [164, 0.3]].map(([d, o], i) => (
          <div key={i} className={phase === 'rec' ? 'pulse' : ''} style={{ position: 'absolute', left: (280 - d) / 2, top: (280 - d) / 2, width: d, height: d, borderRadius: '50%', background: 'var(--orange)', opacity: o, animationDelay: `${i * 0.2}s` }} />
        ))}
        <div style={{ position: 'absolute', left: 80, top: 80 }}><Avatar ch={who.avatar_char} color={who.avatar_color} size={120} /></div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{status}</div>
      <div style={{ height: 46 }}><Wave bars={24} height={44} color="var(--orange)" level={phase === 'rec' ? level : 0.08} seed={1 + Math.floor(Date.now() / 160) % 50} /></div>
      <div className="spacer" />
      <button disabled={!!finished} onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}
        style={{ position: 'relative', width: 150, height: 150, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', opacity: finished ? 0.4 : 1 }}>
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--orange)', opacity: phase === 'rec' ? 0.35 : 0.2, transform: phase === 'rec' ? 'scale(1.08)' : undefined, transition: 'transform .15s' }} />
        <span className="center" style={{ position: 'absolute', inset: 19, borderRadius: '50%', background: 'var(--orange)' }}><Icon name="mic" size={40} color="var(--deep)" /></span>
      </button>
      <div className="cap" style={{ color: 'var(--darkMuted)' }}>{phase === 'rec' ? '松开结束' : '按住说话'}</div>
    </div>
  );
}
