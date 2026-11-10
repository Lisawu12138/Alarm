import React, { useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';

export const fonts = {
  regular: 'Nunito_400Regular', semibold: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', heavy: 'Nunito_800ExtraBold', black: 'Nunito_900Black',
};
export type Colors = ReturnType<typeof useColors>;

export function haptic(kind: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success' || kind === 'warning') {
    Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } else {
    Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? 67 : insets.top;
}
export function useBottomPad(tabs: boolean) {
  const insets = useSafeAreaInsets();
  if (tabs) return Platform.OS === 'web' ? 84 + 24 : insets.bottom + 90;
  return (Platform.OS === 'web' ? 34 : insets.bottom) + 24;
}

export function T({ children, style, variant = 'body', numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; variant?: 'display' | 'title' | 'h2' | 'body' | 'small' | 'kicker' | 'label'; numberOfLines?: number }) {
  const c = useColors();
  const v = textVariants[variant];
  return <Text numberOfLines={numberOfLines} style={[v, { color: variant === 'small' || variant === 'kicker' ? c.mutedForeground : c.foreground }, variant === 'kicker' && { color: c.primaryDeep }, style]}>{children}</Text>;
}
const textVariants = StyleSheet.create({
  display: { fontFamily: fonts.black, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  title: { fontFamily: fonts.black, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19 },
  small: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 18 },
  kicker: { fontFamily: fonts.heavy, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});

export function Screen({ children, tabs = true, title, back, right, scroll = true }: { children: ReactNode; tabs?: boolean; title?: string; back?: boolean; right?: ReactNode; scroll?: boolean }) {
  const c = useColors();
  const top = useTopInset();
  const bottom = useBottomPad(tabs);
  const header = (title || back || right) ? <Header title={title} back={back} right={right} /> : null;
  return (
    <View style={[styles.flex, { backgroundColor: c.background, paddingTop: top }]}>
      {header}
      <Notice />
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottom }]} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      ) : (
        <View style={[styles.flex, styles.body, { paddingBottom: bottom }]}>{children}</View>
      )}
    </View>
  );
}

export function Header({ title, back, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const c = useColors();
  const { t } = useMomo();
  return (
    <View style={styles.header}>
      {back ? (
        <IconBtn name="arrow-left" label={t('返回')} testID="back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      ) : <View style={{ width: 40 }} />}
      <Text style={[styles.headerTitle, { color: c.foreground }]} numberOfLines={1}>{title}</Text>
      {right ?? <View style={{ width: 40 }} />}
    </View>
  );
}

export function IconBtn({ name, label, onPress, testID, color }: { name: keyof typeof Feather.glyphMap; label: string; onPress: () => void; testID?: string; color?: string }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} testID={testID} hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.5 : 1 }]}>
      <Feather name={name} size={22} color={color ?? c.foreground} />
    </Pressable>
  );
}

export function Card({ children, style, tone = 'card' }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'card' | 'leaf' | 'orange' | 'gold' }) {
  const c = useColors();
  const bg = tone === 'leaf' ? c.secondary : tone === 'orange' ? c.accentSoft : tone === 'gold' ? c.goldSoft : c.card;
  return <View style={[styles.card, { backgroundColor: bg, borderColor: tone === 'card' ? c.border : 'transparent', shadowColor: c.shadow }, style]}>{children}</View>;
}

export function Btn({ label, onPress, variant = 'primary', icon, disabled, testID, small, a11yHint }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'; icon?: keyof typeof Feather.glyphMap; disabled?: boolean; testID?: string; small?: boolean; a11yHint?: string }) {
  const c = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const bg = { primary: c.primary, secondary: c.secondary, accent: c.accent, ghost: 'transparent', danger: c.accentSoft }[variant];
  const fg = { primary: c.primaryForeground, secondary: c.secondaryForeground, accent: c.accentForeground, ghost: c.primaryDeep, danger: c.destructive }[variant];
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={() => { haptic(variant === 'primary' || variant === 'accent' ? 'medium' : 'light'); onPress(); }} disabled={disabled}
      onPressIn={() => to(0.97)} onPressOut={() => to(1)} testID={testID} accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={a11yHint} accessibilityState={{ disabled: !!disabled }}>
      <Animated.View style={[styles.btn, small && styles.btnSmall, { backgroundColor: bg, opacity: disabled ? 0.45 : 1, transform: [{ scale }] }, variant === 'ghost' && { borderWidth: 1, borderColor: c.border }]}>
        {icon && <Feather name={icon} size={small ? 15 : 18} color={fg} />}
        <Text style={[styles.btnText, small && { fontSize: 13.5 }, { color: fg }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID, a11y }: { label: string; selected: boolean; onPress: () => void; testID?: string; a11y?: string }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} testID={testID} accessibilityRole="button" accessibilityLabel={a11y ?? label} accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.secondary : c.card, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[styles.chipText, { color: selected ? c.primaryDeep : c.foreground, fontFamily: selected ? fonts.heavy : fonts.semibold }]}>{label}</Text>
    </Pressable>
  );
}

export function ToggleRow({ title, sub, value, onChange, testID }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const c = useColors();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.flex}>
        <T variant="label">{title}</T>
        {!!sub && <T variant="small">{sub}</T>}
      </View>
      <Switch value={value} onValueChange={v => { haptic(); onChange(v); }} testID={testID} accessibilityLabel={title}
        trackColor={{ false: c.track, true: c.primary }} thumbColor={c.card} ios_backgroundColor={c.track} />
    </View>
  );
}

