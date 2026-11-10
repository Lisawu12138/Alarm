import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { Btn, Confirm, Sheet, T, ToggleRow, fonts, haptic, styles } from '@/components/UI';

export function DemoMenuButton() {
  const c = useColors();
  const { state, dispatch, t } = useMomo();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const go = (path: '/care' | '/receiver') => { setOpen(false); router.push(path); };
  return (
    <>
      <Pressable onPress={() => { haptic(); setOpen(true); }} testID="demo-options" accessibilityRole="button" accessibilityLabel={t('演示选项')}
        style={({ pressed }) => [styles.row, { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.secondary, opacity: pressed ? 0.6 : 1 }]}>
        <Feather name="sliders" size={13} color={c.primaryDeep} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: c.primaryDeep }}>{t(state.offline ? '离线' : '本地演示')}</Text>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <View style={styles.rowBetween}>
          <T variant="title">{t('探索其他状态')}</T>
          <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel={t('收起')} hitSlop={10}><Feather name="x" size={22} color={c.foreground} /></Pressable>
        </View>
        <ToggleRow title={t('离线模式')} sub={t('离线喂食 · 预留后等待同步')} value={state.offline} onChange={v => dispatch({ type: 'OFFLINE', value: v })} testID="toggle-offline" />
        <ToggleRow title={t('本地提醒')} sub={t('不会通知或自动响铃')} value={state.reminder} onChange={v => dispatch({ type: 'REMINDER', value: v })} testID="toggle-reminder" />
        <Btn label={t('去早餐页 · 体验待同步')} variant="secondary" icon="coffee" onPress={() => go('/care')} small />
        <Btn label={state.settings.allowed ? t('演示我的接收端') : t('接收端已禁用 · 授权关闭')} variant="secondary" icon="radio" onPress={() => go('/receiver')} small disabled={!state.settings.allowed} />
        <Btn label={t('重置本次演示')} variant="danger" icon="rotate-ccw" onPress={() => setConfirm(true)} small testID="reset-demo" />
      </Sheet>
      <Confirm visible={confirm} title={t('重新开始这个早晨？')} body={t('清除本次设置与记录，恢复20点、0份食物。仅影响这个本地演示。')}
        confirm={t('确认重置演示')} cancel={t('保留记录，继续体验')} onCancel={() => setConfirm(false)}
        onConfirm={() => { const lang = state.language; dispatch({ type: 'RESET' }); dispatch({ type: 'LANGUAGE', value: lang }); haptic('warning'); setConfirm(false); setOpen(false); }} />
    </>
  );
}
