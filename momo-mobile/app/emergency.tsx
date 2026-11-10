import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Pet } from '@/components/Art';
import { Btn, Card, Screen, T, styles as ui } from '@/components/UI';

export default function Emergency() {
  const c = useColors();
  const { state, t, name } = useMomo();
  return (
    <Screen tabs={false} back title={t('已停止')}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Pet pose="sleep" size={180} label={t('青蛙 Momo')} />
        <T variant="kicker">{t('本次演示已结束')}</T>
        <T variant="display" style={{ textAlign: 'center' }}>{t('先照顾好自己')}</T>
        <T variant="small" style={{ textAlign: 'center' }}>{t('没有关系，早晨不只有一种节奏。')}</T>
      </View>
      <Card tone="orange">
        <T variant="label">{t('{name}，休息一下也可以。', { name })}</T>
        <View style={ui.row}><Feather name="x-circle" size={15} color={c.accentText} /><T variant="small">{state.rewarded ? t('之前已获得的今日奖励保留，不会再次发放。') : t('本次已跳过 · 未获得奖励')}</T></View>
        <View style={ui.row}><Feather name="bell-off" size={15} color={c.accentText} /><T variant="small">{t('演示计时与本地提醒')} · {t('已取消')}</T></View>
        <View style={ui.rowBetween}><T variant="small">{t('当前个人点数')}</T><T variant="h2">{state.points}</T></View>
      </Card>
      <Btn label={t('回小组，看看 Momo')} icon="users" onPress={() => router.replace('/')} testID="emergency-home" />
      <Btn label={t('重新设置并开始演示')} variant="ghost" icon="refresh-cw" onPress={() => router.replace('/alarm')} testID="emergency-alarm" />
    </Screen>
  );
}
