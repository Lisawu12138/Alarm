// Native port of the original Momo art from mockup-sandbox project-alarm/_shared/Kit.tsx.
import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/components/UI';
import type { AvatarKind, Profile } from '@/lib/model';

// Illustration palette (art data, kept identical to the original SVG).
const A = {
  skinHi: '#d9eb9e', skin: '#b7d77b', outline: '#75964e', belly: '#fff3cd', eyeRing: '#c4df8b', eyeWhite: '#fffdf1',
  pupil: '#263f2a', glint: '#fffdf6', sleepLine: '#355332', cheek: '#efac94', mouth: '#3f5c33', tongue: '#e8977a',
  nostril: '#708e4b', scarfLine: '#d3732d', scarf1: '#f28a3c', scarf2: '#f17c31', scarf3: '#f69a47',
  cushionA: '#f8d66b', cushionB: '#eab144', cushionLine: '#d5a744', cushionHi: '#ffe8a0', shadow: '#c6ae69',
  petal: '#ffe4a5', petalLine: '#dfbe6f', flowerCore: '#ed9c3e', glasses: '#5f6c3b', toe: '#7f9e54',
  phone: '#577448', phoneLine: '#365734', screen: '#fff2c8', phoneBtn: '#e1e7c7', spark: '#d4ac55', zz: '#8ba36e',
};
export type Pose = 'awake' | 'sleep' | 'shake' | 'happy' | 'fed';
export const avatarSkin: Record<AvatarKind, string> = { scarf: '#b7d77b', flower: '#b8ce8c', glasses: '#9cbe7e' };

