import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { LetterAvatar, Wave } from '@/components/Art';
import { Btn, Card, Screen, T, ToggleRow, styles as ui } from '@/components/UI';

type Stage = 'waiting' | 'delivered' | 'playing' | 'played';

export default function Receiver() {
  const c = useColors();
  const { state, dispatch, t, name } = useMomo();
  const allowed = state.settings.allowed;
  const [stage, setStage] = useState<Stage>('waiting');

  // Revoking permission stops playback immediately.
  useEffect(() => { if (!allowed) setStage(s => (s === 'playing' ? 'delivered' : s)); }, [allowed]);
  useEffect(() => { if (stage !== 'playing') return; const id = setTimeout(() => setStage('played'), 8000); return () => clearTimeout(id); }, [stage]);

  const statusText = !allowed ? t('授权已撤回 · 接收与播放已停止') : {
    waiting: t('等待手动模拟送达'), delivered: t('已模拟送达，尚未播放'), playing: t('正在模拟播放 · 8秒'), played: t('已模拟播放 · 不代表挑战完成'),
  }[stage];

  return (
    <Screen tabs={false} back title={t('我的接收端 · 演示')}>
      <T variant="display">{t('是朋友熟悉的声音。')}</T>
      <T variant="small">{t('你的选择，我们会记住。')}</T>
      <Card>
        <ToggleRow title={t('接收好友叫醒授权')} sub={allowed ? t('已授权 Jenny、Ailun · 可随时关闭') : t('授权已关闭 · 不接收、不播放')}
          value={allowed} onChange={v => dispatch({ type: 'ALLOW', value: v })} testID="receiver-allow" />
      </Card>
      <Card tone={allowed ? 'leaf' : 'orange'}>
        <View style={ui.row}>
          <LetterAvatar name="Jenny" size={42} />
          <View style={ui.flex}>
            <T variant="h2">{t('{name} 的早安', { name: 'Jenny' })}</T>
            <T variant="small">{t('Jenny 给 {name} 的叫醒样本 · 不实际发送', { name })}</T>
          </View>
        </View>
        <Wave playing={allowed && stage === 'playing'} />
        <View style={ui.row}>
          <Feather name={allowed ? 'radio' : 'slash'} size={15} color={allowed ? c.primaryDeep : c.accentText} />
          <T variant="label" style={{ color: allowed ? c.primaryDeep : c.accentText, flex: 1 }}>{statusText}</T>
        </View>
        {stage === 'waiting' && <Btn label={t('模拟 Jenny 的叫醒送达')} icon="inbox" disabled={!allowed} onPress={() => setStage('delivered')} testID="receiver-deliver" />}
        {stage !== 'waiting' && (
          <Btn label={t('模拟接收端播放')} icon="play" disabled={!allowed || stage !== 'delivered'} onPress={() => setStage('playing')} testID="receiver-play" />
        )}
        <T variant="small">{t('仅波形，无实际声音；关闭授权即停止。')}</T>
      </Card>
      <Btn label={t('回小组首页')} variant="ghost" icon="users" onPress={() => router.replace('/')} />
    </Screen>
  );
}
