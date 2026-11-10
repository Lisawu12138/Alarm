import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { LetterAvatar, Wave } from '@/components/Art';
import { Btn, Card, Screen, T, ToggleRow, fonts, haptic, styles as ui } from '@/components/UI';

export default function Voices() {
  const c = useColors();
  const { state, dispatch, t, name } = useMomo();
  const [rec, setRec] = useState(0);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const recRef = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  useEffect(() => clear, []);
  useFocusEffect(React.useCallback(() => () => { clear(); setRecording(false); setPlaying(false); }, []));
  useEffect(() => { if (!sending) return; const id = setTimeout(() => { dispatch({ type: 'SEND' }); setSending(false); haptic('success'); }, 1200); return () => clearTimeout(id); }, [sending, dispatch]);
  useEffect(() => { if (!playing) return; const id = setTimeout(() => { dispatch({ type: 'PLAY' }); setPlaying(false); }, 8000); return () => clearTimeout(id); }, [playing, dispatch]);

  const finish = () => {
    clear(); setRecording(false);
    if (recRef.current >= 1) dispatch({ type: 'RECORD', seconds: recRef.current }); else setTooShort(true);
  };
  const begin = () => {
    if (state.nudge !== 'idle') return;
    setTooShort(false); recRef.current = 0; setRec(0); setRecording(true); haptic('medium');
    timer.current = setInterval(() => {
      recRef.current += 1; setRec(recRef.current);
      if (recRef.current >= 8) finish();
    }, 1000);
  };

  const stages = [['录音演示', 'idle'], ['已送达', 'delivered'], ['接收端已播', 'played']] as const;
  const order = { idle: 0, review: 0, delivered: 1, played: 2 };
  return (
    <Screen>
      <T variant="kicker" style={{ marginTop: 4 }}>{t('好友语音')}</T>
      <T variant="display">{state.nudge === 'played' || state.nudge === 'delivered' ? t('一声熟悉的早安，送到了。') : t('把熟悉的声音，留给朋友。')}</T>

      <Card tone="orange" style={ui.row}>
        <LetterAvatar name="Ailun" size={44} />
        <View style={ui.flex}>
          <T variant="h2">{t('Ailun 的早晨')}</T>
          <T variant="small">{t('07:30 · 超时未完成')}</T>
          <T variant="small" style={{ color: c.accentText }}>{t('已授权 {name} · 当前可叫醒', { name })}</T>
        </View>
      </Card>

      <View style={s.stages} accessibilityLabel={t('语音演示流程')}>
        {stages.map(([label, key], i) => {
          const on = order[state.nudge] >= i && (i > 0 || true);
          return <View key={key} style={[s.stage, { borderTopColor: on ? c.primary : c.border }]}><Text style={[s.stageText, { color: on ? c.primaryDeep : c.mutedForeground }]}>{t(label)}</Text></View>;
        })}
      </View>

      {state.nudge === 'idle' && (
        <Card style={{ alignItems: 'center' }}>
          <T variant="small">{t('不使用麦克风 · 不实际发送 · 最长8秒')}</T>
          <Pressable onPressIn={begin} onPressOut={() => recording && finish()} testID="hold-record" accessibilityRole="button" accessibilityLabel={t('按住进行录音演示')}
            style={[s.mic, { backgroundColor: recording ? c.accent : c.primary }]}>
            <Feather name="mic" size={34} color={c.primaryForeground} />
          </Pressable>
          <Wave playing={recording} tone="orange" />
          <T variant="label">{recording ? t('{n}秒 · 松开查看', { n: rec }) : t('按住，演示一声早安')}</T>
          {tooShort && <T variant="small" style={{ color: c.accentText }}>{t('按住至少1秒，再松开查看样本。')}</T>}
        </Card>
      )}

      {state.nudge === 'review' && (
        <Card>
          <T variant="h2">{t('发送前，听听这份心意')}</T>
          <View style={ui.row}><Wave /><T variant="small">{t('录音样本 {n}秒', { n: state.recordSeconds })}</T></View>
          <T variant="small">{t('演示样本：「Ailun，早安。一起动一动吧。」')}</T>
          <Btn label={sending ? t('发送中…') : t('模拟发送给 Ailun')} icon="send" disabled={sending} onPress={() => setSending(true)} testID="send" />
          <Btn label={t('重新录音演示')} variant="ghost" icon="rotate-ccw" disabled={sending} onPress={() => dispatch({ type: 'RETAKE' })} testID="retake" />
        </Card>
      )}

      {(state.nudge === 'delivered' || state.nudge === 'played') && (
        <Card tone={state.nudge === 'played' ? 'leaf' : 'card'}>
          <View style={ui.row}><Feather name={state.nudge === 'played' ? 'check-circle' : 'inbox'} size={18} color={c.primaryDeep} />
            <T variant="h2">{t(state.nudge === 'played' ? '接收端已模拟播放' : '演示消息已送达')}</T></View>
          <T variant="small">{t(state.nudge === 'played' ? '仅确认本次模拟播放，不代表 Ailun 已完成挑战。' : '送达不等于已播放。下面手动进入接收端演示。')}</T>
          {state.nudge === 'delivered' && (
            <View style={[s.receiver, { borderLeftColor: c.primary }]}>
              <T variant="label">{t('Ailun 的接收端 · 本地模拟')}</T>
              <T variant="small">{t('来自 {name} · 已授权接收', { name })}</T>
              <View style={ui.row}><Wave playing={playing} /><T variant="small">{playing ? t('样本波形播放中') : '0:0' + state.recordSeconds}</T></View>
              <Btn label={t('模拟 Ailun 接收端播放')} icon="play" small disabled={playing} onPress={() => setPlaying(true)} testID="simulate-play" />
            </View>
          )}
          <Btn label={t('重新录音演示')} variant="ghost" icon="rotate-ccw" small disabled={playing} onPress={() => dispatch({ type: 'RETAKE' })} />
        </Card>
      )}

      <Card>
        <ToggleRow title={t('接收好友叫醒')} sub={state.settings.allowed ? t('已授权 Jenny、Ailun · 可随时关闭') : t('授权已关闭 · 不接收、不播放')}
          value={state.settings.allowed} onChange={v => dispatch({ type: 'ALLOW', value: v })} testID="voices-allow" />
        <Btn label={state.settings.allowed ? t('查看我接收好友叫醒的演示') : t('接收授权已关闭')} variant="secondary" icon="radio"
          disabled={!state.settings.allowed} onPress={() => router.push('/receiver')} testID="open-receiver" />
      </Card>
    </Screen>
  );
}
const s = StyleSheet.create({
  stages: { flexDirection: 'row', gap: 8 },
  stage: { flex: 1, borderTopWidth: 3, paddingTop: 6 },
  stageText: { fontFamily: fonts.heavy, fontSize: 12 },
  mic: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  receiver: { borderLeftWidth: 3, paddingLeft: 12, gap: 6 },
});
