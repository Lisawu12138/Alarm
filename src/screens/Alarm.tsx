import { t } from '../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { Avatar, BackHeader, Icon, Seg, Sheet, Switch } from '../components/ui';
import { WEEK_ORDER, wkName, wkShort, dayLabel, fmtClock, fmtUntil, hm, nextAlarm, zonedParts } from '../lib/time';
import { audio } from '../lib/audio';
import type { AlarmDay, Voice } from '../types';

type Day = Omit<AlarmDay, 'user_id'>;

export function morningVoicesFor(voices: Voice[], uid: string, at: number | null) {
  if (!at) return [];
  return voices.filter((v) => v.to_user === uid && v.kind === 'morning' && !v.used_at && v.for_alarm_at && Math.abs(Date.parse(v.for_alarm_at) - at) < 3 * 60000);
}

export async function playVoice(path: string) {
  const { api } = await import('../api');
  await audio.unlock();
  const buf = await audio.decode(await api.voiceAudio(path));
  await audio.playBuffer(buf);
}

export function AlarmTab() {
  const { api, data, uid, reload, toast, go, armed, arm, voices, testRing } = useApp();
  const me = data.profile;
  const mine = data.alarms.filter((a) => a.user_id === uid);
  const initial: Day[] = [0, 1, 2, 3, 4, 5, 6].map((w) => {
    const a = mine.find((x) => x.weekday === w);
    return { weekday: w, alarm_time: a?.alarm_time ?? null, enabled: true };
  });
  const [days, setDays] = useState<Day[]>(initial);
  const times = new Set(days.filter((d) => d.alarm_time).map((d) => hm(d.alarm_time)));
  const [mode, setMode] = useState<'same' | 'each'>(times.size <= 1 ? 'same' : 'each');
  const [edit, setEdit] = useState<number | null>(null);
  const [secs, setSecs] = useState(me.challenge_seconds);
  const saveT = useRef<number>();
  const secT = useRef<number>();

  const next = nextAlarm(days.map((d) => ({ ...d, user_id: uid })), me.timezone);
  const nextWd = next ? zonedParts(next, me.timezone).wd : -1;
  const mv = morningVoicesFor(voices, uid, next);
  const fav = voices.find((v) => v.id === me.favorite_voice_id);
  const soundSummary = mv.length ? (mv.some((v) => v.selected) ? t(`${nick(mv.find((v) => v.selected)!.from_user)}的明早语音`, `${nick(mv.find((v) => v.selected)!.from_user)}'s morning voice`) : t(`${mv.length} 条明早语音 · 随机`, `${mv.length} morning voice${mv.length > 1 ? 's' : ''} · shuffled`)) : fav ? t(`${nick(fav.from_user)}的常用音效`, `${nick(fav.from_user)}'s wake-up sound`) : t('晨露（默认铃）', 'Morning Dew (default)');
  function nick(id: string) { return data.members.find((m) => m.id === id)?.nickname || t('朋友', 'A friend'); }

  const persist = (nd: Day[]) => {
    setDays(nd);
    clearTimeout(saveT.current);
    saveT.current = window.setTimeout(async () => {
      try { await api.saveAlarmDays(nd); await reload(); } catch (e) { toast((e as Error).message); }
    }, 500);
  };
  const sameTime = [...times][0] || '07:30';
  const setAllTime = (tt: string) => persist(days.map((d) => (d.alarm_time ? { ...d, alarm_time: tt + ':00' } : d)));
  const toggleDay = (w: number) => persist(days.map((d) => (d.weekday === w ? { ...d, alarm_time: d.alarm_time ? null : (mode === 'same' ? sameTime : '07:30') + ':00' } : d)));

  return (
    <div className="screen with-tab">
      <div className="h1" style={{ fontSize: 28 }}>{t('闹钟', 'Alarm')}</div>

      <div style={{ background: 'var(--deep)', borderRadius: 28, padding: '18px 20px', position: 'relative', overflow: 'hidden', color: 'var(--paper)' }}>
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'var(--darkCard)', right: -30, top: -40 }} />
        <div style={{ position: 'relative' }} className="col">
          {next ? (<>
            <div className="cap" style={{ color: 'var(--darkMuted)', fontWeight: 500 }}>{dayLabel(next, me.timezone)} · {fmtUntil(next)}</div>
            <div className="big-time" style={{ fontSize: 62 }}>{fmtClock(next, me.timezone)}</div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <span className="pill" style={{ background: 'var(--darkCard)', fontSize: 12, padding: '5px 10px' }}><Icon name="vibrate" size={13} color="var(--sun)" />{t(`摇 ${secs} 秒`, `Shake ${secs}s`)}</span>
              <span className="pill" style={{ background: 'var(--darkCard)', fontSize: 12, padding: '5px 10px' }}><Icon name="mic" size={13} color="var(--sun)" />{soundSummary}</span>
            </div>
            <button className="btn sm" onClick={() => arm(!armed)} style={{ marginTop: 10, background: armed ? 'var(--darkCard)' : 'var(--sun)', color: armed ? 'var(--paper)' : 'var(--deep)' }}>
              <Icon name="moon" size={16} />{armed ? t('待命中 · 点这里取消', 'Standing by · tap to cancel') : t('睡前开启待命', 'Stand by before bed')}</button>
          </>) : (<>
            <div className="cap" style={{ color: 'var(--darkMuted)' }}>{t('还没有闹钟', 'No alarm yet')}</div>
            <div className="big-time" style={{ fontSize: 44, opacity: 0.6 }}>--:--</div>
          </>)}
        </div>
      </div>

      <Seg value={mode} options={[['same', t('每天同一时间', 'Same every day')], ['each', t('逐天设置', 'Per day')]]} onChange={(m) => { setMode(m); if (m === 'same') setAllTime(sameTime); }} />

      {mode === 'same' && (
        <label className="field" style={{ justifyContent: 'space-between' }}>
          <span className="sub">{t('响铃时间', 'Alarm time')}</span>
          <input type="time" value={sameTime} onChange={(e) => e.target.value && setAllTime(e.target.value)} style={{ width: 'auto', fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, color: 'var(--deep)', textAlign: 'right' }} />
        </label>
      )}

      <div className="week">
        {WEEK_ORDER.map((w) => {
          const d = days.find((x) => x.weekday === w)!;
          const isNext = w === nextWd && !!d.alarm_time;
          return (
            <button key={w} className={`day ${d.alarm_time ? '' : 'rest'} ${isNext ? 'next' : ''}`} onClick={() => (mode === 'same' ? toggleDay(w) : setEdit(w))}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{wkShort(w)}</span>
              {d.alarm_time ? <span className="num" style={{ fontSize: 13, fontWeight: 600, color: isNext ? 'var(--deep)' : 'var(--green)' }}>{hm(d.alarm_time)}</span> : <Icon name="moon" size={15} color="var(--muted)" />}
              <span style={{ fontSize: 10, color: isNext ? 'var(--deep)' : 'var(--muted)' }}>{d.alarm_time ? (isNext ? t('下一次', 'Next') : t('响铃', 'On')) : t('休息', 'Off')}</span>
            </button>
          );
        })}
      </div>
      <div className="cap">{mode === 'same' ? t('点某一天切换「响铃 / 休息」', 'Tap a day to switch it on or off') : t('点某一天单独设置时间', 'Tap a day to set its own time')}</div>

      <div className="card pad col" style={{ gap: 10 }}>
        <div className="row"><span className="grow" style={{ fontWeight: 500 }}>{t('摇动挑战', 'Shake challenge')}</span><span className="num" style={{ color: 'var(--green)', fontWeight: 600 }}>{t(`${secs} 秒`, `${secs}s`)}</span></div>
        <input type="range" min={15} max={60} step={5} value={secs} style={{ ['--p' as string]: `${((secs - 15) / 45) * 100}%` }}
          onChange={(e) => { const v = +e.target.value; setSecs(v); clearTimeout(secT.current); secT.current = window.setTimeout(() => api.updateProfile({ challenge_seconds: v }).then(reload), 400); }} />
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="cap">15s</span><span className="cap">60s</span></div>
      </div>

      <div className="card list">
        <button className="list-row" onClick={() => go({ name: 'sounds' })}>
          <Icon name="volume" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('唤醒声音', 'Wake-up sound')}</span>
          <span className="sub" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{soundSummary}</span><Icon name="chevRight" size={16} color="var(--muted)" />
        </button>
        <button className="list-row" onClick={testRing}>
          <Icon name="alarm" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('试响一次', 'Test ring')}</span><span className="sub">{t('不计入小组', 'doesn\'t count')}</span><Icon name="chevRight" size={16} color="var(--muted)" />
        </button>
      </div>

      {edit !== null && (
        <DayEditor day={days.find((d) => d.weekday === edit)!} onClose={() => setEdit(null)}
          onSave={(d) => { persist(days.map((x) => (x.weekday === d.weekday ? d : x))); setEdit(null); }} />
      )}
    </div>
  );
}

