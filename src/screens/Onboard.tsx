import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { Avatar, BackHeader, Icon, PetSprite } from '../components/ui';
import { allTimezones, localTz, tzLabel } from '../lib/time';
import type { GroupPreview } from '../types';

export function CodeBoxes({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label style={{ position: 'relative', display: 'flex', gap: 6 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="code-box" style={{ borderColor: value.length === 6 ? 'var(--green)' : i === value.length ? 'var(--green)' : undefined }}>{value[i] || ''}</div>
      ))}
      <input className="code-input" autoFocus={autoFocus} value={value} maxLength={6} autoCapitalize="characters" autoComplete="off"
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} />
    </label>
  );
}

export function TzSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const list = allTimezones();
  return (
    <label className="field" style={{ gap: 10 }}>
      <Icon name="globe" size={18} color="var(--green)" />
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {!list.includes(value) && <option value={value}>{tzLabel(value)}</option>}
        {list.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}（{tzLabel(t).split(' · ')[1]}）</option>)}
      </select>
    </label>
  );
}

export function Onboard() {
  const { api, data, reload, toast } = useApp();
  const invite = sessionStorage.getItem('pa_invite') || '';
  const [mode, setMode] = useState<'start' | 'create' | 'join'>(invite ? 'join' : 'start');
  const [name, setName] = useState('');
  const [tz, setTz] = useState(localTz());
  const [code, setCode] = useState(invite);
  const [preview, setPreview] = useState<GroupPreview | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (code.length !== 6) { setPreview(undefined); return; }
    let live = true;
    api.previewGroup(code).then((p) => live && setPreview(p)).catch(() => live && setPreview(null));
    return () => { live = false; };
  }, [code, api]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); sessionStorage.removeItem('pa_invite'); await reload(); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  if (mode === 'create') return (
    <div className="screen">
      <BackHeader title={t('创建小组', 'Create a group')} onBack={() => setMode('start')} />
      <div className="col" style={{ gap: 8 }}><div className="label">{t('组名', 'Group name')}</div>
        <label className="field"><input value={name} maxLength={20} placeholder={t('比如：早八互助会', 'e.g. Early Birds Club')} onChange={(e) => setName(e.target.value)} /></label></div>
      <div className="col" style={{ gap: 8 }}><div className="label">{t('小组时区', 'Group time zone')}</div><TzSelect value={tz} onChange={setTz} />
        <div className="cap">{t('每晚 22:00（按这个时区）结算一天：全组起床就发食物，没人喂伙伴就会饿。之后可以在小组信息里改。', 'Each day closes at 10 PM in this time zone: if everyone woke up you get food, and if nobody fed your buddy it goes hungry. You can change this later in group info.')}</div></div>
      <div className="spacer" />
      <button className="btn primary" disabled={!name.trim() || busy} onClick={() => run(() => api.createGroup(name.trim(), tz))}>{t('创建', 'Create')}</button>
    </div>
  );

  if (mode === 'join') return (
    <div className="screen">
      <BackHeader title={t('用邀请码加入', 'Join with a code')} onBack={() => setMode('start')} />
      <CodeBoxes value={code} onChange={setCode} autoFocus />
      {preview === null && <div className="err">{t('没有找到这个邀请码', 'Couldn\'t find that invite code')}</div>}
      {preview && (
        <>
          <div className="row" style={{ gap: 6, color: 'var(--green)', fontSize: 13 }}><Icon name="check" size={16} />{t('找到了这个小组', 'Found it')}</div>
          <div className="soft col" style={{ padding: 20, gap: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'var(--peach)', opacity: 0.6, right: -50, top: -60 }} />
            <div className="h1" style={{ position: 'relative' }}>{preview.name}</div>
            <div className="row">
              <div className="row" style={{ gap: 0 }}>{preview.members.map((m, i) => <div key={i} style={{ marginLeft: i ? -10 : 0 }}><Avatar ch={m.avatar_char} color={m.avatar_color} size={38} ring={3} ringColor="soft" /></div>)}</div>
              <span className="sub">{t(`${preview.members.length} 位成员`, `${preview.members.length} members`)}</span>
            </div>
            <div className="card list">
              <div className="list-row"><Icon name="globe" size={18} color="var(--green)" /><span className="grow">{t('小组时区', 'Group time zone')}</span><span className="sub">{tzLabel(preview.timezone)}</span></div>
              <div className="list-row"><Icon name="paw" size={18} color={preview.pet ? 'var(--green)' : 'var(--muted)'} /><span className="grow">{t('共养伙伴', 'Shared buddy')}</span>
                {preview.pet ? <span className="row" style={{ gap: 6 }}><PetSprite species={preview.pet.species} stage={1} height={22} /><span className="sub">{preview.pet.name}</span></span> : <span className="sub">{t('还没有，入组后一起领养', 'None yet')}</span>}</div>
            </div>
          </div>
        </>
      )}
      <div className="spacer" />
      <button className="btn primary" disabled={!preview || busy} onClick={() => run(() => api.joinGroup(code))}>{preview ? t(`加入${preview.name}`, `Join ${preview.name}`) : t('加入', 'Join')}</button>
    </div>
  );

  return (
    <div className="screen" style={{ gap: 14 }}>
      <div style={{ position: 'relative', height: 360, flex: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'var(--sun)', right: -20, top: 30, opacity: 0.9 }} />
        <div style={{ position: 'absolute', width: 560, height: 220, borderRadius: '50%', background: 'var(--mint)', left: -110, top: 250 }} />
        <h1 className="serif" style={{ position: 'absolute', left: 0, top: 24, margin: 0, fontWeight: 300, fontStyle: 'italic', fontSize: 52, lineHeight: 1, color: 'var(--deep)' }}>{t('你好，', 'Hello,')}<br />{data.profile.nickname}</h1>
        <div style={{ position: 'absolute', left: 2, top: 150, fontWeight: 700, fontSize: 17, lineHeight: 1.6, color: 'var(--deep)' }}>{t('先找到一起早起的人', 'First, find your wake-up crew')}</div>
        <div style={{ position: 'absolute', right: 30, top: 186 }} className="bob"><PetSprite species="frog" stage={3} height={100} /></div>
        <div style={{ position: 'absolute', left: 50, top: 290 }}><PetSprite species="frog" stage={1} height={34} /></div>
      </div>
      <div className="spacer" />
      <button className="row" onClick={() => setMode('create')} style={{ background: 'var(--deep)', borderRadius: 26, padding: 18, gap: 14, textAlign: 'left' }}>
        <span className="center" style={{ background: 'var(--sun)', borderRadius: 999, width: 42, height: 42 }}><Icon name="plus" size={22} color="var(--deep)" /></span>
        <span className="grow"><div style={{ color: 'var(--paper)', fontWeight: 700, fontSize: 17 }}>{t('创建小组', 'Create a group')}</div><div className="cap" style={{ color: 'var(--darkMuted)' }}>{t('建好后邀请朋友加入', 'Then invite your friends')}</div></span>
        <Icon name="chevRight" color="var(--darkMuted)" />
      </button>
      <button className="card col" onClick={() => setMode('join')} style={{ padding: '16px 18px', gap: 12, textAlign: 'left' }}>
        <div className="row"><span className="h3 grow" style={{ fontSize: 17 }}>{t('用邀请码加入', 'Join with a code')}</span><Icon name="chevRight" color="var(--muted)" /></div>
        <div className="row" style={{ gap: 6 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px dashed var(--line)' }} />)}</div>
      </button>
    </div>
  );
}
