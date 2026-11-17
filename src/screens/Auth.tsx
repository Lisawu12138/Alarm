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
    if (!email.includes('@')) return setErr('邮箱格式不对');
    if (pw.length < 6) return setErr('密码至少 6 位');
    if (mode === 'signup' && !nick.trim()) return setErr('起个昵称吧');
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
        <div style={{ position: 'absolute', left: 2, top: 150, fontWeight: 700, fontSize: 17, lineHeight: 1.6, color: 'var(--deep)' }}>和朋友一起早起，<br />一起养大一只小伙伴</div>
        <div style={{ position: 'absolute', right: 26, top: 168 }} className="bob"><PetSprite species="frog" stage={3} height={96} /></div>
        <div style={{ position: 'absolute', left: 40, top: 250 }}><PetSprite species="frog" stage={1} height={34} /></div>
      </div>
      {sent ? (
        <div className="card pad col" style={{ gap: 8 }}>
          <div className="h3">去邮箱点一下确认链接</div>
          <div className="sub">确认后回到这里登录就行。</div>
          <button className="btn secondary sm" onClick={() => { setSent(false); setMode('login'); }}>去登录</button>
        </div>
      ) : (
        <>
          <div className="seg">
            <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>注册</button>
            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>登录</button>
          </div>
          {mode === 'signup' && <label className="field"><input placeholder="昵称（朋友看到的名字）" value={nick} maxLength={10} onChange={(e) => setNick(e.target.value)} /></label>}
          <label className="field"><input placeholder="邮箱" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field"><input placeholder="密码（至少 6 位）" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} /></label>
          {err && <div className="err">{err}</div>}
          <button className="btn primary" disabled={busy} onClick={submit}>{mode === 'signup' ? '开始' : '登录'}</button>
        </>
      )}
    </div>
  );
}
