import { t } from '../i18n';
import { useRef, useState } from 'react';
import { useApp } from '../store';
import { AVATAR_COLORS, Avatar, BackHeader, Icon, Sheet, cssVar } from '../components/ui';
import { TzSelect } from './Onboard';
import { tzLabel } from '../lib/time';
import { audio } from '../lib/audio';
import { setLang, useLang } from '../i18n';

export function LangSwitch() {
  const lang = useLang();
  return (
    <div className="seg" style={{ padding: 3, flex: 'none' }}>
      <button className={lang === 'en' ? 'on' : ''} style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'zh' ? 'on' : ''} style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setLang('zh')}>中文</button>
    </div>
  );
}

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
    try { await api.updateProfile(patch); await reload(); setEdit(null); toast(t('已保存', 'Saved')); } catch (e) { toast((e as Error).message); }
  };

  return (
    <div className="screen">
      <BackHeader title={t('我的', 'Me')} onBack={back} />
      <div className="soft col" style={{ alignItems: 'center', padding: '24px 20px', gap: 10 }}>
        <button onClick={() => setEdit('avatar')}><Avatar ch={me.avatar_char} color={me.avatar_color} size={84} /></button>
        <button className="row" style={{ gap: 6 }} onClick={() => setEdit('nick')}><span className="h1" style={{ fontSize: 22 }}>{me.nickname}</span><Icon name="pencil" size={16} color="var(--muted)" /></button>
        <span className="sub">{data.group?.name || t('还没有小组', 'No group yet')}</span>
      </div>

      <div className="card list">
        <div className="list-row"><Icon name="globe" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('语言', 'Language')}</span><LangSwitch /></div>
        <button className="list-row" onClick={() => setEdit('nick')}><Icon name="pencil" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('昵称', 'Nickname')}</span><span className="sub">{me.nickname}</span><Icon name="chevRight" size={16} color="var(--muted)" /></button>
        <button className="list-row" onClick={() => setEdit('avatar')}><Icon name="heart" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('头像', 'Avatar')}</span><Avatar ch={me.avatar_char} color={me.avatar_color} size={26} /><Icon name="chevRight" size={16} color="var(--muted)" /></button>
        <button className="list-row" onClick={() => setEdit('tz')}><Icon name="alarm" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('我的时区', 'My time zone')}</span><span className="sub">{tzLabel(me.timezone)}</span><Icon name="chevRight" size={16} color="var(--muted)" /></button>
      </div>

      <div className="card pad col" style={{ gap: 12 }}>
        <div className="row"><Icon name="volume" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('默认播放音量', 'Default volume')}</span><span className="num" style={{ color: 'var(--green)', fontWeight: 600 }}>{vol}%</span></div>
        <input type="range" min={10} max={100} step={5} value={vol} style={{ ['--p' as string]: `${((vol - 10) / 90) * 100}%` }}
          onChange={(e) => { const v = +e.target.value; setVol(v); audio.setVolume(v); clearTimeout(volT.current); volT.current = window.setTimeout(() => api.updateProfile({ volume: v }).then(reload), 400); }} />
      </div>

      <div className="card list">
        <div className="list-row"><Icon name="info" size={20} color="var(--green)" /><span className="grow" style={{ fontWeight: 500 }}>{t('关于 Project Alarm', 'About Project Alarm')}</span><span className="sub">{t('v0.1 网页版', 'v0.1 web')}</span></div>
        <div className="list-row" style={{ alignItems: 'flex-start' }}><Icon name="moon" size={20} color="var(--green)" />
          <span className="cap" style={{ lineHeight: 1.7 }}>{t('网页版要在睡前打开 App 点「开启待命」，并保持页面打开、屏幕常亮、插着电，闹钟才会准时响。建议同时设一个手机自带闹钟当备份；被手机闹钟叫醒后打开这里，1 小时内仍可以完成摇动挑战。', 'On the web, open the app before bed and tap "Stand by", then keep the page open, the screen on and the phone plugged in so the alarm rings on time. Set your phone\'s own alarm as a backup too — if that wakes you, open the app within an hour to finish the shake challenge.')}</span></div>
      </div>
      <button className="btn ghost" onClick={() => api.signOut()}><Icon name="logout" size={18} />{t('退出登录', 'Log out')}</button>

      {edit === 'nick' && <Sheet onClose={() => setEdit(null)}>
        <div className="h2">{t('昵称', 'Nickname')}</div>
        <label className="field"><input autoFocus value={nick} maxLength={10} onChange={(e) => setNick(e.target.value)} /></label>
        <button className="btn primary" disabled={!nick.trim()} onClick={() => save({ nickname: nick.trim() })}>{t('保存', 'Save')}</button>
      </Sheet>}
      {edit === 'avatar' && <Sheet onClose={() => setEdit(null)}>
        <div className="center"><Avatar ch={ch || '早'} color={color} size={84} /></div>
        <div className="label">{t('头像上的字', 'Letter on the avatar')}</div>
        <label className="field"><input value={ch} maxLength={2} onChange={(e) => setCh(e.target.value.slice(0, 2))} /></label>
        <div className="row"><span className="label grow">{t('颜色', 'Color')}</span>{AVATAR_COLORS.map((c) => <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: cssVar(c) }} onClick={() => setColor(c)} />)}</div>
        <button className="btn primary" disabled={!ch.trim()} onClick={() => save({ avatar_char: ch.trim(), avatar_color: color })}>{t('保存', 'Save')}</button>
      </Sheet>}
      {edit === 'tz' && <Sheet onClose={() => setEdit(null)}>
        <div className="h2">{t('我的时区', 'My time zone')}</div>
        <div className="sub">{t('闹钟按这个时区响。小组 22:00 的结算时区在小组信息里改。', 'Your alarms ring in this time zone. The group\'s 10 PM close uses the group time zone (change it in group info).')}</div>
        <TzSelect value={tz} onChange={setTz} />
        <button className="btn primary" onClick={() => save({ timezone: tz })}>{t('保存', 'Save')}</button>
      </Sheet>}
    </div>
  );
}
