import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Room } from '@/components/Art';
import { Btn, Card, Screen, T, Wallet, fonts } from '@/components/UI';

export default function Success() {
  const c = useColors();
  const { state, t, name } = useMomo();
  const done = state.rewarded;
  return (
    <Screen tabs={false} back title={t('今天的一小步')}>
      <Room pose={done ? 'happy' : 'awake'} label={t('Momo 的晨光小屋')} bowlFull={state.fed}
        speech={done ? t('{name}，刚才有认真动一动呢！', { name }) : t('我们一起，慢慢来。')} />
      <View style={{ gap: 4 }}>
        <T variant="kicker">{t(done ? '今日挑战已完成' : '还未完成挑战')}</T>
        <T variant="display">{done ? t('{name}，Momo 记得你的努力', { name }) : t('早晨，按自己的节奏来')}</T>
      </View>
      <Card tone="gold" style={s.reward}>
        <View style={{ flex: 1 }}>
          <T variant="label">{t('今日个人奖励')}</T>
          <T variant="small">{done ? t('挑战成功时已入账 · 今日仅一次') : t('完成挑战后入账，访问本页不领奖')}</T>
        </View>
        <Text style={[s.plus, { color: done ? c.goldText : c.mutedForeground }]}>{done ? '+10' : '+0'}</Text>
      </Card>
      <Wallet balance={state.points} stock={state.food} reserved={state.pending} />
      <Btn label={state.fed ? t('看看 Momo 的早餐') : t('去准备 Momo 的早餐')} icon="coffee" onPress={() => router.replace('/care')} testID="success-care" />
      <Btn label={t('回到我们的小组')} variant="ghost" icon="users" onPress={() => router.replace('/')} testID="success-home" />
    </Screen>
  );
}
const s = StyleSheet.create({
  reward: { flexDirection: 'row', alignItems: 'center' },
  plus: { fontFamily: fonts.black, fontSize: 34 },
});
