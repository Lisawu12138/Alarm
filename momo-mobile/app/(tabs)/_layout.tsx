import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { fonts } from '@/components/UI';

type TabDef = { name: string; label: string; sf: SFSymbol; sfSel: SFSymbol; feather: keyof typeof Feather.glyphMap };
const TABS: TabDef[] = [
  { name: 'index', label: '小组', sf: 'person.3', sfSel: 'person.3.fill', feather: 'users' },
  { name: 'alarm', label: '闹钟', sf: 'alarm', sfSel: 'alarm.fill', feather: 'bell' },
  { name: 'voices', label: '语音', sf: 'waveform', sfSel: 'waveform', feather: 'mic' },
  { name: 'care', label: '照顾', sf: 'leaf', sfSel: 'leaf.fill', feather: 'heart' },
  { name: 'settings', label: '设置', sf: 'gearshape', sfSel: 'gearshape.fill', feather: 'settings' },
];

function NativeTabLayout() {
  const { t } = useMomo();
  const c = useColors();
  return (
    <NativeTabs tintColor={c.primaryDeep}>
      {TABS.map(tab => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={{ default: tab.sf, selected: tab.sfSel }} />
          <NativeTabs.Trigger.Label>{t(tab.label)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const c = useColors();
  const { t } = useMomo();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primaryDeep,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : c.card,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: c.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: c.card }]} />,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{
          title: t(tab.label),
          tabBarButtonTestID: `tab-${tab.name}`,
          tabBarIcon: ({ color, focused }) => isIOS
            ? <SymbolView name={focused ? tab.sfSel : tab.sf} tintColor={color as string} size={23} />
            : <Feather name={tab.feather} size={21} color={color as string} />,
        }} />
      ))}
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
