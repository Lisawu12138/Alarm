import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { ACCESSORIES, Accessory, Avatar, Icon, PET_COLORS, PetSprite, STAGE_AT, STAGE_NAME, Sheet, cssVar, stageOf } from '../components/ui';
import { Adopt } from './Adopt';
import { fmtClock, mdLabel } from '../lib/time';
import type { Feeding } from '../types';

const SPECIES_CN: Record<string, string> = { frog: '青蛙', cat: '猫', dog: '狗', otter: '水獭', bear: '熊', bunny: '兔子', bird: '鸟' };
const SPECIES_EN: Record<string, string> = { frog: 'frog', cat: 'cat', dog: 'dog', otter: 'otter', bear: 'bear', bunny: 'bunny', bird: 'bird' };

export function PetTab() {
  const { api, data, board, reload, reloadBoard, toast, member } = useApp();
  const [log, setLog] = useState<Feeding[]>([]);
  const [busy, setBusy] = useState(false);
  const [dress, setDress] = useState(false);
  const [again, setAgain] = useState(false);
  const pet = data.pet;
  const g = data.group!;
  useEffect(() => { api.feedings(7).then(setLog).catch(() => {}); }, [api, board?.fed_today, pet?.fed_days]);

  if (!pet) {
    const last = data.lastPet!;
    if (again) return <Adopt again />;
    return (
      <div className="screen with-tab" style={{ alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 240, height: 240, marginTop: 30 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--canvas)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 50, display: 'flex', justifyContent: 'center', opacity: 0.35, filter: 'grayscale(1)' }}>
            <PetSprite species={last.species} stage={stageOf(last.fed_days)} height={100} width={180} /></div>
        </div>
        <div className="h1">{t(`${last.name}离开了`, `${last.name} has left`)}</div>
        <div className="sub" style={{ lineHeight: 1.7 }}>{t('连续 3 天没吃到东西，它去找新的池塘了。', 'Three days without food — it went looking for a new pond.')}<br />{t(`你们一起把它喂到了第 ${last.fed_days} 天。`, `Together you fed it for ${last.fed_days} days.`)}</div>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setAgain(true)}>{t('再领养一只', 'Adopt another')}</button>
      </div>
    );
  }

  const stage = stageOf(pet.fed_days);
  const hunger = pet.hunger_days;
  const weak = hunger >= 2;
  const fed = board?.fed_today;
  const nextStage = stage < 3 ? ((stage + 1) as 2 | 3) : null;
  const toNext = nextStage ? STAGE_AT[nextStage] - pet.fed_days : 0;
  const pct = Math.min(1, pet.fed_days / STAGE_AT[3]);

  const feed = async () => {
    setBusy(true);
    try { await api.feedPet(); await Promise.all([reload(), reloadBoard()]); toast(t(`${pet.name}吃饱了，成长 +1 天`, `${pet.name} is full · +1 growth day`)); } catch (e) { toast((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="screen with-tab">
      <div className="row" style={{ gap: 10 }}>
        <div className="grow">
          <div className="row" style={{ gap: 8 }}><span className="h1" style={{ fontSize: 28 }}>{pet.name}</span><span className="pill mint" style={{ padding: '3px 10px', fontSize: 12 }}>{STAGE_NAME[stage]}</span></div>
          <div className="sub">{t(`${g.name}一起养的小${SPECIES_CN[pet.species]}`, `${g.name}'s shared ${SPECIES_EN[pet.species]}`)}</div>
        </div>
        <button className="pill line" onClick={() => setDress(true)}><Icon name="leaf" size={16} />{t('装扮', 'Dress up')}</button>
      </div>

      <div style={{ position: 'relative', height: 220, borderRadius: 32, overflow: 'hidden', background: weak ? 'var(--canvas)' : 'var(--soft)', flex: 'none' }}>
        <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: weak ? 'var(--darkMuted)' : 'var(--sun)', opacity: weak ? 0.5 : 0.8, right: -10, top: -40 }} />
        <div style={{ position: 'absolute', width: 560, height: 180, borderRadius: '50%', background: weak ? 'var(--darkMuted)' : cssVar(pet.color === 'soft' ? 'mint' : pet.color), left: -85, top: 150 }} />
        <div style={{ position: 'absolute', width: 170, height: 46, borderRadius: '50%', background: 'var(--green)', opacity: weak ? 0.35 : 0.85, left: 'calc(50% - 85px)', top: 156 }} />
        <div className={weak ? '' : 'bob'} style={{ position: 'absolute', left: 0, right: 0, bottom: 38, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', opacity: weak ? 0.6 : 1, filter: weak ? 'grayscale(.6)' : undefined }}>
            <PetSprite species={pet.species} stage={stage} height={weak ? 104 : 124} width={210} />
            {pet.accessory !== 'none' && <div style={{ position: 'absolute', top: pet.accessory === 'leaf' ? -18 : '55%', left: pet.accessory === 'leaf' ? '56%' : '50%', transform: pet.accessory === 'leaf' ? undefined : 'translateX(-50%)' }}><Accessory kind={pet.accessory} size={34} /></div>}
          </div>
        </div>
        <span className="pill" style={{ position: 'absolute', left: 14, top: 14, background: hunger ? 'var(--danger)' : 'var(--white)', color: hunger ? 'var(--paper)' : 'var(--deep)', fontWeight: 700, fontSize: 12 }}>
          <Icon name="heart" size={14} color={hunger ? 'var(--paper)' : 'var(--orange)'} />{hunger === 0 ? (fed ? t('吃饱了', 'Full') : t('今天还没吃', 'Not fed yet today')) : hunger === 1 ? t('饿了 · 1 天没吃', 'Hungry · 1 day without food') : t('虚弱 · 2 天没吃', 'Weak · 2 days without food')}</span>
      </div>

      <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
        <div className="card pad col grow" style={{ gap: 10 }}>
          <span className="cap" style={{ fontWeight: 500 }}>{t('饥饿', 'Hunger')}</span>
          <div className="row" style={{ gap: 4 }}>{[0, 1, 2].map((l, i) => <div key={l} style={{ flex: 1, height: 8, borderRadius: 4, background: i === Math.min(2, hunger) ? (hunger ? 'var(--danger)' : 'var(--green)') : 'var(--soft)' }} />)}</div>
          <div className="row" style={{ gap: 4 }}>{[t('饱足', 'Full'), t('饥饿', 'Hungry'), t('虚弱', 'Weak')].map((l, i) => <span key={l} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: i === Math.min(2, hunger) ? 700 : 400, color: i === Math.min(2, hunger) ? (hunger ? 'var(--danger)' : 'var(--green)') : 'var(--muted)' }}>{l}</span>)}</div>
        </div>
        <div className="card pad col grow" style={{ gap: 2 }}>
          <span className="cap" style={{ fontWeight: 500 }}>{t('共享库存', 'Pantry')}</span>
          <div className="row" style={{ gap: 6, alignItems: 'baseline' }}><span className="num" style={{ fontSize: 34, fontWeight: 600, color: 'var(--deep)', lineHeight: 1.1 }}>{g.food_stock}</span><span className="cap">{t('份', 'meals')}</span></div>
          <div className="row" style={{ gap: 3 }}>{Array.from({ length: Math.max(3, Math.min(6, g.food_stock)) }).map((_, i) => <Icon key={i} name="bowl" size={14} color={i < g.food_stock ? 'var(--green)' : 'var(--line)'} />)}</div>
        </div>
      </div>

      <div className="card pad col" style={{ gap: 12 }}>
        <div className="row"><span className="h3 grow">{t('成长', 'Growth')}</span><span className="cap" style={{ fontWeight: 500 }}>{nextStage ? t(`再喂 ${toNext} 天${nextStage === 3 ? '长大' : '进入成长期'}`, `${toNext} more day${toNext === 1 ? '' : 's'} to ${nextStage === 3 ? 'grow up' : 'the juvenile stage'}`) : t('已经长大啦', 'All grown up!')}</span></div>
        <div className="row" style={{ gap: 0 }}>
          {([1, 2, 3] as const).map((s, i) => (
            <div key={s} className="row" style={{ flex: s === 1 ? 'none' : 1, gap: 0 }}>
              {i > 0 && <div style={{ flex: 1, height: 3, borderRadius: 2, background: stage >= s ? 'var(--green)' : 'var(--line)' }} />}
              <div className="col" style={{ alignItems: 'center', gap: 6 }}>
                <div className="center" style={{ width: 62, height: 62, borderRadius: 999, background: s === stage ? 'var(--mint)' : 'var(--soft)', border: s === stage ? '2px solid var(--green)' : 0, opacity: s > stage ? 0.4 : 1 }}>
                  <PetSprite species={pet.species} stage={s} height={36} width={46} /></div>
                <span style={{ fontSize: 12, fontWeight: s === stage ? 700 : 500, color: s === stage ? 'var(--green)' : 'var(--muted)' }}>{STAGE_NAME[s]}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--soft)' }}><div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, background: 'var(--green)' }} /></div>
        <div className="row" style={{ justifyContent: 'space-between' }}><span className="cap" style={{ color: 'var(--green)', fontWeight: 500 }}>{t(`已成功喂养 ${pet.fed_days} 天`, `Fed for ${pet.fed_days} day${pet.fed_days === 1 ? '' : 's'}`)}</span><span className="cap">{t(`${STAGE_AT[3]} 天长大`, `grown up at ${STAGE_AT[3]}`)}</span></div>
      </div>

      {hunger > 0 && !fed && (
        <div className="row" style={{ background: 'var(--peach)', borderRadius: 18, padding: '10px 14px', gap: 8 }}>
          <Icon name="info" size={16} color="var(--danger)" /><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
            {weak ? t(`明晚 22:00 前还不喂，${pet.name}就会离开`, `If nobody feeds ${pet.name} by 10 PM tomorrow, it will leave`) : t(`${pet.name}饿了一天，连续 3 天不喂就会离开`, `${pet.name} is hungry — after 3 days without food it will leave`)}</span>
        </div>
      )}

      {fed ? (
        <div className="row" style={{ background: 'var(--deep)', borderRadius: 22, padding: '12px 14px', gap: 12 }}>
          {(() => { const p = member(fed.user_id); return p ? <Avatar ch={p.avatar_char} color={p.avatar_color} size={38} /> : null; })()}
          <span className="grow"><div style={{ color: 'var(--paper)', fontWeight: 700, fontSize: 14 }}>{t(`${member(fed.user_id)?.nickname || '有人'} ${fmtClock(fed.fed_at)} 喂了一份`, `${member(fed.user_id)?.nickname || 'Someone'} fed it at ${fmtClock(fed.fed_at)}`)}</div>
            <div className="cap" style={{ color: 'var(--darkMuted)' }}>{t('今天喂过了 · 成长 +1 天', 'Fed today · +1 growth day')}</div></span>
          <span className="center" style={{ background: 'var(--green)', borderRadius: 999, width: 30, height: 30 }}><Icon name="check" size={16} color="var(--paper)" /></span>
        </div>
      ) : (
        <>
          <button className={`btn ${hunger ? 'accent' : 'primary'}`} disabled={busy || g.food_stock <= 0} onClick={feed}><Icon name="bowl" size={18} />{t(`喂${pet.name}一份`, `Feed ${pet.name}`)}</button>
          {g.food_stock <= 0 && <div className="cap tc">{t('库存空了 · 全组都完成起床挑战就会发一份', 'The pantry is empty · it gets one when everyone finishes their wake-up challenge')}</div>}
        </>
      )}

      {log.length > 0 && (
        <div className="col" style={{ gap: 8 }}>
          <div className="label" style={{ padding: '4px 4px 0' }}>{t('喂养记录', 'Feeding log')}</div>
          <div className="card list">
            {log.map((f) => { const p = member(f.user_id); const d = new Date(f.fed_at); return (
              <div key={f.id} className="list-row" style={{ padding: '10px 16px' }}>
                {p ? <Avatar ch={p.avatar_char} color={p.avatar_color} size={28} /> : <span style={{ width: 28 }} />}
                <span className="grow" style={{ fontSize: 14 }}>{t(`${p?.nickname || '已退出的成员'} 喂了一份`, `${p?.nickname || 'A former member'} fed it`)}</span>
                <span className="cap">{mdLabel(d.getMonth() + 1, d.getDate())} {fmtClock(f.fed_at)}</span>
              </div>); })}
          </div>
        </div>
      )}
      {dress && <DressUp onClose={() => setDress(false)} />}
    </div>
  );
}

function DressUp({ onClose }: { onClose: () => void }) {
  const { api, data, reload, toast } = useApp();
  const pet = data.pet!;
  const [color, setColor] = useState(pet.color);
  const [acc, setAcc] = useState(pet.accessory);
  const save = async () => {
    try {
      await api.updatePet({ color, accessory: acc });
      await reload(); onClose();
    } catch (e) { toast((e as Error).message); }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="h2">{t(`给${pet.name}装扮`, `Dress up ${pet.name}`)}</div>
      <div className="row"><div className="label grow">{t('颜色', 'Color')}</div>{PET_COLORS.map((c) => <button key={c} className={`swatch ${color === c ? 'on' : ''}`} style={{ background: cssVar(c) }} onClick={() => setColor(c)} />)}</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {ACCESSORIES.map((a) => <button key={a.id} className="pill" onClick={() => setAcc(a.id)} style={acc === a.id ? { background: 'var(--deep)', color: 'var(--paper)', fontWeight: 700 } : { background: 'var(--white)', border: '1px solid var(--line)' }}>
          {a.id !== 'none' && <Accessory kind={a.id} size={16} />}{a.name}</button>)}
      </div>
      <button className="btn primary" onClick={save}>{t('保存', 'Save')}</button>
    </Sheet>
  );
}
