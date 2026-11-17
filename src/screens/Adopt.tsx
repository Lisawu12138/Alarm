import { useState } from 'react';
import { useApp } from '../store';
import { ACCESSORIES, Accessory, PET_COLORS, PetSprite, PetStage, SPECIES, cssVar } from '../components/ui';
import type { ColorName, Species } from '../types';

export function Adopt({ again }: { again?: boolean }) {
  const { api, data, reload, toast } = useApp();
  const [sp, setSp] = useState<Species>('frog');
  const [name, setName] = useState('');
  const [color, setColor] = useState<ColorName>('mint');
  const [acc, setAcc] = useState('none');
  const [busy, setBusy] = useState(false);
  const n = data.members.length;

  const adopt = async () => {
    setBusy(true);
    try { await api.adoptPet(sp, name.trim(), color, acc); await reload(); toast(`欢迎 ${name.trim()}！`); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className={`screen ${again ? 'with-tab' : ''}`} style={{ gap: 14 }}>
      <div><div className="h1">{again ? '再领养一只伙伴' : '领养一只伙伴'}</div><div className="sub">全组共养这一只，大家看到的都是它</div></div>
      <div className="center"><PetStage species={sp} stage={1} color={color} accessory={acc} size={190} petHeight={80} /></div>
      <div className="species">
        {SPECIES.map((s) => (
          <button key={s.id} className={sp === s.id ? 'on' : ''} onClick={() => setSp(s.id)}>
            <PetSprite species={s.id} stage={1} height={30} width={40} />{s.name}
          </button>
        ))}
      </div>
      <div className="col" style={{ gap: 8 }}><div className="label">名字</div>
        <label className="field"><input value={name} maxLength={12} placeholder="比如：豆豆" onChange={(e) => setName(e.target.value)} /></label></div>
      <div className="row"><div className="label grow">颜色</div>
        {PET_COLORS.map((c) => <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: cssVar(c) }} onClick={() => setColor(c)} aria-label={c} />)}</div>
      <div className="col" style={{ gap: 8 }}><div className="label">配饰</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {ACCESSORIES.map((a) => (
            <button key={a.id} className="pill" onClick={() => setAcc(a.id)}
              style={acc === a.id ? { background: 'var(--deep)', color: 'var(--paper)', fontWeight: 700 } : { background: 'var(--white)', border: '1px solid var(--line)' }}>
              {a.id !== 'none' && <Accessory kind={a.id} size={16} />}{a.name}
            </button>
          ))}
        </div></div>
      <div className="spacer" />
      <button className="btn primary" disabled={!name.trim() || busy} onClick={adopt}>一起领养{name.trim() || ''}</button>
      <div className="cap tc">小组 {n} 位成员都会看到它</div>
    </div>
  );
}
