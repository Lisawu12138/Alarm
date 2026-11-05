import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as Speech from 'expo-speech';
import QRCode from 'react-native-qrcode-svg';

type Stage = 'home' | 'ring' | 'scan' | 'move' | 'success' | 'missed';
const CODE = 'alarm:awake:prototype:v1';
const commitments = ['请朋友喝咖啡', '整理房间 10 分钟', '¥20 模拟扣款'];
const storeKey = 'alarm-prototype-v1';

export default function App() {
  const [stage, setStage] = useState<Stage>('home');
  const [time, setTime] = useState('07:30');
  const [enabled, setEnabled] = useState(false);
  const [commitment, setCommitment] = useState(commitments[0]);
  const [message, setMessage] = useState('早上好！去洗手间扫码，开始属于你的一天。');
  const [count, setCount] = useState(0);
  const [qr, setQr] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recording = useAudioRecorderState(recorder);
  const player = useAudioPlayer(audioUri);
  const fired = useRef('');
  const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  useEffect(() => {
    AsyncStorage.getItem(storeKey).then(raw => {
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.time === 'string') setTime(data.time);
      if (commitments.includes(data.commitment)) setCommitment(data.commitment);
      if (typeof data.message === 'string') setMessage(data.message);
    }).catch(() => setError('设置读取失败，请重新设置。')).finally(() => setReady(true));
    return () => { Speech.stop(); };
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(storeKey, JSON.stringify({ time, commitment, message }))
      .catch(() => setError('设置未能保存。'));
  }, [ready, time, commitment, message]);

  const stopSound = () => { Speech.stop(); player.pause(); };
  const playSound = async () => {
    try {
      stopSound();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (audioUri) { await player.seekTo(0); player.play(); }
      else Speech.speak(message.trim() || '早上好，该起床了！', { language: 'zh-CN' });
    } catch { setError('语音播放失败，请检查声音权限。'); }
  };
  const ring = () => {
    setError(''); setNotice(''); setQr(false); setCount(0); setStage('ring');
    void playSound();
  };
  useEffect(() => {
    if (!enabled || stage !== 'home' || !validTime || recording.isRecording) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active' && Platform.OS !== 'web') return;
      const now = new Date();
      const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const key = `${now.toDateString()} ${current}`;
      if (current === time && fired.current !== key) {
        fired.current = key; setEnabled(false); ring();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [enabled, stage, time, validTime, message, audioUri, recording.isRecording]);

  const record = async () => {
    setError(''); stopSound();
    try {
      if (recording.isRecording) {
        await recorder.stop(); setAudioUri(recorder.uri);
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      if (!consent) { setError('请先确认录音者同意。'); return; }
      const access = await AudioModule.requestRecordingPermissionsAsync();
      if (!access.granted) { setError('需要麦克风权限才能录音。'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync(); recorder.record();
    } catch { setError('录音不可用，可以改用文字叫醒。'); }
  };
  const scan = async () => {
    stopSound(); setError(''); setStage('scan');
    if (!permission?.granted) {
      try { await requestPermission(); } catch { setError('无法打开相机，请检查权限。'); }
    }
  };
  const reset = () => { stopSound(); setStage('home'); setError(''); setCount(0); };
  const button = (label: string, action: () => void, secondary = false, disabled = false) =>
    <Pressable accessibilityRole="button" disabled={disabled} onPress={action}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.4 }]}>
      <Text style={[s.buttonText, secondary && { color: '#25382d' }]}>{label}</Text>
    </Pressable>;

  return <SafeAreaView style={s.root}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <View style={s.header}><Text style={s.brand}>alarm<Text style={{ color: '#b1c45e' }}>●</Text></Text><Text style={s.badge}>起床实验室</Text></View>
    {stage === 'home' ? <>
      <Text style={s.eyebrow}>A BETTER MORNING</Text>
      <Text style={s.title}>别只醒来。{'\n'}开始行动。</Text>
      <View style={s.clockCard}>
        <View style={s.row}><Text style={s.label}>我的起床时间</Text><Switch accessibilityLabel="启用前台闹钟" value={enabled}
          onValueChange={value => { if (!validTime) { setError('请输入有效时间，如 07:30。'); return; } setEnabled(value); setNotice(value ? '保持 App 打开，到点播放叫醒语音。' : ''); }}
          trackColor={{ false: '#cdd4bd', true: '#25382d' }} /></View>
        <TextInput accessibilityLabel="起床时间" value={time} onChangeText={setTime} maxLength={5} style={s.time} placeholder="07:30" />
        <Text style={s.small}>{enabled ? '已启用 · 前台演示' : '每天，给自己一个新的开始'}</Text>
      </View>
      <View style={s.sectionHeading}><Text style={s.section}>01 / 叫醒我的声音</Text><Text style={s.small}>本次会话录音</Text></View>
      <View style={s.card}>
        <View style={s.row}><Text style={s.cardTitle}>{recording.isRecording ? '● 正在录音' : audioUri ? '你的叫醒语音' : '一句话，叫醒明天的你'}</Text><Text style={s.wave}>▂ ▅ ▃ █ ▄ ▆ ▂</Text></View>
        <TextInput accessibilityLabel="叫醒文字" multiline value={message} onChangeText={setMessage} style={s.message} placeholder="写下你想听到的话…" />
        <View style={s.row}><Text style={s.small}>我已获得录音者同意</Text><Switch accessibilityLabel="录音者同意" value={consent} onValueChange={setConsent} /></View>
        <View style={s.actions}>{button(recording.isRecording ? '停止录音' : '录制叫醒语音', () => void record(), true)}
          {button('试听', () => void playSound(), true, recording.isRecording)}</View>
        {audioUri && button('删除录音，使用文字', () => { stopSound(); setAudioUri(null); }, true)}
      </View>
      <Text style={s.section}>02 / 给自己一个承诺</Text>
      <View style={s.card}>{commitments.map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: commitment === item }} onPress={() => setCommitment(item)} style={s.option}>
        <Text style={s.optionText}>{item}</Text><Text style={s.radio}>{commitment === item ? '●' : '○'}</Text>
      </Pressable>)}</View>
      <Text style={s.section}>03 / 离开床，完成任务</Text>
      <View style={s.card}><View style={s.row}><Text style={s.cardTitle}>▣  扫码 → 10 次深蹲</Text><Text style={s.pill}>2 步</Text></View>
        {button(qr ? '收起任务码' : '打开任务二维码', () => setQr(!qr), true)}
        {qr && <View style={s.qr}><QRCode value={CODE} size={180} /><Text style={s.small}>在另一台设备展示，放到床外。</Text></View>}
      </View>
      {button('立即试响  ↗', ring, false, recording.isRecording || !validTime)}
      <Text style={s.footer}>演示原型 · 不实际扣款 · 不用于可靠后台叫醒</Text>
    </> : <>
      <Text style={s.eyebrow}>{stage === 'success' ? 'YOU DID IT' : stage === 'missed' ? 'TRY AGAIN TOMORROW' : 'YOUR MORNING STARTS NOW'}</Text>
      <Text style={s.title}>{({ ring: '早上好。\n该离开床了。', scan: '走到二维码前。', move: '动起来，\n清醒一点。', success: '你做到了。', missed: '今天的承诺，\n留给你兑现。' })[stage]}</Text>
      {['ring', 'scan', 'move'].includes(stage) && <View style={s.steps}><Text style={s.step}>{stage === 'move' ? '✓' : '1'}  扫码</Text><Text style={s.step}>→</Text><Text style={s.step}>2  深蹲</Text></View>}
      {stage === 'ring' && <><View style={s.clockCard}><Text style={s.bigTime}>{time}</Text><Text style={s.wave}>▂ ▅ ▃ █ ▄ ▆ ▂</Text></View>{button('起床，开始扫码  ↗', () => void scan())}{button('再听一次', () => void playSound(), true)}</>}
      {stage === 'scan' && <>
        {permission?.granted ? <View style={s.camera}><CameraView style={{ flex: 1 }} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => { if (data === CODE) { setError(''); setStage('move'); } else setError('这不是任务码，请扫描设置中的二维码。'); }} /></View>
          : <View style={s.card}><Text style={s.cardTitle}>允许相机访问后开始扫码</Text>{button('允许使用相机', () => void requestPermission(), true)}</View>}
        {button('无相机演示：模拟扫码', () => { setError(''); setStage('move'); }, true)}
      </>}
      {stage === 'move' && <><View style={s.clockCard}><Text style={s.counter}>{count}<Text style={s.total}> / 10</Text></Text>
        <View style={s.progress}><View style={[s.fill, { width: `${count * 10}%` }]} /></View><Text style={s.small}>手动计数 · 请量力而行</Text></View>
        {count < 10 ? button('完成一次深蹲  +1', () => setCount(c => Math.min(c + 1, 10))) : button('完成起床任务  ✓', () => { stopSound(); setStage('success'); })}
        {button('不适合运动？改做 10 次伸展', () => setNotice('可坐姿伸展，每完成一次点击计数。'), true)}
      </>}
      {stage === 'success' && <><View style={s.clockCard}><Text style={s.symbol}>✓</Text><Text style={s.cardTitle}>扫码完成 · 动作完成</Text><Text style={s.small}>今天不用兑现惩罚承诺</Text></View>{button('回到我的闹钟', reset)}</>}
      {stage === 'missed' && <><View style={s.clockCard}><Text style={s.symbol}>↗</Text><Text style={s.cardTitle}>{commitment}</Text><Text style={s.small}>{commitment.includes('¥') ? '模拟结果，不会扣款。' : '由你自行兑现，不会自动执行。'}</Text></View>{button('重新开始', reset)}</>}
      {['ring', 'scan', 'move'].includes(stage) && button('放弃本次，查看承诺', () => { stopSound(); setError(''); setStage('missed'); }, true)}
    </>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!!notice && <Text style={s.notice}>{notice}</Text>}
    <View style={s.bottom}><Text style={s.small}>ALARM / 把早晨还给自己</Text><Text style={s.small}>☀</Text></View>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f5ef' },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 24, paddingBottom: 48, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  brand: { fontSize: 35, fontWeight: '900', letterSpacing: -2, color: '#25382d' },
  badge: { color: '#596348', borderWidth: 1, borderColor: '#cdd4bd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 12 },
  eyebrow: { color: '#68734d', letterSpacing: 3, fontSize: 10, fontWeight: '700' },
  title: { fontSize: 42, fontWeight: '800', color: '#25382d', lineHeight: 53, letterSpacing: -1, marginBottom: 12 },
  clockCard: { backgroundColor: '#e5eccd', padding: 28, borderRadius: 28, gap: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: 14, color: '#35442c', fontWeight: '600' },
  time: { fontSize: 80, fontWeight: '300', letterSpacing: -4, color: '#25382d', padding: 0 },
  bigTime: { fontSize: 78, color: '#25382d', letterSpacing: -4 },
  small: { fontSize: 12, color: '#6d7667', lineHeight: 20 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  section: { fontSize: 13, fontWeight: '700', color: '#45533b', marginTop: 12 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7dd', padding: 20, borderRadius: 22, gap: 14 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#25382d' },
  wave: { color: '#84964b', fontSize: 22, letterSpacing: 2 },
  message: { fontSize: 15, lineHeight: 24, color: '#5e6857', backgroundColor: '#f6f7f2', padding: 14, borderRadius: 12, minHeight: 78 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { backgroundColor: '#25382d', paddingVertical: 17, paddingHorizontal: 22, borderRadius: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondary: { backgroundColor: '#edf0e5' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f1e9' },
  optionText: { fontSize: 16, color: '#25382d' },
  radio: { fontSize: 24, color: '#6e823a' },
  pill: { fontSize: 11, backgroundColor: '#edf0e5', padding: 8, borderRadius: 12, color: '#596348' },
  qr: { alignItems: 'center', backgroundColor: 'white', padding: 18, gap: 18 },
  footer: { fontSize: 11, color: '#7a8172', textAlign: 'center', lineHeight: 18 },
  steps: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  step: { fontSize: 15, color: '#68734d', fontWeight: '600' },
  camera: { height: 320, overflow: 'hidden', borderRadius: 24, backgroundColor: '#25382d' },
  counter: { fontSize: 100, fontWeight: '300', color: '#25382d', textAlign: 'center' },
  total: { fontSize: 30, color: '#839269' },
  progress: { height: 8, backgroundColor: '#d0d9b7', borderRadius: 8, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#354b2e' },
  symbol: { fontSize: 96, color: '#354b2e', textAlign: 'center' },
  error: { color: '#9a3d2b', backgroundColor: '#fcece3', padding: 14, borderRadius: 12 },
  notice: { color: '#52603d', padding: 12, fontSize: 13 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, borderTopWidth: 1, borderTopColor: '#dce0d2', paddingTop: 20 },
});
