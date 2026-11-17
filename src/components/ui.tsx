import React from 'react';
import type { ColorName, Species } from '../types';
import meta from '../lib/spriteMeta.json';
import { t } from '../i18n';

const PATHS: Record<string, string> = {
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 18 6-6-6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>',
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  vibrate: '<path d="m2 8 2 2-2 2 2 2-2 2"/><path d="m22 8-2 2 2 2-2 2 2 2"/><rect width="8" height="14" x="8" y="5" rx="1"/>',
  redo: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  volume: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
  bowl: '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62"/><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  shuffle: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
};

export function Icon({ name, size = 20, color = 'currentColor', style }: { name: keyof typeof PATHS | string; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none', color, ...style }} dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }} />
  );
}

export const cssVar = (c: string) => `var(--${c})`;

export function Avatar({ ch, color, size = 44, ring, ringColor = 'white' }: { ch: string; color: ColorName | string; size?: number; ring?: number; ringColor?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 999, background: cssVar(color), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      fontWeight: 700, fontSize: size * 0.42, color: 'var(--deep)', boxShadow: ring ? `0 0 0 ${ring}px ${cssVar(ringColor)}` : undefined }}>
      {ch}
    </div>
  );
}

export function stageOf(fedDays: number): 1 | 2 | 3 { return fedDays >= 14 ? 3 : fedDays >= 5 ? 2 : 1; }
export const STAGE_NAME = { get 1() { return t('幼年', 'Baby'); }, get 2() { return t('成长期', 'Juvenile'); }, get 3() { return t('成年', 'Grown-up'); } } as Record<1 | 2 | 3, string>;
export const STAGE_AT = { 1: 0, 2: 5, 3: 14 } as const;
export const SPECIES: { id: Species; name: string }[] = [
  { id: 'frog', get name() { return t('青蛙', 'Frog'); } }, { id: 'cat', get name() { return t('猫', 'Cat'); } },
  { id: 'dog', get name() { return t('狗', 'Dog'); } }, { id: 'otter', get name() { return t('水獭', 'Otter'); } },
  { id: 'bear', get name() { return t('熊', 'Bear'); } }, { id: 'bunny', get name() { return t('兔', 'Bunny'); } },
  { id: 'bird', get name() { return t('鸟', 'Bird'); } },
];

/** Sprite drawn at a shared scale: `scale` px per source px (0.75-sized webp). */
export function PetSprite({ species, stage, height, width, scale, style, className }: { species: Species; stage: 1 | 2 | 3; height?: number; width?: number; scale?: number; style?: React.CSSProperties; className?: string }) {
  const [w, h] = (meta as Record<string, number[]>)[`${species}_${stage}`] || [100, 100];
  let W = w, H = h;
  if (scale) { W = w * scale; H = h * scale; }
  else if (height && width) { const s = Math.min(width / w, height / h); W = w * s; H = h * s; }
  else if (height) { H = height; W = (w * height) / h; }
  else if (width) { W = width; H = (h * width) / w; }
  return <img className={className} src={`/sprites/${species}_${stage}.webp`} alt="" draggable={false} style={{ width: W, height: H, display: 'block', ...style }} />;
}

export function Accessory({ kind, size = 28 }: { kind: string; size?: number }) {
  if (kind === 'leaf') return <Icon name="leaf" size={size} color="var(--green)" style={{ transform: 'rotate(-20deg)' }} />;
  if (kind === 'scarf') return <svg width={size} height={size * 0.6} viewBox="0 0 40 24"><path d="M2 6c10 6 26 6 36 0v8c-10 6-26 6-36 0z" fill="var(--orange)" stroke="var(--deep)" strokeWidth="1.5" /><path d="M26 12l4 11 5-2-3-10" fill="var(--orange)" stroke="var(--deep)" strokeWidth="1.5" /></svg>;
  if (kind === 'bow') return <svg width={size} height={size * 0.6} viewBox="0 0 40 24"><path d="M20 12 4 3v18zM20 12l16-9v18z" fill="var(--peach)" stroke="var(--deep)" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="20" cy="12" r="4" fill="var(--orange)" stroke="var(--deep)" strokeWidth="1.5" /></svg>;
  return null;
}
export const ACCESSORIES = [
  { id: 'none', get name() { return t('无', 'None'); } }, { id: 'leaf', get name() { return t('叶子帽', 'Leaf hat'); } },
  { id: 'scarf', get name() { return t('小围巾', 'Scarf'); } }, { id: 'bow', get name() { return t('领结', 'Bow tie'); } },
];
export const PET_COLORS: ColorName[] = ['mint', 'sun', 'peach', 'soft', 'darkMuted'];
export const AVATAR_COLORS: ColorName[] = ['sun', 'peach', 'mint', 'darkMuted', 'orange'];

