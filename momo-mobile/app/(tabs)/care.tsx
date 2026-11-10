import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Room } from '@/components/Art';
import { DemoMenuButton } from '@/components/DemoMenu';
import { Btn, Card, Screen, T, ToggleRow, Wallet, fonts, haptic, styles as ui } from '@/components/UI';

export default function Care() {
  const c = useColors();
  const { state, dispatch, t, name } = useMomo();
  const [bought, setBought] = useState(false);
  const canBuy = state.points >= 10;
  const title = state.fed ? t('早餐收到，心意也收到') : state.pending ? t('这份心意，等待确认') : t('给我们的 Momo 一份早餐');
  const speech = state.fed ? t('谢谢 {name}！今天吃饱啦。', { name }) : state.pending ? t('还没有确认收到哦。') : t('库存归你，照顾属于我们。');
  return (
    <Screen>
      <View style={[ui.rowBetween, { marginTop: 4 }]}>
        <T variant="kicker">{t('Momo 的早餐')}</T>
        <DemoMenuButton />
      </View>
      <T variant="display">{title}</T>
      <Room pose={state.fed ? 'fed' : 'awake'} bowlFull={state.fed} speech={speech} label={t('Momo 的晨光小屋')} />
      <Wallet balance={state.points} stock={state.food} reserved={state.pending} />

      {state.fed ? (
        <Card tone="leaf">
          <View style={ui.row}><Feather name="check-circle" size={18} color={c.primaryDeep} /><T variant="h2">{t('共享 Momo 今日已喂食')}</T></View>
          <T variant="small">{t('贡献者 {name} · 今日不会再消耗食物', { name })}</T>
        </Card>
      ) : state.pending ? (
        <Card tone="orange">
          <View style={ui.row}><Feather name="clock" size={18} color={c.accentText} /><T variant="h2" style={{ color: c.accentText }}>{t('待同步，不是已喂食')}</T></View>
          <T variant="small">{t('已预留1份，库存尚未扣除；确认前不能重复喂。')}</T>
          <Btn label={t('恢复连接并模拟同步')} icon="refresh-cw" variant="accent" onPress={() => { dispatch({ type: 'SYNC' }); haptic('success'); }} testID="sync" />
        </Card>
      ) : (
        <Card>
          <View style={ui.row}><Feather name="coffee" size={18} color={c.primary} /><T variant="h2">{t(state.food > 0 ? '早餐准备好了' : '先准备一份食物')}</T></View>
          {state.offline && <T variant="small" style={{ color: c.accentText }}>{t('离线演示中 · 喂食后会预留食物，等待同步')}</T>}
          <Btn label={state.food > 0 ? t('喂给共享的 Momo · 1份') : t('暂无食物，先去购买')} icon="heart" disabled={state.food < 1}
            onPress={() => { dispatch({ type: 'FEED' }); haptic(state.offline ? 'light' : 'success'); }} testID="feed" />
          <ToggleRow title={t('离线模式')} sub={t(state.offline ? '离线' : '模拟在线')} value={state.offline} onChange={v => dispatch({ type: 'OFFLINE', value: v })} testID="care-offline" />
        </Card>
      )}

      <Card>
        <View style={ui.rowBetween}>
          <View style={ui.flex}>
            <T variant="h2">{t('早餐小铺')}</T>
            <T variant="small">{t('买入个人库存，不会自动喂食')}</T>
          </View>
          <View style={[s.price, { backgroundColor: c.goldSoft }]}><Feather name="star" size={13} color={c.goldText} /><Text style={[s.priceText, { color: c.goldText }]}>{t('10点')}</Text></View>
        </View>
        <T variant="small">{t('食物 · 10点／份')} · {t('为下一次留一份')}</T>
        <Btn label={canBuy ? t('购买1份食物 · 10点') : t('点数不足，暂不可购买')} variant="secondary" icon="shopping-bag" disabled={!canBuy}
          onPress={() => { dispatch({ type: 'BUY' }); setBought(true); setTimeout(() => setBought(false), 1600); }} testID="buy" />
        {!canBuy && <Text style={[s.help, { color: c.goldText }]}>{t('需要10点，当前{n}点。挑战奖励每日仅一次。', { n: state.points })}</Text>}
        {bought && <Text style={[s.help, { color: c.primaryDeep }]}>{t('购买成功 · 库存+1')}</Text>}
      </Card>
    </Screen>
  );
}
const s = StyleSheet.create({
  price: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  priceText: { fontFamily: fonts.black, fontSize: 13 },
  help: { fontFamily: fonts.bold, fontSize: 12.5 },
});