function DayEditor({ day, onClose, onSave }: { day: Day; onClose: () => void; onSave: (d: Day) => void }) {
  const [rest, setRest] = useState(!day.alarm_time);
  const [tm, setTm] = useState(hm(day.alarm_time) || '07:30');
  return (
    <Sheet onClose={onClose}>
      <div className="h2">{wkName(day.weekday)}</div>
      <div className="row card pad"><span className="grow" style={{ fontWeight: 500 }}>{t('这天休息', 'Day off')}</span><Switch on={rest} onChange={setRest} /></div>
      {!rest && <label className="field" style={{ justifyContent: 'center', height: 80 }}>
        <input type="time" value={tm} onChange={(e) => setTm(e.target.value)} style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 300, textAlign: 'center', color: 'var(--deep)' }} /></label>}
      <button className="btn primary" onClick={() => onSave({ ...day, alarm_time: rest ? null : tm + ':00' })}>{t('好', 'Done')}</button>
    </Sheet>
  );
}

export function SoundPicker() {
  const { api, data, uid, voices, reload, reloadVoices, back, toast } = useApp();
  const me = data.profile;
  const next = nextAlarm(data.alarms.filter((a) => a.user_id === uid), me.timezone);
  const mv = useMemo(() => morningVoicesFor(voices, uid, next), [voices, uid, next]);
  const favs = voices.filter((v) => v.to_user === uid && v.kind === 'favorite');
  const [playing, setPlaying] = useState<string | null>(null);
  const nick = (id: string) => data.members.find((m) => m.id === id);

  useEffect(() => () => audio.stopAll(), []);

  const play = async (v: Voice) => {
    if (playing === v.id) { audio.stopVoice(); setPlaying(null); return; }
    setPlaying(v.id);
    try { await playVoice(v.storage_path); } catch { toast(t('这段语音播放不了', 'Can\'t play this clip')); }
    setPlaying((p) => (p === v.id ? null : p));
  };
  const pickMorning = async (id: string | null) => {
    for (const v of mv) { const sel = v.id === id; if (v.selected !== sel) await api.updateVoice(v.id, { selected: sel }); }
    await reloadVoices();
  };
  const ago = (iso: string) => { const d = new Date(iso); return t(`${d.getMonth() + 1}/${d.getDate()} ${fmtClock(iso)} 录`, `recorded ${d.getMonth() + 1}/${d.getDate()} ${fmtClock(iso)}`); };

  const Row = ({ v, on, onPick, last }: { v: Voice; on: boolean; onPick: () => void; last?: boolean }) => {
    const p = nick(v.from_user);
    return (
      <div className="list-row" style={{ borderBottom: last ? 0 : undefined }}>
        <button className="row grow" style={{ gap: 12, textAlign: 'left' }} onClick={onPick}>
          <Radio on={on} />{p && <Avatar ch={p.avatar_char} color={p.avatar_color} size={34} />}
          <span className="col" style={{ gap: 1 }}><span style={{ fontWeight: on ? 700 : 500 }}>{p?.nickname || t('朋友', 'A friend')}</span><span className="cap">{((v.duration_ms || 0) / 1000).toFixed(0)}{t(' 秒', 's')} · {ago(v.created_at)}</span></span>
        </button>
        <button className="icon-btn" style={{ background: 'var(--soft)', border: 0 }} onClick={() => play(v)}><Icon name={playing === v.id ? 'pause' : 'play'} size={14} color="var(--green)" /></button>
      </div>
    );
  };

  return (
    <div className="screen">
      <BackHeader title={t('唤醒声音', 'Wake-up sound')} sub={next ? t(`${dayLabel(next, me.timezone)} ${fmtClock(next, me.timezone)} 的闹钟`, `Alarm ${dayLabel(next, me.timezone)} ${fmtClock(next, me.timezone)}`) : t('还没有设闹钟', 'No alarm set yet')} onBack={back} />

      <div className="row" style={{ gap: 8, padding: '6px 4px 0' }}><span className="label">{t('明早语音', 'Morning voice')}</span><span className="chip" style={{ background: 'var(--sun)', color: 'var(--deep)' }}>{t('用过即失效', 'one-time')}</span></div>
      {mv.length ? (
        <div className="card list">
          <button className="list-row" onClick={() => pickMorning(null)}><Radio on={!mv.some((v) => v.selected)} /><Icon name="shuffle" size={20} color="var(--green)" />
            <span className="grow" style={{ fontWeight: mv.some((v) => v.selected) ? 500 : 700 }}>{t('全部随机轮流播', 'Shuffle all')}</span><span className="cap">{mv.length}</span></button>
          {mv.map((v) => <Row key={v.id} v={v} on={v.selected} onPick={() => pickMorning(v.id)} />)}
        </div>
      ) : <div className="card pad sub">{t('还没有人给你录明早语音。朋友在小组页点你的「给TA录」就能录。', 'No morning voices yet. Friends can record one by tapping "Record" next to your name on the group page.')}</div>}

      <div className="label" style={{ padding: '6px 4px 0' }}>{t('常用起床音效 · 没有明早语音时播放', 'Wake-up sounds · played when there is no morning voice')}</div>
      {favs.length ? (
        <div className="card list">
          <button className="list-row" onClick={() => api.updateProfile({ favorite_voice_id: null }).then(reload)}><Radio on={!me.favorite_voice_id} /><span className="grow">{t('不用', 'None')}</span></button>
          {favs.map((v) => <Row key={v.id} v={v} on={me.favorite_voice_id === v.id} onPick={() => api.updateProfile({ favorite_voice_id: v.id }).then(reload)} />)}
        </div>
      ) : <div className="card pad sub">{t('朋友给你录的常用音效会出现在这里。', 'Wake-up sounds friends record for you show up here.')}</div>}

      <div className="label" style={{ padding: '6px 4px 0' }}>{t('默认铃声 · 最后兜底', 'Default ringtone · the fallback')}</div>
      <div className="card list">
        <div className="list-row"><Radio on /><span className="center" style={{ background: 'var(--soft)', borderRadius: 999, width: 34, height: 34 }}><Icon name="sun" size={18} color="var(--green)" /></span>
          <span className="grow" style={{ fontWeight: 700 }}>{t('晨露', 'Morning Dew')}</span>
          <button className="icon-btn" style={{ background: 'var(--soft)', border: 0 }} onClick={async () => { await audio.unlock(); audio.setVolume(me.volume); audio.previewRing(); }}><Icon name="play" size={14} color="var(--green)" /></button></div>
      </div>

      <div className="row soft" style={{ padding: '14px 16px', borderRadius: 20 }}>
        <div className="grow"><div style={{ fontWeight: 700, color: 'var(--deep)', fontSize: 14 }}>{t('好友实时叫醒时直接播放', 'Play live wake-ups right away')}</div><div className="cap">{t('关闭后需要你手动接听', 'When off, you\'ll tap to answer')}</div></div>
        <Switch on={me.allow_live_autoplay} onChange={(v) => api.updateProfile({ allow_live_autoplay: v }).then(reload)} />
      </div>
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return <span style={{ width: 22, height: 22, borderRadius: 999, flex: 'none', border: on ? '6px solid var(--green)' : '2px solid var(--line)', background: on ? 'var(--soft)' : 'transparent', boxSizing: 'border-box' }} />;
}