function PetG({ pose = 'awake', color = A.skin, accessory = 'scarf', id }: { pose?: Pose; color?: string; accessory?: string; id: string }) {
  const sleep = pose === 'sleep';
  const happy = pose === 'happy' || pose === 'fed';
  return (
    <G>
      <Defs>
        <RadialGradient id={`${id}skin`} cx="35%" cy="20%" r="80%"><Stop offset="0" stopColor={A.skinHi} /><Stop offset="1" stopColor={color} /></RadialGradient>
        <LinearGradient id={`${id}cushion`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={A.cushionA} /><Stop offset="1" stopColor={A.cushionB} /></LinearGradient>
      </Defs>
      <Ellipse cx="139" cy="239" rx="99" ry="11" fill={A.shadow} fillOpacity={0.13} />
      <Path d="M44 218Q40 201 62 196Q139 182 218 199Q242 207 233 222Q228 240 139 241Q54 241 44 218Z" fill={`url(#${id}cushion)`} stroke={A.cushionLine} strokeWidth={2} />
      <Path d="M52 216Q136 234 225 216" fill="none" stroke={A.cushionHi} strokeWidth={3} strokeLinecap="round" />
      <G stroke={A.outline} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
        <Path d="M83 191Q53 183 54 211Q48 221 67 224L102 216" fill={color} />
        <Path d="M194 191Q222 182 224 210Q234 221 215 224L180 216" fill={color} />
        <Path d="M74 123Q65 80 88 66Q104 53 124 70Q142 64 158 70Q181 51 200 68Q216 85 205 121Q230 158 210 195Q192 220 140 219Q87 221 68 196Q50 159 74 123Z" fill={`url(#${id}skin)`} />
        <Ellipse cx="139" cy="174" rx="51" ry="43" fill={A.belly} stroke="none" />
        <Path d="M81 139Q54 139 63 167Q68 179 82 172" fill={color} />
        <Path d="M198 139Q225 138 217 164Q212 178 198 171" fill={color} />
        <Ellipse cx="101" cy="91" rx="23" ry="27" fill={A.eyeRing} />
        <Ellipse cx="180" cy="91" rx="23" ry="27" fill={A.eyeRing} />
      </G>
      <Ellipse cx="101" cy="91" rx="16.5" ry="20" fill={A.eyeWhite} />
      <Ellipse cx="180" cy="91" rx="16.5" ry="20" fill={A.eyeWhite} />
      {sleep ? (
        <Path d="M89 93Q101 104 113 93M168 93Q180 104 192 93" fill="none" stroke={A.sleepLine} strokeWidth={3.3} strokeLinecap="round" />
      ) : (
        <G>
          <Ellipse cx="104" cy="93" rx="8" ry="12" fill={A.pupil} />
          <Ellipse cx="177" cy="93" rx="8" ry="12" fill={A.pupil} />
          <Circle cx="107" cy="88" r="3.5" fill={A.glint} />
          <Circle cx="180" cy="88" r="3.5" fill={A.glint} />
        </G>
      )}
      <Ellipse cx="84" cy="123" rx="15" ry="8" fill={A.cheek} opacity={0.8} />
      <Ellipse cx="197" cy="123" rx="15" ry="8" fill={A.cheek} opacity={0.8} />
      <Path d={happy ? 'M119 123Q140 149 161 123Q140 139 119 123Z' : 'M123 125Q141 139 158 125'} fill={happy ? A.tongue : 'none'} stroke={A.mouth} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx="134" cy="116" r="1.5" fill={A.nostril} />
      <Circle cx="146" cy="116" r="1.5" fill={A.nostril} />
      <G stroke={A.scarfLine} strokeWidth={1.6} strokeLinejoin="round">
        <Path d="M91 143Q138 157 188 142L177 157Q141 169 102 157Z" fill={A.scarf1} />
        <Path d="M126 156L147 184L168 156Q146 162 126 156Z" fill={A.scarf2} />
        <Path d="M170 149L189 164L180 172L163 157" fill={A.scarf3} />
      </G>
      {accessory === 'flower' && (
        <G transform="translate(197 65)">
          <G fill={A.petal} stroke={A.petalLine} strokeWidth={1}>
            <Ellipse cx="0" cy="-8" rx="6" ry="9" /><Ellipse cx="8" cy="0" rx="9" ry="6" />
            <Ellipse cx="0" cy="8" rx="6" ry="9" /><Ellipse cx="-8" cy="0" rx="9" ry="6" />
          </G>
          <Circle cx="0" cy="0" r="5" fill={A.flowerCore} />
        </G>
      )}
      {accessory === 'glasses' && (
        <G stroke={A.glasses} strokeWidth={2.8} fill="none">
          <Circle cx="101" cy="94" r="23" /><Circle cx="180" cy="94" r="23" /><Path d="M124 93Q140 85 157 93" />
        </G>
      )}
      <Path d="M69 215l7-5m-1 10 7-6m130 1-6-5m-1 10-6-6" fill="none" stroke={A.toe} strokeWidth={1.5} strokeLinecap="round" />
      {pose === 'shake' && (
        <G transform="rotate(-12 191 178)">
          <Rect x="171" y="139" width="38" height="63" rx="7" fill={A.phone} stroke={A.phoneLine} strokeWidth={2} />
          <Rect x="175" y="145" width="30" height="45" rx="3" fill={A.screen} />
          <Path d="M185 197h10" stroke={A.phoneBtn} strokeWidth={2} strokeLinecap="round" />
          <Path d="M174 165q-13-4-14 6t15 7" fill={color} stroke={A.outline} strokeWidth={2} />
          <Path d="M219 142l6-4m-6 12 9-1M165 136l-5-6" stroke={A.spark} strokeWidth={2} strokeLinecap="round" />
        </G>
      )}
      {sleep && <Path d="M221 66h11l-11 12h11M238 43h15l-15 16h15" stroke={A.zz} strokeWidth={2.4} fill="none" strokeLinecap="round" />}
    </G>
  );
}

export function Pet({ pose = 'awake', color, accessory = 'scarf', size = 200, label }: { pose?: Pose; color?: string; accessory?: string; size?: number; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <View accessible={!!label} accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size * 260 / 280 }}>
      <Svg width="100%" height="100%" viewBox="0 0 280 260"><PetG pose={pose} color={color} accessory={accessory} id={id} /></Svg>
    </View>
  );
}

export function ProfileAvatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const c = useColors();
  const bg = profile.avatar === 'flower' ? c.avatarPeach : profile.avatar === 'glasses' ? c.avatarSage : c.avatarSand;
  const art = size * 1.3;
  return (
    <View accessibilityRole="image" accessibilityLabel={profile.nickname}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Pet pose="happy" accessory={profile.avatar} color={avatarSkin[profile.avatar]} size={art} />
    </View>
  );
}

