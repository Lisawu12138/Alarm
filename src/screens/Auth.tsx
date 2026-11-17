import { t } from '../i18n';
import { LangSwitch } from './Settings';
import { useState } from 'react';
import { api } from '../api';
import { PetSprite } from '../components/ui';
import { localTz } from '../lib/time';

export function AuthScreen() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [nick, setNick] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setErr('');
    if (!email.includes('@')) return setErr(t('邮箱格式不对', 'That email doesn\'t look right'));
    if (pw.length < 6) return setErr(t('密码至少 6 位', 'Password needs at least 6 characters'));
    if (mode === 'signup' && !nick.trim()) return setErr(t('起个昵称吧', 'Pick a nickname'));
    setBusy(true);
    try {
      if (mode === 'signup') {
        const r = await api.signUp(email.trim(), pw, nick.trim().slice(0, 10), localTz());
        if (r.needsConfirm) setSent(true);
      } else await api.signIn(email.trim(), pw);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="screen" style={{ gap: 18 }}>
      <div style={{ position: 'relative', height: 300, flex: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 230, height: 230, borderRadius: '50%', background: 'var(--sun)', right: -10, top: 10, opacity: 0.9 }} />
        <div style={{ position: 'absolute', width: 560, height: 200, borderRadius: '50%', background: 'var(--mint)', left: -110, top: 220 }} />
        <h1 className="serif" style={{ position: 'absolute', left: 0, top: 24, margin: 0, fontWeight: 300, fontStyle: 'italic', fontSize: 54, lineHeight: 1, color: 'var(--deep)', letterSpacing: '-.03em' }}>Project<br />Alarm</h1>
        <div style={{ position: 'absolute', left: 2, top: 150, fontWeight: 700, fontSize: 17, lineHeight: 1.6, color: 'var(--deep)', maxWidth: 200 }}>{t('和朋友一起早起，', 'Wake up with friends,')}<br />{t('一起养大一只小伙伴', 'raise a little buddy together')}</div>
        <div style={{ position: 'absolute', right: 26, top: 168 }} className="bob"><PetSprite species="frog" stage={3} height={96} /></div>
        <div style={{ position: 'absolute', left: 40, top: 250 }}><PetSprite species="frog" stage={1} height={34} /></div>
      </div>
      {sent ? (
        <div className="card pad col" style={{ gap: 8 }}>
          <div className="h3">{t('去邮箱点一下确认链接', 'Check your inbox and tap the confirmation link')}</div>
          <div className="sub">{t('确认后回到这里登录就行。', 'Then come back here and log in.')}</div>
          <button className="btn secondary sm" onClick={() => { setSent(false); setMode('login'); }}>{t('去登录', 'Go to log in')}</button>
        </div>
      ) : (
        <>
          <LangSwitch />
          <div className="seg">
            <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>{t('注册', 'Sign up')}</button>
            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>{t('登录', 'Log in')}</button>
          </div>
          {mode === 'signup' && <label className="field"><input placeholder={t('昵称（朋友看到的名字）', 'Nickname (what friends see)')} value={nick} maxLength={10} onChange={(e) => setNick(e.target.value)} /></label>}
          <label className="field"><input placeholder={t('邮箱', 'Email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field"><input placeholder={t('密码（至少 6 位）', 'Password (6+ characters)')} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn primary" disabled={busy} onClick={submit}>{mode === 'signup' ? t('开始', 'Get started') : t('登录', 'Log in')}</button>
        </>
      )}
    </div>
  );
}
