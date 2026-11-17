import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { Avatar, Dialog, Icon, PetSprite, SegRing, Sheet, stageOf } from '../components/ui';
import { TzSelect } from './Onboard';
import { fmtClock, fmtUntil, localTz, minutesSince, nextAlarm, tzLabel } from '../lib/time';
import type { BoardMember } from '../types';

export type MState = { kind: 'done' | 'skipped' | 'ringing' | 'late' | 'upcoming' | 'rest'; text: string; mins: number };

export function memberState(m: BoardMember, now = Date.now()): MState {
  if (!m.scheduled_at) return { kind: 'rest', text: t('今天休息', 'Resting today'), mins: 0 };
  const mins = minutesSince(m.scheduled_at, now);
  const own = fmtClock(m.scheduled_at, m.timezone);
  const away = m.timezone !== localTz() ? t(`（${tzLabel(m.timezone).split(' · ')[0]}）`, ` (${tzLabel(m.timezone).split(' · ')[0]})`) : '';
  if (m.status === 'done') return { kind: 'done', text: t(`${fmtClock(m.completed_at!, m.timezone)} 起床${m.shake_seconds ? ` · 摇了 ${m.shake_seconds} 秒` : ''}`, `Up at ${fmtClock(m.completed_at!, m.timezone)}${m.shake_seconds ? ` · shook ${m.shake_seconds}s` : ''}`), mins };
  if (m.status === 'skipped') return { kind: 'skipped', text: t(`${own} 的闹钟跳过了`, `Skipped the ${own} alarm`), mins };
  if (m.status === 'ringing') return { kind: 'ringing', text: t(`响铃中 · 已 ${Math.max(0, mins)} 分钟`, `Ringing · ${Math.max(0, mins)} min`), mins };
  if (mins >= 0) return { kind: 'late', text: t(`${own}${away} 的闹钟 · 还没动静`, `${own}${away} alarm · no sign of life yet`), mins };
  return { kind: 'upcoming', text: t(`${own}${away} 响铃`, `Alarm at ${own}${away}`), mins };
}

