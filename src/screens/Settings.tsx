import { useRef, useState } from 'react';
import { useApp } from '../store';
import { AVATAR_COLORS, Avatar, BackHeader, Icon, Sheet, cssVar } from '../components/ui';
import { TzSelect } from './Onboard';
import { tzLabel } from '../lib/time';
import { audio } from '../lib/audio';

export function Settings() {
  const { api, data, reload, back, toast } = useApp();
  const me = data.profile;
  const [edit, setEdit] = useState<null | 'nick' | 'avatar' | 'tz'>(null);
  const [nick, setNick] = useState(me.nickname);
  const [ch, setCh] = useState(me.avatar_char);
  const [color, setColor] = useState(me.avatar_color);
  const [tz, setTz] = useState(me.timezone);
  const [vol, setVol] = useState(me.volume);
  const volT = useRef<number>();

  const save = async (patch: Parameters<typeof api.updateProfile>[0]) => {
    try { await api.updateProfile(patch); await reload(); setEdit(null); toast('已保存'); } catch (e) { toast((e as Error).message); }
  };

  return (
    <div className="screen">
      <BackHeader title="我的" onBack={back} />
      <div className="soft col" style={{ alignItems: 'center', padding: '24px 20px', gap: 10 }}>
        <button onClick={() => setEdit('avatar')}><Avatar ch={me.avatar_char} color={me.avatar_color} size={84} /></button>
        <button className="row" style={{ gap: 6 }} onClick={() => setEdit('nick')}><span className="h1" style={{ fontSize: 22 }}>{me.nickname}</span><Icon name="pencil" size={16} color="var(--muted)" /></button>
        <span className="sub">{data.group?.name || '还没有小组'}</span>
      </div>

      <div className="card list">
        <div className="list-row"><Icon name="globe" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>语言</span><span className="sub">简体中文</span></div>
        <button className="list-row" onClick={() => setEdit('nick')}><Icon name="pencil" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>昵称</span><span className="sub">{me.nickname}</span><Icon name="chevRight" size={16} color="var(--muted)" /></button>
        <button className="list-row" onClick={() => setEdit('avatar')}><Icon name="heart" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>头像</span><Avatar ch={me.avatar_char} color={me.avatar_color} size={26} /><Icon name="chevRight" size={16} color="var(--muted)" /></button>
        <button className="list-row" onClick={() => setEdit('tz')}><Icon name="alarm" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>我的时区</span><span className="sub">{tzLabel(me.timezone)}</span><Icon name="chevRight" size={16} color="var(--muted)" /></button>
      </div>

      <div className="card pad col" style={{ gap: 12 }}>
        <div className="row"><Icon name="volume" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>默认播放音量</span><span className="num" style={{ color: 'var(--green)', fontWeight: 600 }}>{vol}%</span></div>
        <input type="range" min={10} max={100} step={5} value={vol} style={{ ['--p' as string]: `${((vol - 10) / 90) * 100}%` }}
          onChange={(e) => { const v = +e.target.value; setVol(v); audio.setVolume(v); clearTimeout(volT.current); volT.current = window.setTimeout(() => api.updateProfile({ volume: v }).then(reload), 400); }} />
      </div>

      <div className="card list">
        <div className="list-row"><Icon name="info" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>关于 Project Alarm</span><span className="sub">v0.1 网页版</span></div>
        <div className="list-row" style={{ alignItems: 'flex-start' }}><Icon name="moon" size={20} color="var(--green)" />
          <span className="cap" style={{ lineHeight: 1.7 }}>网页版要在睡前打开 App 点「开启待命」，并保持页面打开、屏幕常亮、插着电，闹钟才会准时响。建议同时设一个手机自带闹钟当备份；被手机闹钟叫醒后打开这里，1 小时内仍可以完成摇动挑战。</span></div>
      </div>
      <button className="btn ghost" onClick={() => api.signOut()}><Icon name="logout" size={18} />退出登录</button>

      {edit === 'nick' && <Sheet onClose={() => setEdit(null)}>
        <div className="h2">昵称</div>
        <label className="field"><input autoFocus value={nick} maxLength={10} onChange={(e) => setNick(e.target.value)} /></label>
        <button className="btn primary" disabled={!nick.trim()} onClick={() => save({ nickname: nick.trim() })}>保存</button>
      </Sheet>}
      {edit === 'avatar' && <Sheet onClose={() => setEdit(null)}>
        <div className="center"><Avatar ch={ch || '早'} color={color} size={84} /></div>
        <div className="label">头像上的字</div>
        <label className="field"><input value={ch} maxLength={2} onChange={(e) => setCh(e.target.value.slice(0, 2))} /></label>
        <div className="row"><span className="label grow">颜色</span>{AVATAR_COLORS.map((c) => <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: cssVar(c) }} onClick={() => setColor(c)} />)}</div>
        <button className="btn primary" disabled={!ch.trim()} onClick={() => save({ avatar_char: ch.trim(), avatar_color: color })}>保存</button>
      </Sheet>}
      {edit === 'tz' && <Sheet onClose={() => setEdit(null)}>
        <div className="h2">我的时区</div>
        <div className="sub">闹钟按这个时区响。小组 22:00 的结算时区在小组信息里改。</div>
        <TzSelect value={tz} onChange={setTz} />
        <button className="btn primary" onClick={() => save({ timezone: tz })}>保存</button>
      </Sheet>}
    </div>
  );
}
