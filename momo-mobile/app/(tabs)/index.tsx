import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { LetterAvatar, ProfileAvatar, Room } from '@/components/Art';
import { DemoMenuButton } from '@/components/DemoMenu';
import { Btn, Card, Screen, T, Wallet, fonts, haptic, styles as ui } from '@/components/UI';
import { personalStatus } from '@/lib/model';

// Demo clock: personal 07:42 Asia/Shanghai == 08:42 Asia/Tokyo (group zone).
// Feeding settles at the next midnight in the group's timezone.
const TOKYO_NOW_SEC = 8 * 3600 + 42 * 60;
const SETTLE_SEC = 24 * 3600;

function useSettleCountdown() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const id = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(id); }, []);
  const left = Math.max(0, SETTLE_SEC - TOKYO_NOW_SEC - elapsed);
  return `${String(Math.floor(left / 3600)).padStart(2, '0')}:${String(Math.floor(left / 60) % 60).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
}

export default function Home() {
  const c = useColors();
  const { state, t, name } = useMomo();
  const countdown = useSettleCountdown();
  const status = personalStatus(state);
  const speech = state.fed ? t('{name}，谢谢你的早餐！', { name }) : state.pending ? t('早餐还在路上，慢慢来。') : t('{name}，今天也一起开始吧。', { name });
  const foodLabel = state.fed ? t('今日已喂食') : state.pending ? t('喂食待同步') : t('等一份早餐');
  const statusTone = (s: string) => (s === '已完成' ? c.primaryDeep : s === '超时未完成' ? c.accentText : c.mutedForeground);
  const members = [
    { key: 'Jenny', time: '07:00', status: '已完成' },
    { key: 'Peter', time: state.settings.time, status },
    { key: 'Ailun', time: '07:30', status: '超时未完成' },
  ];
  return (
    <Screen>
      <View style={[ui.rowBetween, { marginTop: 4 }]}>
        <T variant="kicker">Project Alarm</T>
        <DemoMenuButton />
      </View>
      <View style={ui.rowBetween}>
        <View style={ui.flex}>
          <T variant="display">{t('早安，{name}', { name })}</T>
          <T variant="small">{t('一起，把早晨过好')}</T>
        </View>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel={t('设置')} testID="home-avatar">
          <ProfileAvatar profile={state.profile} size={52} />
        </Pressable>
      </View>

      <View style={ui.rowBetween}>
        <T variant="h2">{t('我们的 Momo')}</T>
        <View style={[s.pill, { backgroundColor: state.fed ? c.secondary : state.pending ? c.accentSoft : c.muted }]}>
          <Feather name={state.fed ? 'check' : state.pending ? 'clock' : 'coffee'} size={12} color={state.fed ? c.primaryDeep : c.accentText} />
          <Text style={[s.pillText, { color: state.fed ? c.primaryDeep : c.accentText }]}>{foodLabel}</Text>
        </View>
      </View>
      <Room pose={state.fed ? 'fed' : 'awake'} bowlFull={state.fed} speech={speech} label={t('Momo 的晨光小屋')} />
      {state.fed && <T variant="small">{t('贡献者 {name} · 今日不会再消耗食物', { name })}</T>}

      <Wallet balance={state.points} stock={state.food} reserved={state.pending} />

      <Card tone="leaf" style={{ gap: 6 }}>
        <View style={ui.rowBetween}>
          <View style={ui.row}><Feather name="globe" size={14} color={c.primaryDeep} /><T variant="label">{t('小组结算 · 东京 00:00')}</T></View>
          <Text style={[s.count, { color: c.primaryDeep }]} accessibilityLabel={`${t('距离结算')} ${countdown}`}>{countdown}</Text>
        </View>
        <T variant="small">{t('小组 · Asia/Tokyo UTC+9')}  ·  {t('个人 · Asia/Shanghai UTC+8')}</T>
        <T variant="small">{t('示例日 · 11月6日 周五')} · {t('演示时钟 · 非实时')}</T>
      </Card>

      <Card>
        <View style={ui.rowBetween}>
          <T variant="h2">{t('今天的小组')}</T>
          <T variant="small">{t('示例好友 · 非真实账号')}</T>
        </View>
        {members.map(m => (
          <View key={m.key} style={[s.member, { borderTopColor: c.border }]}>
            {m.key === 'Peter' ? <ProfileAvatar profile={state.profile} size={38} /> : <LetterAvatar name={m.key} size={38} />}
            <View style={ui.flex}>
              <View style={ui.row}>
                <Text style={[s.memberName, { color: c.foreground }]} numberOfLines={1}>{m.key === 'Peter' ? name : m.key}</Text>
                <Text style={[s.memberTime, { color: c.mutedForeground }]}>{m.time}</Text>
              </View>
              <Text style={[s.memberStatus, { color: statusTone(m.status) }]}>{t(m.status)}</Text>
            </View>
            {m.key === 'Ailun' && (
              <Pressable testID="nudge-ailun" onPress={() => { haptic(); router.push('/voices'); }} accessibilityRole="button" accessibilityLabel={t('叫醒 · 已授权')}
                style={({ pressed }) => [s.nudge, { backgroundColor: c.accentSoft, opacity: pressed ? 0.6 : 1 }]}>
                <Feather name="mic" size={13} color={c.accentText} />
                <Text style={[s.nudgeText, { color: c.accentText }]}>{t('叫醒 · 已授权')}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Card>

      {state.reminder && (
        <View style={[s.reminder, { borderColor: c.gold }]}>
          <Feather name="bell" size={15} color={c.goldText} />
          <T variant="small" style={ui.flex}>{t('本地提醒 · 待演示')} · {t('不会通知或自动响铃')}</T>
        </View>
      )}

      <Card>
        <View style={ui.row}><Feather name="sunrise" size={17} color={c.primary} /><T variant="h2">{t('我的早安约定')}</T></View>
        <View style={ui.rowBetween}>
          <Text style={[s.bigTime, { color: c.foreground }]}>{state.settings.time}</Text>
          <T variant="small" style={{ flexShrink: 1, textAlign: 'right' }}>{t('{n}秒挑战 · {status}', { n: state.settings.duration, status: t(status) })}</T>
        </View>
        <Btn label={state.saved ? t('查看闹钟 · 继续演示') : t('设定我的闹钟')} icon="bell" onPress={() => router.push('/alarm')} testID="home-alarm" />
        <Btn variant="secondary" icon="coffee" testID="home-care"
          label={state.fed ? t('看看 Momo 的早餐') : state.pending ? t('查看待同步早餐') : t('去准备 Momo 的早餐')} onPress={() => router.push('/care')} />
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pillText: { fontFamily: fonts.heavy, fontSize: 12 },
  count: { fontFamily: fonts.black, fontSize: 20, fontVariant: ['tabular-nums'] },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: 1 },
  memberName: { fontFamily: fonts.heavy, fontSize: 15, flexShrink: 1 },
  memberTime: { fontFamily: fonts.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
  memberStatus: { fontFamily: fonts.bold, fontSize: 12.5 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  nudgeText: { fontFamily: fonts.heavy, fontSize: 12 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed' },
  bigTime: { fontFamily: fonts.black, fontSize: 40, letterSpacing: -1, fontVariant: ['tabular-nums'] },
});