export function GroupHome() {
  const { data, board, uid, go, armed, arm, member } = useApp();
  const [info, setInfo] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  const g = data.group!;
  const pet = data.pet;
  const me = data.profile;
  const members = board?.members || [];
  const states = members.map((m) => ({ m, s: memberState(m) }));
  const parts = states.filter((x) => x.s.kind !== 'rest');
  const done = parts.filter((x) => x.s.kind === 'done').length;
  const waiting = parts.filter((x) => x.s.kind !== 'done' && x.s.kind !== 'skipped').map((x) => x.m.nickname);
  const myNext = nextAlarm(data.alarms.filter((a) => a.user_id === uid), me.timezone);
  const ringSize = 168;
  const R = (ringSize / 2) * 0.87;

  const caption = parts.length === 0 ? t('今天没有人设闹钟', 'Nobody has an alarm today')
    : board?.reward_today ? t(`全组达标，${pet?.name || '伙伴'}今天有饭吃了`, `Everyone's up — ${pet?.name || 'your buddy'} eats today`)
    : parts.some((x) => x.s.kind === 'skipped') ? t('今天有人跳过了，没有食物', 'Someone skipped today — no food')
    : waiting.length ? t(`等${waiting.slice(0, 2).join('、')}${waiting.length > 2 ? '等人' : ''}起床，${pet?.name || '伙伴'}今天就有饭吃`, `Once ${waiting.slice(0, 2).join(' & ')}${waiting.length > 2 ? ' & co.' : ''} ${waiting.length > 1 ? 'are' : 'is'} up, ${pet?.name || 'your buddy'} eats today`) : '';

  return (
    <div className="screen with-tab">
      <div className="row" style={{ gap: 12 }}>
        <button className="grow" style={{ textAlign: 'left' }} onClick={() => setInfo(true)}>
          <div className="row" style={{ gap: 4 }}><span className="h1" style={{ fontSize: 22 }}>{g.name}</span><Icon name="chevDown" size={18} color="var(--muted)" /></div>
          <div className="sub">{t(`${data.members.length} 位成员 · ${tzLabel(g.timezone).split(' · ')[0]}时间 22:00 结算`, `${data.members.length} members · day closes 10 PM ${tzLabel(g.timezone).split(' · ')[0]} time`)}</div>
        </button>
        <button onClick={() => go({ name: 'settings' })} aria-label={t('个人设置', 'Profile')}><Avatar ch={me.avatar_char} color={me.avatar_color} size={38} ring={2} /></button>
      </div>

      <div className="soft row" style={{ padding: '18px 16px 18px 14px', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: ringSize, height: ringSize, flex: 'none' }}>
          <SegRing size={ringSize} segments={parts.length ? parts.map((x) => ({
            color: x.s.kind === 'done' ? 'var(--green)' : x.s.kind === 'skipped' ? 'var(--danger)' : x.s.kind === 'upcoming' ? 'var(--line)' : 'var(--orange)',
            opacity: x.s.kind === 'done' || x.s.kind === 'upcoming' ? 1 : 0.45,
          })) : [{ color: 'var(--line)' }]} />
          <div style={{ position: 'absolute', left: (ringSize - 104) / 2, top: 104, width: 104, height: 30, borderRadius: '50%', background: 'var(--mint)' }} />
          {pet && <div className="bob" style={{ position: 'absolute', left: 0, right: 0, top: 44, display: 'flex', justifyContent: 'center' }}>
            <PetSprite species={pet.species} stage={stageOf(pet.fed_days)} height={70} width={96} /></div>}
          {parts.map((x, i) => {
            const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / parts.length;
            const s = 28;
            return <div key={x.m.user_id} style={{ position: 'absolute', left: ringSize / 2 + R * Math.cos(a) - s / 2, top: ringSize / 2 + R * Math.sin(a) - s / 2 }}>
              <Avatar ch={x.m.avatar_char} color={x.m.avatar_color} size={s} ring={2} ringColor={x.s.kind === 'done' ? 'green' : x.s.kind === 'upcoming' ? 'line' : 'orange'} /></div>;
          })}
        </div>
        <div className="col grow" style={{ gap: 6 }}>
          <div className="cap" style={{ fontWeight: 500 }}>{t('今日完成', 'Done today')}</div>
          <div className="row" style={{ gap: 2, alignItems: 'baseline' }}>
            <span className="num" style={{ fontSize: 56, fontWeight: 600, color: 'var(--deep)', lineHeight: 1 }}>{done}</span>
            <span className="num" style={{ fontSize: 26, color: 'var(--muted)' }}>/{parts.length}</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{caption}</div>
          <span className="pill" style={{ background: 'var(--white)', color: 'var(--green)', alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px' }}>
            <Icon name="bowl" size={14} />{t(`库存 ${g.food_stock} 份`, `${g.food_stock} in pantry`)}</span>
        </div>
      </div>

      {myNext && myNext - Date.now() < 16 * 3600e3 && (
        armed ? (
          <div className="row" style={{ background: 'var(--deep)', color: 'var(--paper)', borderRadius: 20, padding: '12px 16px' }}>
            <Icon name="moon" size={18} color="var(--sun)" /><span className="grow" style={{ fontSize: 14 }}>{t(`待命中 · ${fmtClock(myNext)} 叫你`, `Standing by · wakes you at ${fmtClock(myNext)}`)}</span>
            <button className="cap" style={{ color: 'var(--darkMuted)' }} onClick={() => arm(false)}>{t('取消', 'Cancel')}</button>
          </div>
        ) : (
          <button className="row" onClick={() => arm(true)} style={{ background: 'var(--deep)', color: 'var(--paper)', borderRadius: 20, padding: '12px 16px', textAlign: 'left' }}>
            <Icon name="moon" size={18} color="var(--sun)" /><span className="grow"><div style={{ fontSize: 14, fontWeight: 700 }}>{t('睡前开启待命', 'Stand by before bed')}</div><div className="cap" style={{ color: 'var(--darkMuted)' }}>{t(`${fmtClock(myNext)} 响铃`, `Rings at ${fmtClock(myNext)}`)} · {fmtUntil(myNext)}</div></span>
            <Icon name="chevRight" color="var(--darkMuted)" />
          </button>
        )
      )}

      <div className="row"><span className="h2 grow" style={{ fontSize: 17 }}>{t('今天的起床', 'Today\'s wake-ups')}</span>
        <button className="pill line" onClick={() => setInfo(true)}><Icon name="plus" size={14} />{t('邀请', 'Invite')}</button></div>

      {states.map(({ m, s }) => {
        const isMe = m.user_id === uid;
        const canWake = !isMe && (s.kind === 'ringing' || s.kind === 'late') && s.mins >= 5;
        return (
          <div key={m.user_id} className="card row" style={{ padding: 12, gap: 12, opacity: s.kind === 'rest' ? 0.55 : 1, borderColor: canWake ? 'var(--orange)' : undefined, borderWidth: canWake ? 1.5 : 1 }}>
            <Avatar ch={m.avatar_char} color={m.avatar_color} size={42} />
            <div className="grow col" style={{ gap: 3 }}>
              <div className="row" style={{ gap: 6 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{m.nickname}</span>{isMe && <span className="chip" style={{ background: 'var(--soft)', color: 'var(--green)' }}>{t('我', 'me')}</span>}</div>
              <div className="row" style={{ gap: 5, fontSize: 13, color: s.kind === 'done' ? 'var(--green)' : s.kind === 'ringing' || s.kind === 'late' ? 'var(--danger)' : 'var(--muted)', fontWeight: canWake ? 500 : 400 }}>
                {s.kind === 'done' && <Icon name="check" size={14} />}
                {s.kind === 'rest' && <Icon name="moon" size={14} />}
                {s.kind === 'upcoming' && <Icon name="alarm" size={14} />}
                {(s.kind === 'ringing' || s.kind === 'late') && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--orange)' }} />}
                {s.kind === 'skipped' && <Icon name="x" size={14} />}
                <span>{s.text}</span>
              </div>
            </div>
            {canWake ? (
              <button className="pill" style={{ background: 'var(--orange)', color: 'var(--deep)', fontWeight: 700, padding: '10px 14px' }} onClick={() => go({ name: 'live', to: m.user_id })}>
                <Icon name="mic" size={16} />{t('叫醒', 'Wake')}</button>
            ) : !isMe ? (
              <button className="pill line" onClick={() => go({ name: 'record', to: m.user_id })}><Icon name="mic" size={14} />{t('给TA录', 'Record')}</button>
            ) : null}
          </div>
        );
      })}
      {members.length === 0 && <div className="cap tc">{t('载入中…', 'Loading…')}</div>}
      {info && <GroupInfo onClose={() => setInfo(false)} />}
      {member(uid) && null}
    </div>
  );
}

function GroupInfo({ onClose }: { onClose: () => void }) {
  const { api, data, reload, toast, uid } = useApp();
  const g = data.group!;
  const [name, setName] = useState(g.name);
  const [editing, setEditing] = useState(false);
  const [tz, setTz] = useState(g.timezone);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const link = `${location.origin}/?code=${g.invite_code}`;

  const save = async (patch: { name?: string; timezone?: string }) => {
    try { await api.updateGroup(patch); await reload(); toast(t('已保存', 'Saved')); } catch (e) { toast((e as Error).message); }
  };
  const share = async () => {
    const text = t(`一起早起养${data.pet?.name || '伙伴'}吧！加入「${g.name}」：${link}  邀请码 ${g.invite_code}`, `Wake up with us and raise ${data.pet?.name || 'a buddy'}! Join "${g.name}": ${link}  Invite code ${g.invite_code}`);
    try {
      if (navigator.share) await navigator.share({ title: 'Project Alarm', text, url: link });
      else { await navigator.clipboard.writeText(text); toast(t('邀请链接已复制', 'Invite link copied')); }
    } catch { /* cancelled */ }
  };

  return (
    <Sheet onClose={onClose}>
      <div className="row">
        {editing ? (
          <label className="field grow" style={{ height: 46 }}><input autoFocus value={name} maxLength={20} onChange={(e) => setName(e.target.value)}
            onBlur={() => { setEditing(false); if (name.trim() && name !== g.name) save({ name: name.trim() }); }} /></label>
        ) : (
          <button className="row" style={{ gap: 8 }} onClick={() => setEditing(true)}><span className="h1">{g.name}</span><Icon name="pencil" size={18} color="var(--muted)" /></button>
        )}
      </div>
      <div className="col" style={{ gap: 10 }}>
        <div className="label">{t('邀请码', 'Invite code')}</div>
        <div className="row" style={{ gap: 6 }}>{g.invite_code.split('').map((c, i) => <div key={i} className="code-box">{c}</div>)}</div>
        <button className="btn secondary sm" onClick={share}><Icon name="copy" size={16} />{t('复制邀请链接', 'Copy invite link')}</button>
      </div>
      <div className="col" style={{ gap: 8 }}>
        <div className="label">{t('小组时区 · 每晚 22:00 结算', 'Group time zone · day closes at 10 PM')}</div>
        <TzSelect value={tz} onChange={(v) => { setTz(v); save({ timezone: v }); }} />
      </div>
      <div className="card list">
        {data.members.map((m) => (
          <div key={m.id} className="list-row">
            <Avatar ch={m.avatar_char} color={m.avatar_color} size={34} />
            <span className="grow" style={{ fontWeight: 500 }}>{m.nickname}{m.id === uid ? t('（我）', ' (me)') : ''}{m.id === g.created_by ? <span className="chip" style={{ background: 'var(--sun)', marginLeft: 6 }}>{t('创建者', 'creator')}</span> : null}</span>
            <span className="cap">{tzLabel(m.timezone)}</span>
          </div>
        ))}
      </div>
      <button className="btn ghost" onClick={() => setConfirmLeave(true)}>{t('退出小组', 'Leave group')}</button>
      {confirmLeave && (
        <Dialog onClose={() => setConfirmLeave(false)}>
          <div className="h2">{t(`退出「${g.name}」？`, `Leave "${g.name}"?`)}</div>
          <div className="sub">{t('你的闹钟还在，但不再计入这个小组，也看不到伙伴了。', 'Your alarms stay, but they won\'t count for this group and you won\'t see the buddy anymore.')}</div>
          <button className="btn primary" style={{ marginTop: 8 }} onClick={() => setConfirmLeave(false)}>{t('再想想', 'Never mind')}</button>
          <button className="btn ghost" onClick={async () => { await api.leaveGroup(); await reload(); }}>{t('退出', 'Leave')}</button>
        </Dialog>
      )}
    </Sheet>
  );
}
