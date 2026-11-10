import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Btn, Card, Screen, T } from '@/components/UI';

export default function About() {
  const c = useColors();
  const { t } = useMomo();
  return (
    <Screen tabs={false} back title={t('关于')}>
      <View style={{ alignItems: 'center', backgroundColor: c.secondary, borderRadius: 26, paddingVertical: 12 }}>
        <Image source={require('@/assets/images/icon.png')} style={{ width: 150, height: 150, borderRadius: 34 }} accessibilityLabel={t('青蛙 Momo')} />
      </View>
      <T variant="kicker">{t('认识 Momo')}</T>
      <T variant="display">{t('和熟悉的人，一起迎接早晨。')}</T>
      <T style={{ lineHeight: 24 }}>{t('个人的早安约定、自己的点数，和大家一起照顾的一只 Momo。')}</T>
      <Card tone="orange">
        <T variant="label">{t('这是本地可点击原型。没有真实闹钟、音频、后端或消息发送。')}</T>
        <T variant="small">{t('资料与偏好仅保存在本机，本地演示用。')}</T>
      </Card>
      <T variant="small" style={{ textAlign: 'center' }}>{t('版本 0.1.0 Demo')}</T>
      <Btn label={t('返回设置')} variant="ghost" icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} />
    </Screen>
  );
}