export function LetterAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const c = useColors();
  const isA = name === 'Ailun';
  return (
    <View accessibilityRole="image" accessibilityLabel={name}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: isA ? c.accentSoft : c.secondary }}>
      <Text style={{ fontFamily: fonts.black, fontSize: size * 0.42, color: isA ? c.accentText : c.primaryDeep }}>{name[0]}</Text>
    </View>
  );
}

function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 4V-52M0-20Q-20-28-23-40M0-34Q17-45 21-58" stroke="#7f9a57" strokeWidth={2} fill="none" />
      <G fill="#8ba95e">
        <Ellipse cx="-15" cy="-32" rx="7" ry="14" transform="rotate(-48 -15 -32)" />
        <Ellipse cx="13" cy="-48" rx="7" ry="15" transform="rotate(41 13 -48)" />
        <Ellipse cx="-2" cy="-58" rx="7" ry="13" transform="rotate(-9 -2 -58)" />
        <Ellipse cx="11" cy="-20" rx="6" ry="12" transform="rotate(44 11 -20)" />
      </G>
      <Path d="M-19 0H20L15 34Q0 40-14 34Z" fill="#e7bc80" stroke="#d3a56b" strokeWidth={1.5} />
      <Path d="M-20 0h41v7h-41Z" fill="#edce9f" />
    </G>
  );
}
const leaves = [[18, 15, -30], [17, 39, 35], [28, 61, -30], [37, 84, 40], [34, 105, -30], [280, 15, 40], [283, 36, -30], [294, 57, 40], [295, 78, -35], [291, 97, 40], [333, 20, 35], [335, 42, -30]];