export function Wallet({ balance, stock, reserved }: { balance: number; stock: number; reserved: boolean }) {
  const c = useColors();
  const { t } = useMomo();
  return (
    <View style={[styles.wallet, { backgroundColor: c.card, borderColor: c.border }]} accessible accessibilityLabel={`${t('我的点数')} ${balance} · ${t(reserved ? '已预留' : '库存')} ${stock} ${t('份')}`}>
      <View style={styles.walletHalf}>
        <Feather name="star" size={18} color={c.gold} />
        <T variant="small">{t('我的点数')}</T>
        <Text style={[styles.walletNum, { color: c.foreground }]}>{balance}</Text>
      </View>
      <View style={[styles.walletDivider, { backgroundColor: c.border }]} />
      <View style={styles.walletHalf}>
        <Feather name="coffee" size={18} color={c.accent} />
        <T variant="small">{t(reserved ? '已预留' : '库存')}</T>
        <Text style={[styles.walletNum, { color: c.foreground }]}>{stock}</Text>
        <T variant="small">{t('份')}</T>
      </View>
    </View>
  );
}

export function VolumeControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const c = useColors();
  const { t } = useMomo();
  const [w, setW] = useState(1);
  const wRef = useRef(1); wRef.current = w;
  const cb = useRef(onChange); cb.current = onChange;
  const startX = useRef(0);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { startX.current = e.nativeEvent.locationX; cb.current(Math.round((startX.current / wRef.current) * 100)); },
    onPanResponderMove: (_, g) => cb.current(Math.max(0, Math.min(100, Math.round(((startX.current + g.dx) / wRef.current) * 100)))),
  })).current;
  const step = (d: number) => onChange(Math.max(0, Math.min(100, value + d)));
  return (
    <View>
      <View style={styles.rowBetween}>
        <View style={styles.row}><Feather name="volume-2" size={17} color={c.primaryDeep} /><T variant="label">{t('应用内演示音量')}</T></View>
        <Text style={[styles.mono, { color: c.foreground }]}>{value}%</Text>
      </View>
      <View style={[styles.row, { marginTop: 8 }]}>
        <IconBtn name="minus" label={t('降低音量')} onPress={() => step(-10)} testID="vol-down" />
        <View style={[styles.flex, { height: 36, justifyContent: 'center' }]} onLayout={e => setW(e.nativeEvent.layout.width || 1)} {...pan.panHandlers}
          accessible accessibilityRole="adjustable" accessibilityLabel={t('应用内演示音量')} accessibilityValue={{ min: 0, max: 100, now: value, text: `${value}%` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={e => step(e.nativeEvent.actionName === 'increment' ? 10 : -10)} testID="volume-slider">
          <View pointerEvents="none" style={[styles.track, { backgroundColor: c.track }]}>
            <View style={[styles.trackFill, { width: `${value}%`, backgroundColor: c.primary }]} />
          </View>
          <View pointerEvents="none" style={[styles.thumb, { left: `${value}%`, backgroundColor: c.card, borderColor: c.primary }]} />
        </View>
        <IconBtn name="plus" label={t('提高音量')} onPress={() => step(10)} testID="vol-up" />
      </View>
    </View>
  );
}

export function Notice() {
  const c = useColors();
  const { storageNotice, dismissNotice, t } = useMomo();
  if (!storageNotice) return null;
  return (
    <Pressable onPress={dismissNotice} accessibilityRole="button" style={[styles.notice, { backgroundColor: c.accentSoft }]}>
      <Feather name="alert-circle" size={15} color={c.accentText} />
      <Text style={[styles.flex, styles.noticeText, { color: c.accentText }]}>{t(storageNotice)}</Text>
      <Feather name="x" size={15} color={c.accentText} />
    </Pressable>
  );
}

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.scrim, { backgroundColor: c.scrim }]} onPress={onClose} accessibilityLabel="close" />
      <View style={[styles.sheet, { backgroundColor: c.card, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 18 }]}>{children}</View>
    </Modal>
  );
}

export function Confirm({ visible, title, body, confirm, cancel, onConfirm, onCancel }: { visible: boolean; title: string; body: string; confirm: string; cancel: string; onConfirm: () => void; onCancel: () => void }) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.center, { backgroundColor: c.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: c.card }]}>
          <T variant="title">{title}</T>
          <T variant="small" style={{ fontSize: 14, lineHeight: 20 }}>{body}</T>
          <Btn label={confirm} onPress={onConfirm} variant="accent" testID="confirm-yes" />
          <Btn label={cancel} onPress={onCancel} variant="ghost" testID="confirm-no" />
        </View>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.black, fontSize: 18 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 22, padding: 16, borderWidth: 1, gap: 10, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  btn: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSmall: { minHeight: 38, borderRadius: 12, paddingHorizontal: 12 },
  btnText: { fontFamily: fonts.heavy, fontSize: 15.5, textAlign: 'center', flexShrink: 1 },
  chip: { flexGrow: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center' },
  chipText: { fontSize: 13.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wallet: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  walletHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletDivider: { width: 1, height: 26, marginHorizontal: 10 },
  walletNum: { fontFamily: fonts.black, fontSize: 22, fontVariant: ['tabular-nums'] },
  mono: { fontFamily: fonts.black, fontSize: 15, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: 8 },
  thumb: { position: 'absolute', width: 22, height: 22, marginLeft: -11, borderRadius: 11, borderWidth: 3 },
  notice: { marginHorizontal: 20, marginBottom: 8, padding: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { fontFamily: fonts.semibold, fontSize: 12.5 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  dialog: { width: '100%', maxWidth: 360, borderRadius: 26, padding: 22, gap: 12 },
});
