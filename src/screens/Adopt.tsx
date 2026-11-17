import { t } from '../i18n';
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
    try { await api.adoptPet(sp, name.trim(), color, acc); await reload(); toast(t(`欢迎 ${name.trim()}！`, `Welcome, ${name.trim()}!`)); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className={`screen ${again ? 'with-tab' : ''}`} style={{ gap: 14 }}>
      <div><div className="h1">{again ? t('再领养一只伙伴', 'Adopt another buddy') : t('领养一只伙伴', 'Adopt a buddy')}</div><div className="sub">{t('全组共养这一只，大家看到的都是它', 'The whole group raises this one together')}</div></div>
      <div className="center"><PetStage species={sp} stage={1} color={color} accessory={acc} size={190} petHeight={80} /></div>
      <div className="species">
        {SPECIES.map((s) => (
          <button key={s.id} className={sp === s.id ? 'on' : ''} onClick={() => setSp(s.id)}>
            <PetSprite species={s.id} stage={1} height={30} width={40} />{s.name}
          </button>
        ))}
      </div>
      <div className="col" style={{ gap: 8 }}><div className="label">{t('名字', 'Name')}</div>
        <label className="field"><input value={name} maxLength={12} placeholder={t('比如：豆豆', 'e.g. Bean')} onChange={(e) => setName(e.target.value)} /></label></div>
      <div className="row"><div className="label grow">{t('颜色', 'Color')}</div>
        {PET_COLORS.map((c) => <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: cssVar(c) }} onClick={() => setColor(c)} aria-label={c} />)}</div>
      <div className="col" style={{ gap: 8 }}><div className="label">{t('配饰', 'Accessory')}</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {ACCESSORIES.map((a) => (
            <button key={a.id} className="pill" onClick={() => setAcc(a.id)}
              style={acc === a.id ? { background: 'var(--deep)', color: 'var(--paper)', fontWeight: 700 } : { background: 'var(--white)', border: '1px solid var(--line)' }}>
              {a.id !== 'none' && <Accessory kind={a.id} size={16} />}{a.name}
            </button>
          ))}
        </div></div>
      <div className="spacer" />
      <button className="btn primary" disabled={!name.trim() || busy} onClick={adopt}>{t(`一起领养${name.trim()}`, name.trim() ? `Adopt ${name.trim()} together` : 'Adopt together')}</button>
      <div className="cap tc">{t(`小组 ${n} 位成员都会看到它`, `All ${n} group members will see it`)}</div>
    </div>
  );
}
