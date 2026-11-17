import { t } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { Avatar, Dialog, Icon, PetSprite, ProgressArc, Wave, stageOf } from '../components/ui';
import { audio } from '../lib/audio';
import { listenShake, requestMotionPermission, vibrate } from '../lib/device';
import { fmtClock, mdLabel, wkName, zonedParts } from '../lib/time';
import { morningVoicesFor } from './Alarm';
import type { FinishResult, Voice } from '../types';

type Phase = 'tap' | 'ringing' | 'success';

export function Ringing({ at, test, liveIn, clearLive, onClose }: { at: string; test?: boolean; liveIn: Voice | null; clearLive: () => void; onClose: () => void }) {
  const { api, data, uid, voices, setTab } = useApp();
  const me = data.profile;
  const secs = me.challenge_seconds;
  const [phase, setPhase] = useState<Phase>(audio.unlocked ? 'ringing' : 'tap');
  const [progress, setProgress] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [decaying, setDecaying] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [nowPlaying, setNowPlaying] = useState<Voice | null>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [noMotion, setNoMotion] = useState(false);
  const [pendingLive, setPendingLive] = useState<Voice | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const lastShake = useRef(0);
  const sawMotion = useRef(false);
  const progRef = useRef(0);
  const finished = useRef(false);
  const queueStop = useRef(false);
  const usedIds = useRef<string[]>([]);
  const simHold = useRef(false);
  const atMs = Date.parse(at);

  // start the alarm (after audio unlocked)
  useEffect(() => {
    if (phase !== 'ringing') return;
    audio.setVolume(me.volume);
    audio.setDuck(1);
    if (!test) api.startWake(at).catch(() => {});
    let cancelled = false;
    (async () => {
      const mv = test ? [] : morningVoicesFor(voices, uid, atMs);
      const sel = mv.find((v) => v.selected);
      let queue: Voice[] = sel ? [sel] : shuffle(mv);
      if (!queue.length && me.favorite_voice_id) { const f = voices.find((v) => v.id === me.favorite_voice_id); if (f) queue = [f]; }
      usedIds.current = mv.map((v) => v.id);
      for (const v of queue) {
        if (cancelled || queueStop.current) break;
        try {
          const buf = await audio.decode(await api.voiceAudio(v.storage_path));
          if (cancelled || queueStop.current) break;
          setNowPlaying(v);
          await audio.playBuffer(buf, 1.6);
        } catch { /* skip unplayable voice */ }
      }
      setNowPlaying(null);
      if (!cancelled && !finished.current) audio.startRing();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // shake
  useEffect(() => {
    if (phase !== 'ringing') return;
    const off = listenShake(() => { lastShake.current = Date.now(); }, () => { sawMotion.current = true; });
    const nm = setTimeout(() => { if (!sawMotion.current) setNoMotion(true); }, 2500);
    const t = setInterval(() => {
      const n = Date.now(); setNow(n);
      if (finished.current) return;
      if (simHold.current) lastShake.current = n;
      const since = n - lastShake.current;
      const isShaking = since < 450;
      const isDecay = !isShaking && since > 1500 && progRef.current > 0;
      let p = progRef.current;
      if (isShaking) p += 0.1; else if (isDecay) p = Math.max(0, p - 0.05);
      progRef.current = p; setProgress(p);
      setShaking(isShaking); setDecaying(isDecay);
      audio.setDuck(isShaking ? 0.2 : 1);
      if (p >= secs) complete();
    }, 100);
    return () => { off(); clearInterval(t); clearTimeout(nm); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // incoming live wake
  useEffect(() => {
    if (!liveIn || phase === 'success') return;
    clearLive();
    if (me.allow_live_autoplay && phase === 'ringing') playLive(liveIn); else setPendingLive(liveIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIn]);

  useEffect(() => () => audio.stopAll(), []);

  async function playLive(v: Voice) {
    setPendingLive(null);
    try {
      const buf = await audio.decode(await api.voiceAudio(v.storage_path));
      audio.setDuck(0.15); setNowPlaying(v);
      await audio.playBuffer(buf, 1.8);
    } catch { /* */ }
    setNowPlaying(null);
  }

  async function markUsed() {
    for (const id of usedIds.current) api.updateVoice(id, { used_at: new Date().toISOString() }).catch(() => {});
  }

  async function complete() {
    if (finished.current) return;
    finished.current = true; queueStop.current = true;
    audio.stopAll(); vibrate([80, 60, 80]);
    setPhase('success');
    if (test) { setResult({ group_day: '', done: 0, total: 0, reward_granted: false, reward_today: false, food_stock: data.group?.food_stock ?? 0 }); return; }
    try { setResult(await api.finishWake(at, 'done', secs)); } catch { /* */ }
    markUsed();
  }

  async function skip() {
    finished.current = true; queueStop.current = true;
    audio.stopAll();
    if (!test) { try { await api.finishWake(at, 'skipped'); } catch { /* */ } markUsed(); }
    onClose();
  }

  const z = zonedParts(atMs, me.timezone);
  const remain = Math.max(0, Math.ceil(secs - progress));
  const pet = data.pet;
  const who = nowPlaying ? data.members.find((m) => m.id === nowPlaying.from_user) : null;

  if (phase === 'tap') {
    return (
      <div className="full night center" style={{ flexDirection: 'column', gap: 20, padding: 30 }} onClick={async () => { await audio.unlock(); await requestMotionPermission(); setPhase('ringing'); }}>
        <div className="big-time" style={{ fontSize: 92 }}>{fmtClock(atMs, me.timezone)}</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>{t('闹钟时间到了', 'It\'s time to get up')}</div>
        <div className="btn" style={{ background: 'var(--sun)', color: 'var(--deep)', maxWidth: 260 }}>{t('点一下开始起床挑战', 'Tap to start the wake-up challenge')}</div>
      </div>
    );
  }

  if (phase === 'success') {
    const r = result;
    return (
      <div className="full" style={{ background: 'linear-gradient(180deg, var(--peach) 0%, var(--paper) 55%)', padding: 'calc(20px + var(--safe-t)) 24px calc(28px + var(--safe-b))', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', width: 280, height: 280, marginTop: 10 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--sun)', opacity: 0.85 }} />
          {pet && <div className="bob" style={{ position: 'absolute', left: 0, right: 0, bottom: 40, display: 'flex', justifyContent: 'center' }}><PetSprite species={pet.species} stage={stageOf(pet.fed_days)} height={120} width={200} /></div>}
        </div>
        <div className="serif" style={{ fontSize: 56, fontStyle: 'italic', fontWeight: 300, color: 'var(--deep)', lineHeight: 1 }}>{fmtClock(Date.now(), me.timezone)}</div>
        <div className="sub" style={{ fontWeight: 500 }}>{test ? t('试响结束 · 不计入小组', "Test done · doesn't count for the group") : t(`起床成功 · 摇了 ${secs} 秒`, `You're up · shook for ${secs}s`)}</div>
        {!test && r && (
          <div className="card row" style={{ width: '100%', padding: '12px 16px' }}>
            <span className="grow" style={{ fontWeight: 700, color: 'var(--deep)' }}>{r.total && r.done >= r.total ? t(`全组 ${r.done}/${r.total} 都起来了`, `All ${r.done}/${r.total} are up`) : t(`全组 ${r.done}/${r.total} · 还在等其他人`, `${r.done}/${r.total} up · waiting for the others`)}</span>
            {r.total > 0 && r.done >= r.total && <Icon name="check" color="var(--green)" />}
          </div>
        )}
        {!test && r?.reward_granted && (
          <div className="row" style={{ width: '100%', background: 'var(--deep)', borderRadius: 22, padding: '14px 16px', gap: 12 }}>
            <span className="center" style={{ background: 'var(--sun)', borderRadius: 999, width: 40, height: 40 }}><Icon name="bowl" size={22} color="var(--deep)" /></span>
            <span className="grow"><div style={{ color: 'var(--paper)', fontWeight: 700, fontSize: 17 }}>{t('+1 份共享食物', '+1 shared food')}</div><div className="cap" style={{ color: 'var(--darkMuted)' }}>{t(`已放进小组库存 · 现在 ${r.food_stock} 份`, `Added to the pantry · ${r.food_stock} now`)}</div></span>
          </div>
        )}
        <div className="spacer" />
        {pet && !test && (r?.food_stock ?? 0) > 0 && <button className="btn primary" onClick={() => { setTab('pet'); onClose(); }}>{t(`去喂${pet.name}`, `Feed ${pet.name}`)}</button>}
        <button className="btn secondary" onClick={() => { setTab('group'); onClose(); }}>{t('回到小组', 'Back to group')}</button>
      </div>
    );
  }

  const RS = 230;
  return (
    <div className="full night" style={{ padding: 'calc(16px + var(--safe-t)) 24px 0', alignItems: 'center', gap: 16, overflow: 'hidden' }}>
      <div className="row" style={{ width: '100%' }}>
        <span className="row grow" style={{ gap: 6, fontSize: 13, color: 'var(--darkMuted)', fontWeight: 500 }}><Icon name="alarm" size={16} color="var(--darkMuted)" />
          {test ? t('试响', 'Test ring') : t(`${wkName(z.wd)} ${mdLabel(z.m, z.d)}`, `${wkName(z.wd)}, ${mdLabel(z.m, z.d)}`)}</span>
        <button className="icon-btn" aria-label="stop" onClick={() => setConfirmStop(true)}><Icon name="x" size={16} color="var(--darkMuted)" /></button>
      </div>
      <div className="big-time" style={{ fontSize: 92 }}>{fmtClock(atMs, me.timezone)}</div>

      {pendingLive ? (
        <div className="col" style={{ width: '100%', background: 'var(--orange)', borderRadius: 24, padding: '14px 16px', gap: 10 }}>
          <div className="row" style={{ gap: 12 }}>
            {(() => { const p = data.members.find((m) => m.id === pendingLive.from_user); return p ? <Avatar ch={p.avatar_char} color={p.avatar_color} size={40} ring={2} ringColor="deep" /> : null; })()}
            <span className="grow"><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', letterSpacing: '.08em' }}>● LIVE</div>
              <div style={{ fontWeight: 700, color: 'var(--deep)' }}>{t(`${data.members.find((m) => m.id === pendingLive.from_user)?.nickname || '朋友'}正在叫你起床`, `${data.members.find((m) => m.id === pendingLive.from_user)?.nickname || 'A friend'} is waking you up`)}</div></span>
            <button className="pill" style={{ background: 'var(--deep)', color: 'var(--paper)', fontWeight: 700, padding: '10px 16px' }} onClick={() => playLive(pendingLive)}><Icon name="phone" size={16} />{t('接听', 'Answer')}</button>
          </div>
          <Wave bars={26} height={30} color="rgba(30,61,49,.55)" seed={Math.floor(now / 200) % 40} />
        </div>
      ) : (
        <div className="row" style={{ width: '100%', background: 'var(--darkCard)', borderRadius: 22, padding: '12px 16px 12px 12px', gap: 12 }}>
          {who ? <Avatar ch={who.avatar_char} color={who.avatar_color} size={40} /> : <span className="center" style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--darkLine)' }}><Icon name="sun" size={20} color="var(--sun)" /></span>}
          <div className="grow col" style={{ gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{who ? (nowPlaying?.kind === 'live' ? t(`${who.nickname}的实时叫醒`, `${who.nickname} · live`) : nowPlaying?.kind === 'favorite' ? t(`${who.nickname}的常用音效`, `${who.nickname}'s wake-up sound`) : t(`${who.nickname}的明早语音`, `${who.nickname}'s morning voice`)) : t('晨露', 'Morning Dew')}</span>
            <Wave bars={20} height={22} color="var(--sun)" seed={Math.floor(now / 180) % 40} level={shaking ? 0.2 : 0.9} />
          </div>
        </div>
      )}

      <div style={{ position: 'relative', width: RS, height: RS, flex: 'none' }} className={shaking ? 'shaking' : ''}>
        <svg width={RS + 60} height={RS + 60} style={{ position: 'absolute', left: -30, top: -30, opacity: shaking ? 1 : 0.5 }}>
          {[0, 1].map((k) => { const r = RS / 2 + 16 + k * 12; const c = (RS + 60) / 2; const a = 0.45 - k * 0.06;
            const arc = (a0: number, a1: number) => `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`;
            return <g key={k} stroke="var(--sun)" strokeOpacity={k ? 0.3 : 0.6} strokeWidth={2.5} fill="none" strokeLinecap="round"><path d={arc(-a, a)} /><path d={arc(Math.PI - a, Math.PI + a)} /></g>; })}
        </svg>
        <ProgressArc size={RS} pct={progress / secs} color="var(--sun)" track="var(--darkLine)" />
        <div className="center" style={{ position: 'absolute', inset: 0, flexDirection: 'column' }}>
          <span className="serif" style={{ fontSize: 76, lineHeight: 1 }}>{remain}</span><span className="cap" style={{ color: 'var(--darkMuted)' }}>{t('秒', 'sec')}</span>
        </div>
      </div>
      <div className="row" style={{ gap: 8, color: 'var(--sun)', fontWeight: 700, fontSize: 17 }}><Icon name="vibrate" size={20} color="var(--sun)" />{t('摇一摇', 'Shake!')}</div>
      <span className="pill" style={{ background: 'var(--darkCard)', color: 'var(--darkMuted)', fontSize: 12 }}>
        <Icon name="volume" size={14} color="var(--darkMuted)" />{shaking ? t('有效摇动 · 铃声已调低', 'Good shaking · ring turned down') : decaying ? t('停摇了，进度在回退', 'You stopped — progress is slipping') : t('摇动手机，摇满就关掉闹钟', 'Shake your phone to turn the alarm off')}</span>
      {noMotion && (
        <button className="pill" style={{ background: 'var(--darkLine)', color: 'var(--paper)', padding: '10px 16px', touchAction: 'none', userSelect: 'none' }}
          onPointerDown={() => { simHold.current = true; }} onPointerUp={() => { simHold.current = false; }} onPointerLeave={() => { simHold.current = false; }}>
          {t('这台设备没有运动传感器 · 按住模拟摇动', 'No motion sensor here · hold to simulate shaking')}</button>
      )}
      <div className="spacer" />
      <div style={{ position: 'relative', width: '100%', height: 130, flex: 'none' }}>
        <div style={{ position: 'absolute', left: -90, right: -90, top: 50, height: 200, borderRadius: '50%', background: 'var(--darkCard)' }} />
        {pet && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center' }}><PetSprite species={pet.species} stage={stageOf(pet.fed_days)} height={80} width={120} /></div>}
      </div>

      {confirmStop && (
        <Dialog onClose={() => setConfirmStop(false)}>
          <div className="h2" style={{ fontSize: 20 }}>{t('停止并跳过这次闹钟？', 'Stop and skip this alarm?')}</div>
          <div className="sub" style={{ lineHeight: 1.6 }}>{test ? t('这是试响，不会计入小组。', "This is a test ring — it won't count.") : t(`今天会记为未完成，${pet?.name || '伙伴'}今天可能吃不上饭。`, `Today will count as not done, and ${pet?.name || 'your buddy'} may go without food.`)}</div>
          <button className="btn primary" style={{ marginTop: 6 }} onClick={() => setConfirmStop(false)}>{t('继续摇', 'Keep shaking')}</button>
          <button className="btn ghost" onClick={skip}>{t('停止并跳过', 'Stop and skip')}</button>
        </Dialog>
      )}
    </div>
  );
}

function shuffle<T>(a: T[]) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
