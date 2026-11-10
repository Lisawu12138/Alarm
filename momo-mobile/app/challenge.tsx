import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Pet, Wave } from '@/components/Art';
import { Btn, Header, T, VolumeControl, fonts, haptic, styles as ui, useBottomPad, useTopInset } from '@/components/UI';
import { toneKey } from '@/lib/model';

export default function Challenge() {
  const c = useColors();
  const { state, dispatch, t } = useMomo();
  const top = useTopInset();
  const bottom = useBottomPad(false);
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [graceLeft, setGraceLeft] = useState(0);
  const holdRef = useRef(false);
  const releasedAt = useRef<number | null>(null);
  const activeRef = useRef(state.active);
  activeRef.current = state.active;
  const finished = useRef(false);
  const { duration, voice, allowed, tone, volume } = state.settings;
  const progress = state.progress;
  const remaining = duration - progress;

  // Main clock: 1 effective second per real second while held; 2s grace after release; then -1/s.
  useEffect(() => {
    if (!state.active) return;
    const id = setInterval(() => {
      setElapsed(e => e + 1);
      if (holdRef.current) { dispatch({ type: 'TICK', gain: true }); setGraceLeft(0); return; }
      if (releasedAt.current !== null) {
        const since = (Date.now() - releasedAt.current) / 1000;
        if (since < 2) { setGraceLeft(Math.ceil(2 - since)); return; }
        setGraceLeft(0);
        dispatch({ type: 'TICK', gain: false });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.active, dispatch]);

  // Completion transition.
  useEffect(() => {
    if (!state.active && state.status === 'completed' && progress === duration && !finished.current) {
      finished.current = true; haptic('success'); router.replace('/success');
    }
  }, [state.active, state.status, progress, duration]);

  const stopAsSkip = useCallback(() => {
    holdRef.current = false;
    if (activeRef.current) dispatch({ type: 'STOP' });
  }, [dispatch]);

  // Leaving the screen or backgrounding ends the attempt without reward.
  useFocusEffect(useCallback(() => () => stopAsSkip(), [stopAsSkip]));
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s !== 'active') stopAsSkip(); });
    return () => sub.remove();
  }, [stopAsSkip]);

  // Shake wobble while held.
  const wobble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!holding) { wobble.stopAnimation(); Animated.timing(wobble, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start(); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(wobble, { toValue: 1, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(wobble, { toValue: -1, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(wobble, { toValue: 0, duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [holding, wobble]);
  const rotate = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] });

  const bar = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(bar, { toValue: duration ? progress / duration : 0, duration: 400, useNativeDriver: false }).start(); }, [progress, duration, bar]);

  if (!state.active && !finished.current) {
    // Deep link / reload / ended attempt: never a silent timer or reward.
    return (
      <View style={[ui.flex, { backgroundColor: c.background, paddingTop: top, paddingBottom: bottom }]}>
        <Header back title={t('轻摇演示')} />
        <View style={[ui.flex, ui.body, { alignItems: 'center', justifyContent: 'center' }]}>
          <Pet pose="sleep" size={180} label={t('青蛙 Momo')} />
          <T variant="title" style={{ textAlign: 'center' }}>{t('这次演示已结束')}</T>
          <T variant="small" style={{ textAlign: 'center' }}>{state.saved ? t('重新开始会从0秒累计，今日奖励不重复。') : t('无法开始：请先保存闹钟')}</T>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Btn label={t('返回闹钟设置')} icon="bell" onPress={() => router.replace('/alarm')} testID="back-alarm" />
          </View>
        </View>
      </View>
    );
  }

  const pct = Math.round((progress / duration) * 100);
  const pose = holding ? 'shake' : progress >= duration * 0.66 ? 'happy' : progress > 0 ? 'awake' : 'sleep';
  const mood = progress >= duration * 0.66 ? t('Momo 也跟着精神起来了') : progress > 0 ? t('Momo 正跟上你的节奏') : t('一起，慢慢动起来');
  const friend = voice !== '' && allowed && elapsed < 8;
  const phase = holding ? t('匀速累计 · 每秒1秒，猛摇不会更快') : graceLeft > 0 ? t('已松开 · 缓冲2秒') : releasedAt.current !== null && progress > 0 ? t('缓慢回退 · 每秒减1秒') : t('按住累计，松开缓冲2秒，再缓慢回退');

  const press = (on: boolean) => {
    holdRef.current = on; setHolding(on);
    if (on) { releasedAt.current = null; setGraceLeft(0); haptic('medium'); } else { releasedAt.current = Date.now(); setGraceLeft(2); }
  };

  return (
    <View style={[ui.flex, { backgroundColor: c.background, paddingTop: top }]}>
      <Header title={t('轻摇挑战 · 本地模拟')} />
      <ScrollView contentContainerStyle={[ui.body, { flexGrow: 1, paddingBottom: bottom, justifyContent: 'space-between' }]} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={[s.clock, { color: c.foreground }]}>{state.settings.time}</Text>
          <T variant="small">{mood}</T>
        </View>
        <Animated.View style={{ alignItems: 'center', transform: [{ rotate }] }}>
          <Pet pose={pose} size={170} label={`${t('青蛙 Momo')} · ${mood}`} />
        </Animated.View>
        <View style={{ gap: 8 }}>
          <View style={ui.rowBetween}>
            <View>
              <T variant="small">{t('还需')}</T>
              <Text style={[s.remaining, { color: c.foreground }]} accessibilityLiveRegion="polite">{remaining}<Text style={s.unit}>{t('秒')}</Text></Text>
            </View>
            <T variant="small" style={{ textAlign: 'right', flexShrink: 1 }}>{t('有效 {n}／{total}秒 · {percent}%', { n: progress, total: duration, percent: pct })}</T>
          </View>
          <View style={[s.track, { backgroundColor: c.secondary }]} accessible accessibilityRole="progressbar" accessibilityLabel={t('轻摇挑战进度')} accessibilityValue={{ min: 0, max: duration, now: progress }}>
            <Animated.View style={[s.fill, { backgroundColor: c.primary, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <Text style={[s.phase, { color: c.mutedForeground }]}>{phase}</Text>
        </View>

        <View style={[s.sound, { backgroundColor: c.card, borderColor: c.border }]}>
          <Feather name={friend ? 'user' : 'music'} size={16} color={friend ? c.accent : c.primary} />
          <View style={ui.flex}>
            <T variant="label" numberOfLines={1}>{friend ? `${t('{name} 的早安', { name: voice })} · ${t('{n}／8秒 · 仅一次', { n: Math.min(8, elapsed) })}` : `${t('基础铃声 · {tone}', { tone: t(toneKey[tone]) })} · ${t('持续演示')}`}</T>
            <Wave playing tone={friend ? 'orange' : 'leaf'} />
          </View>
        </View>
        <T variant="small" style={{ textAlign: 'center' }}>{t('本地声波演示 · 不实际发声')} · {t('音量 {n}%', { n: volume })}</T>
        <VolumeControl value={volume} onChange={v => dispatch({ type: 'VOLUME', value: v })} />

        <Pressable onPressIn={() => press(true)} onPressOut={() => press(false)} testID="hold-shake" accessibilityRole="button" accessibilityLabel={t('模拟轻摇 · 按住')}
          style={[s.hold, { backgroundColor: holding ? c.primaryDeep : c.primary }]}>
          <Feather name="smartphone" size={20} color={c.primaryForeground} />
          <Text style={[s.holdText, { color: c.primaryForeground }]}>{t('模拟轻摇 · 按住')}</Text>
        </Pressable>
        <Btn label={t('紧急停止 · 跳过本次')} variant="danger" icon="square" testID="emergency-stop"
          onPress={() => { holdRef.current = false; dispatch({ type: 'STOP' }); haptic('warning'); router.replace('/emergency'); }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  clock: { fontFamily: fonts.black, fontSize: 48, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  remaining: { fontFamily: fonts.black, fontSize: 40, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 18 },
  track: { height: 9, borderRadius: 6, overflow: 'hidden' },
  fill: { height: 9, borderRadius: 6 },
  phase: { fontFamily: fonts.semibold, fontSize: 12, textAlign: 'center', minHeight: 18 },
  sound: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, borderWidth: 1 },
  hold: { minHeight: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  holdText: { fontFamily: fonts.black, fontSize: 17 },
});