export function Room({ pose = 'awake', speech, bowlFull = false, label, style }: { pose?: Pose; speech?: string; bowlFull?: boolean; label: string; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pid = id + 'p';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${label}${speech ? ` · ${speech}` : ''}`} style={[styles.room, { backgroundColor: c.card, borderColor: c.border }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 380 260" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#f8e6b3" /><Stop offset="1" stopColor="#fff3cf" /></LinearGradient>
          <LinearGradient id={`${id}floor`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#f6e9ce" /><Stop offset="1" stopColor="#fff7e5" /></LinearGradient>
          <ClipPath id={`${id}window`}><Rect x="44" y="20" width="110" height="124" rx="40" /></ClipPath>
        </Defs>
        <Path d="M0 0H380V201Q181 174 0 202Z" fill="#fff9ec" />
        <Path d="M0 196Q185 174 380 197V260H0Z" fill={`url(#${id}floor)`} />
        <Path d="M0 224H380M0 250H380M79 224v26m156-26v26M140 198v26m174-26v26" stroke="#dfc99c" strokeWidth={1} opacity={0.35} />
        <Rect x="36" y="10" width="126" height="143" rx="47" fill="#d9b57f" stroke="#caa573" strokeWidth={2} />
        <G clipPath={`url(#${id}window)`}>
          <Rect x="44" y="20" width="110" height="124" fill={`url(#${id}sky)`} />
          <Circle cx="103" cy="107" r="29" fill="#f5c45e" />
          <Path d="M30 132Q63 111 90 131T162 124V151H30" fill="#dce1a9" />
          <Path d="M25 141Q71 121 110 142T165 135V160H25" fill="#c5d195" />
          <Path d="M104 62V54m-33 18-6-6m73 8 7-6" stroke="#efd496" strokeWidth={2} />
        </G>
        <Path d="M99 20V144M44 88H154" stroke="#d6b079" strokeWidth={6} />
        <Rect x="30" y="145" width="139" height="9" rx="4" fill="#d8b581" />
        <Path d="M34 24Q27 73 35 136" stroke="#f0dfbd" strokeWidth={7} fill="none" />
        <Path d="M20 0Q9 44 31 73Q46 95 31 118M282 0Q270 31 291 53Q307 74 288 106M333 0Q324 33 340 53" stroke="#8aa262" strokeWidth={2} fill="none" />
        <G fill="#90aa6a">{leaves.map(([x, y, r], i) => <Ellipse key={i} cx={x} cy={y} rx="5" ry="10" transform={`rotate(${r} ${x} ${y})`} />)}</G>
        <G transform="translate(289 73)">
          <Rect x="0" y="0" width="42" height="47" rx="3" fill="#dfbd8a" stroke="#cfaa76" strokeWidth={1.5} />
          <Rect x="5" y="5" width="32" height="36" fill="#fff6dc" />
          <Path d="M9 36Q8 19 15 18Q16 10 21 16Q27 10 29 18Q36 24 32 36" fill="#b6d282" stroke="#8ca459" strokeWidth={1} />
          <Circle cx="17" cy="20" r="2" fill="#48633b" /><Circle cx="27" cy="20" r="2" fill="#48633b" />
          <Path d="M18 29l5 8 5-8" fill="#ee8a3e" />
        </G>
        <G transform="translate(276 141)">
          <Rect x="0" y="0" width="84" height="7" rx="2" fill="#d1af7b" />
          <Path d="M5 7v45m73-45v45" stroke="#d9bd94" strokeWidth={5} />
          <Rect x="2" y="47" width="80" height="6" rx="2" fill="#d1af7b" />
          <Rect x="9" y="15" width="11" height="31" rx="2" fill="#b2c58b" />
          <Rect x="22" y="20" width="9" height="26" rx="2" fill="#e1b371" />
          <Path d="M37 17l10-2 7 31H43Z" fill="#d68e6b" />
          <Path d="M62-4q-7-9 0-17q9 6 0 17" fill="#9dad6a" />
          <Path d="M51-12h24l-4 12H55Z" fill="#e5c98e" />
        </G>
        <Plant x={27} y={186} scale={0.85} />
        <Plant x={347} y={199} scale={0.75} />
        <G transform="translate(65 28) scale(0.893)"><PetG pose={pose} id={pid} /></G>
        <G transform="translate(283 224)">
          <Ellipse cx="0" cy="8" rx="31" ry="8" fill="#b6b98b" opacity={0.2} />
          <Path d="M-29-3H29L23 12Q0 21-23 12Z" fill="#82a55a" stroke="#6d8c47" strokeWidth={1.5} />
          <Ellipse cx="0" cy="-3" rx="29" ry="8" fill="#bed193" stroke="#6d8c47" strokeWidth={1.5} />
          <Ellipse cx="0" cy="-3" rx="22" ry="4.5" fill={bowlFull ? '#e5bd6b' : '#839b58'} />
          {bowlFull && (
            <G fill="#f7d891"><Circle cx="-12" cy="-5" r="3" /><Circle cx="-3" cy="-7" r="3" /><Circle cx="8" cy="-4" r="3" /><Circle cx="15" cy="-6" r="2.5" /></G>
          )}
          <Path d="M-5 7h10" stroke="#e8edc9" strokeWidth={2} strokeLinecap="round" />
        </G>
      </Svg>
      {!!speech && (
        <View style={[styles.speech, { backgroundColor: c.card, shadowColor: c.shadow }]}>
          <Text style={[styles.speechText, { color: c.foreground }]}>{speech}</Text>
        </View>
      )}
    </View>
  );
}

const BARS = [8, 14, 22, 13, 26, 18, 31, 21, 11, 24, 17, 29, 14, 23, 10, 19, 26, 14, 22, 12, 18, 8];
function Bar({ h, i, anim, color }: { h: number; i: number; anim: Animated.Value; color: string }) {
  const phase = (i % 6) / 6;
  const scaleY = anim.interpolate({ inputRange: [0, phase, Math.min(1, phase + 0.5), 1], outputRange: [0.5, 1, 0.45, 0.8], extrapolate: 'clamp' });
  return <Animated.View style={{ width: 3, height: h, borderRadius: 2, backgroundColor: color, transform: [{ scaleY }] }} />;
}
export function Wave({ playing = false, tone = 'leaf' }: { playing?: boolean; tone?: 'leaf' | 'orange' }) {
  const c = useColors();
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!playing) { anim.stopAnimation(); anim.setValue(1); return; }
    const loop = Animated.loop(Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }));
    anim.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [playing, anim]);
  const color = playing ? (tone === 'orange' ? c.accent : c.primary) : c.track;
  return (
    <View style={styles.wave} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {BARS.map((h, i) => <Bar key={i} h={h} i={i} anim={anim} color={color} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  room: { width: '100%', aspectRatio: 380 / 240, borderRadius: 26, overflow: 'hidden', borderWidth: 1 },
  speech: { position: 'absolute', top: 12, right: 12, maxWidth: '52%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderBottomRightRadius: 4, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  speechText: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 34, flex: 1, justifyContent: 'center' },
});
