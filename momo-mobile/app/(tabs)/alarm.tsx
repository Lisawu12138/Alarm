import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Wave } from '@/components/Art';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Btn, Card, Chip, IconBtn, Notice, T, ToggleRow, VolumeControl, fonts, haptic, styles as ui, useBottomPad, useTopInset } from '@/components/UI';
import { toneKey, validTime, type Settings } from '@/lib/model';

const DAYS = [['一', '星期一'], ['二', '星期二'], ['三', '星期三'], ['四', '星期四'], ['五', '星期五'], ['六', '星期六'], ['日', '星期日']];

export default function Alarm() {
  const c = useColors();
  const { state, dispatch, t, hydrated } = useMomo();
  const top = useTopInset();
  const bottom = useBottomPad(true);
  const [draft, setDraft] = useState<Settings>(state.settings);
  const [time, setTime] = useState(state.settings.time);
  const [preview, setPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (hydrated && !inited.current) { inited.current = true; setDraft(state.settings); setTime(state.settings.time); }
  }, [hydrated, state.settings]);
  useEffect(() => { if (!preview) return; const id = setTimeout(() => setPreview(false), 8000); return () => clearTimeout(id); }, [preview]);

  const timeOk = validTime(time);
  const merged: Settings = { ...draft, time, volume: state.settings.volume, allowed: state.settings.allowed, tone: state.settings.tone };
  const dirty = JSON.stringify({ ...merged, days: [...merged.days].sort() }) !== JSON.stringify({ ...state.settings, days: [...state.settings.days].sort() });
  const valid = timeOk && draft.days.length > 0;


  const toggleDay = (d: number) => setDraft(p => ({ ...p, days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d].sort() }));
  const save = () => {
    if (!valid) return;
    dispatch({ type: 'SAVE', settings: { ...merged, days: [...merged.days].sort() } });
    haptic('success'); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1800);
  };
  const ring = () => { dispatch({ type: 'START' }); router.push('/challenge'); };

  return (
    <View style={[ui.flex, { backgroundColor: c.background, paddingTop: top }]}>
      <View style={[ui.rowBetween, { paddingHorizontal: 20, height: 52 }]}>
        <T variant="title">{t('我的闹钟')}</T>
        <IconBtn name="info" label={t('关于')} onPress={() => router.push('/about')} />
      </View>
      <Notice />
      <KeyboardAwareScrollViewCompat bottomOffset={40} contentContainerStyle={[ui.body, { paddingBottom: bottom }]} showsVerticalScrollIndicator={false}>
        <Card tone="leaf">
          <T variant="small">{t('我的约定时间 · 24小时制')}</T>
          <TextInput value={time} onChangeText={v => setTime(v.replace(/[^\d:]/g, '').slice(0, 5))} maxLength={5} testID="alarm-time"
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'} accessibilityLabel={t('个人闹钟时间，24小时制，时冒号分')}
            style={[s.time, { color: c.foreground }]} placeholder="08:00" placeholderTextColor={c.mutedForeground} />
          {!timeOk ? <Text style={[s.warn, { color: c.destructive }]}>{t('请输入有效时间，例如 08:00')}</Text> : <T variant="small">{t('示例日 11月6日 周五 · 不设真实闹钟')}</T>}
        </Card>

        <Card>
          <T variant="h2">{t('重复日期')}</T>
          <View style={s.days}>
            {DAYS.map(([short, full], i) => {
              const on = draft.days.includes(i);
              return (
                <Pressable key={i} onPress={() => { haptic(); toggleDay(i); }} testID={`day-${i}`} accessibilityRole="button" accessibilityLabel={t(full)} accessibilityState={{ selected: on }}
                  style={[s.day, { backgroundColor: on ? c.primary : c.muted }]}>
                  <Text style={[s.dayText, { color: on ? c.primaryForeground : c.mutedForeground }]}>{t(short)}</Text>
                </Pressable>
              );
            })}
          </View>
          {draft.days.length === 0 && <Text style={[s.warn, { color: c.destructive }]}>{t('至少选择一天')}</Text>}
        </Card>

        <Card>
          <View style={ui.rowBetween}>
            <T variant="h2">{t('轻摇挑战')}</T>
            <View style={ui.row}>
              <IconBtn name="minus-circle" label={`-5 ${t('秒')}`} testID="dur-down" onPress={() => setDraft(p => ({ ...p, duration: Math.max(15, p.duration - 5) }))} />
              <Text style={[s.dur, { color: c.foreground }]} accessibilityLabel={t('{n}秒', { n: draft.duration })}>{t('{n}秒', { n: draft.duration })}</Text>
              <IconBtn name="plus-circle" label={`+5 ${t('秒')}`} testID="dur-up" onPress={() => setDraft(p => ({ ...p, duration: Math.min(60, p.duration + 5) }))} />
            </View>
          </View>
          <View style={[ui.row, { flexWrap: 'wrap' }]}>
            {[15, 30, 45, 60].map(n => <Chip key={n} label={t('{n}秒', { n })} selected={draft.duration === n} onPress={() => setDraft(p => ({ ...p, duration: n }))} testID={`dur-${n}`} />)}
          </View>
        </Card>

        <Card>
          <View style={ui.rowBetween}><T variant="h2">{t('选择好友的早安')}</T><T variant="small">{t('本人授权的样本')}</T></View>
          <View style={ui.row}>
            {(['Jenny', 'Ailun', ''] as const).map(v => (
              <Chip key={v || 'none'} label={v || t('不使用语音')} selected={draft.voice === v} onPress={() => { setPreview(false); setDraft(p => ({ ...p, voice: v })); }} testID={`voice-${v || 'none'}`} />
            ))}
          </View>
          {draft.voice !== '' && (
            <View style={[ui.row, { gap: 10 }]}>
              <Pressable onPress={() => { haptic(); setPreview(p => !p); }} testID="voice-preview" accessibilityRole="button" accessibilityLabel={preview ? t('停止本地试听演示') : t('本地试听演示')}
                style={[s.play, { backgroundColor: c.primary }]}>
                <Feather name={preview ? 'pause' : 'play'} size={18} color={c.primaryForeground} />
              </Pressable>
              <View style={ui.flex}>
                <T variant="label">{t('{name} 的早安', { name: draft.voice })}</T>
                <Wave playing={preview} />
              </View>
              <T variant="small">{preview ? t('演示中') : '0:08'}</T>
            </View>
          )}
          <T variant="small">{draft.voice ? t('{name} · 已授权；演示播放一次8秒，再转基础铃声。', { name: draft.voice }) + ' ' + t('无克隆。') : t('仅演示基础铃声，不使用好友语音。')}</T>
          <ToggleRow title={t('实时好友叫醒')} sub={state.settings.allowed ? t('Jenny、Ailun 已获接收授权') : t('已撤回授权 · 接收演示已禁用')}
            value={state.settings.allowed} onChange={v => dispatch({ type: 'ALLOW', value: v })} testID="alarm-allow" />
          {draft.voice !== '' && !state.settings.allowed && <Text style={[s.warn, { color: c.accentText }]}>{t('授权已关闭 · 不接收、不播放')}</Text>}
        </Card>

        <Card>
          <VolumeControl value={state.settings.volume} onChange={v => dispatch({ type: 'VOLUME', value: v })} />
          <Pressable onPress={() => router.push('/settings')} style={ui.rowBetween} accessibilityRole="button" accessibilityLabel={t('基础铃声')}>
            <T variant="label">{t('基础铃声')}</T>
            <View style={ui.row}><T variant="small">{t(toneKey[state.settings.tone])}</T><Feather name="chevron-right" size={16} color={c.mutedForeground} /></View>
          </Pressable>
        </Card>

        {savedFlash && <Text style={[s.ok, { color: c.primaryDeep }]}>{t('设置已保存')}</Text>}
        <Btn label={t('保存我的闹钟')} icon="check" onPress={save} disabled={!valid || (!dirty && state.saved)} testID="save-alarm" />
        <Btn label={t('模拟响铃 · {time} · {n}秒', { time: state.settings.time, n: state.settings.duration })} icon="bell" variant="accent"
          onPress={ring} disabled={!state.saved || dirty} testID="simulate-ring" a11yHint={t('不会通知或自动响铃')} />
        {(!state.saved || dirty) && <T variant="small" style={{ textAlign: 'center' }}>{t('设置有变更，保存后继续演示')}</T>}
        {state.rewarded && <T variant="small" style={{ textAlign: 'center' }}>{t('今日奖励已领取；再次演示不会重复加点。')}</T>}

      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const s = StyleSheet.create({
  time: { fontFamily: fonts.black, fontSize: 60, letterSpacing: -2, fontVariant: ['tabular-nums'], padding: 0 },
  warn: { fontFamily: fonts.bold, fontSize: 12.5 },
  ok: { fontFamily: fonts.heavy, fontSize: 13, textAlign: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: fonts.heavy, fontSize: 14 },
  dur: { fontFamily: fonts.black, fontSize: 17, minWidth: 44, textAlign: 'center', fontVariant: ['tabular-nums'] },
  play: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