/** Pet with backdrop, accessory placed above head */
export function PetStage({ species, stage, color, accessory, size = 190, petHeight, dim }: { species: Species; stage: 1 | 2 | 3; color: string; accessory: string; size?: number; petHeight?: number; dim?: boolean }) {
  const ph = petHeight ?? size * 0.5;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: cssVar(color), opacity: dim ? 0.5 : 1 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: size * 0.2, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', opacity: dim ? 0.6 : 1, filter: dim ? 'grayscale(.5)' : undefined }} className={dim ? '' : 'bob'}>
          <PetSprite species={species} stage={stage} height={ph} width={size * 0.78} />
          {accessory !== 'none' && (
            <div style={{ position: 'absolute', top: accessory === 'leaf' ? -ph * 0.18 : '52%', left: accessory === 'leaf' ? '55%' : '50%', transform: accessory === 'leaf' ? undefined : 'translateX(-50%)' }}>
              <Accessory kind={accessory} size={Math.max(22, ph * 0.3)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TabBar({ tab, onTab }: { tab: string; onTab: (t: 'group' | 'alarm' | 'pet') => void }) {
  const items: ['group' | 'alarm' | 'pet', string, string][] = [['group', t('小组', 'Group'), 'users'], ['alarm', t('闹钟', 'Alarm'), 'alarm'], ['pet', t('宠物', 'Buddy'), 'paw']];
  return (
    <nav className="tabbar">
      {items.map(([id, label, ic]) => (
        <button key={id} className={`tab ${tab === id ? 'on' : ''}`} onClick={() => onTab(id)}>
          <span className="pillbg"><Icon name={ic} size={22} color={tab === id ? 'var(--green)' : 'var(--muted)'} /></span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        {children}
      </div>
    </div>
  );
}

export function Dialog({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="overlay centered" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Wave({ bars = 22, color = 'var(--green)', level, seed = 1, height = 30 }: { bars?: number; color?: string; level?: number; seed?: number; height?: number }) {
  const hs = Array.from({ length: bars }, (_, i) => {
    const x = Math.sin((i + 1) * 12.9898 * seed) * 43758.5453;
    const r = x - Math.floor(x);
    const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.55 + seed)) * (0.6 + 0.4 * r);
    return Math.max(3, base * height * (level === undefined ? 1 : 0.3 + level * 1.4));
  });
  return <div className="wave">{hs.map((h, i) => <i key={i} style={{ height: Math.min(height, h), background: color }} />)}</div>;
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="seg">{options.map(([v, l]) => <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on} />;
}

export function BackHeader({ title, sub, onBack, right }: { title: string; sub?: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      <button className="icon-btn" onClick={onBack} aria-label="back"><Icon name="chevLeft" size={18} /></button>
      <div className="grow"><div className="h2">{title}</div>{sub && <div className="cap">{sub}</div>}</div>
      {right}
    </div>
  );
}

/** Donut segments; one per participant */
export function SegRing({ size, segments, thickness = 0.13 }: { size: number; segments: { color: string; opacity?: number }[]; thickness?: number }) {
  const n = Math.max(1, segments.length);
  const r = size / 2, w = size * thickness, rm = r - w / 2;
  const gap = n > 1 ? 0.16 : 0;
  const arcs = (n === 0 ? [{ color: 'var(--line)' }] : segments).map((s, i) => {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n + gap / 2;
    const a1 = a0 + (2 * Math.PI) / n - gap;
    if (n === 1) return <circle key={i} cx={r} cy={r} r={rm} fill="none" stroke={s.color} strokeOpacity={s.opacity ?? 1} strokeWidth={w} />;
    const p = (a: number) => `${r + rm * Math.cos(a)} ${r + rm * Math.sin(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return <path key={i} d={`M ${p(a0)} A ${rm} ${rm} 0 ${large} 1 ${p(a1)}`} fill="none" stroke={s.color} strokeOpacity={s.opacity ?? 1} strokeWidth={w} strokeLinecap="round" />;
  });
  return <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>{arcs}</svg>;
}

export function ProgressArc({ size, pct, color, track, thickness = 0.1 }: { size: number; pct: number; color: string; track: string; thickness?: number }) {
  const r = size / 2, w = size * thickness, rm = r - w / 2, c = 2 * Math.PI * rm;
  return (
    <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
      <circle cx={r} cy={r} r={rm} fill="none" stroke={track} strokeWidth={w} />
      <circle cx={r} cy={r} r={rm} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${c * Math.max(0, Math.min(1, pct))} ${c}`} style={{ transition: 'stroke-dasharray .15s linear' }} />
    </svg>
  );
}
