import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useMomo } from '@/context/MomoContext';
import { ProfileAvatar } from '@/components/Art';
import { DemoMenuButton } from '@/components/DemoMenu';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Btn, Card, Chip, Notice, T, VolumeControl, fonts, haptic, styles as ui, useBottomPad, useTopInset } from '@/components/UI';
import { avatarKey, avatars, toneKey, tones, type AvatarKind } from '@/lib/model';

export default function SettingsScreen() {
  const c = useColors();
  const { state, dispatch, t, hydrated } = useMomo();
  const top = useTopInset();
  const bottom = useBottomPad(true);
  const [nick, setNick] = useState(state.profile.nickname);
  const [avatar, setAvatar] = useState<AvatarKind>(state.profile.avatar);
  const [feedback, setFeedback] = useState('');
  const inited = useRef(false);
  useEffect(() => {
    if (hydrated && !inited.current) { inited.current = true; setNick(state.profile.nickname); setAvatar(state.profile.avatar); }
  }, [hydrated, state.profile]);

  const trimmed = nick.trim();
  const nickOk = trimmed.length >= 1 && trimmed.length <= 16;
  const dirty = trimmed !== state.profile.nickname || avatar !== state.profile.avatar;
  const save = () => {
    if (!nickOk) return;
    dispatch({ type: 'PROFILE', profile: { nickname: trimmed, avatar } });
    setNick(trimmed); setFeedback('资料已保存'); haptic('success');
  };
  const cancel = () => { setNick(state.profile.nickname); setAvatar(state.profile.avatar); setFeedback('已取消修改'); };

  return (
    <View style={[ui.flex, { backgroundColor: c.background, paddingTop: top }]}>
      <View style={[ui.rowBetween, { paddingHorizontal: 20, height: 52 }]}>
        <T variant="title">{t('设置')}</T>
        <DemoMenuButton />
      </View>
      <Notice />
      <KeyboardAwareScrollViewCompat bottomOffset={60} contentContainerStyle={[ui.body, { paddingBottom: bottom }]} showsVerticalScrollIndicator={false}>
        <Card tone="leaf" style={ui.row}>
          <ProfileAvatar profile={{ nickname: trimmed || state.profile.nickname, avatar }} size={66} />
          <View style={ui.flex}>
            <T variant="small">{t('你的早晨，你的名字')}</T>
            <T variant="title" numberOfLines={2}>{state.profile.nickname}</T>
          </View>
        </Card>

        <Card>
          <T variant="h2">{t('个人资料')}</T>
          <T variant="label">{t('昵称')}</T>
          <TextInput value={nick} onChangeText={v => { setNick(v); setFeedback(''); }} maxLength={24} testID="nickname"
            accessibilityLabel={t('昵称')} style={[s.input, { borderColor: nickOk ? c.border : c.destructive, color: c.foreground, backgroundColor: c.background }]}
            placeholderTextColor={c.mutedForeground} returnKeyType="done" onSubmitEditing={save} />
          {!nickOk && <Text style={[s.fb, { color: c.destructive }]}>{t('昵称须为1–16个字符')}</Text>}
          <T variant="label">{t('选择头像')}</T>
          <View style={s.avatars}>
            {avatars.map(a => (
              <Pressable key={a} onPress={() => { haptic(); setAvatar(a); setFeedback(''); }} testID={`avatar-${a}`} accessibilityRole="button" accessibilityLabel={t(avatarKey[a])} accessibilityState={{ selected: avatar === a }}
                style={{ alignItems: 'center', gap: 4 }}>
                <View style={[s.avatarRing, { borderColor: avatar === a ? c.primaryDeep : 'transparent' }]}>
                  <ProfileAvatar profile={{ nickname: t(avatarKey[a]), avatar: a }} size={54} />
                </View>
                <T variant="small">{t(avatarKey[a])}</T>
              </Pressable>
            ))}
          </View>
          <View style={ui.row}>
            <View style={ui.flex}><Btn label={t('取消')} variant="ghost" small onPress={cancel} disabled={!dirty} testID="profile-cancel" /></View>
            <View style={ui.flex}><Btn label={t('保存资料')} small onPress={save} disabled={!dirty || !nickOk} testID="profile-save" /></View>
          </View>
          <Text style={[s.fb, { color: c.primaryDeep }]}>{feedback ? t(feedback) : ' '}</Text>
        </Card>

        <Card>
          <T variant="h2">{t('默认闹钟音乐')}</T>
          <View style={ui.row}>
            {tones.map(tn => <Chip key={tn} label={t(toneKey[tn])} selected={state.settings.tone === tn} onPress={() => dispatch({ type: 'TONE', value: tn })} testID={`tone-${tn}`} />)}
          </View>
          <T variant="small">{t('仅本地预设名称，不播放音频')}</T>
        </Card>

        <Card>
          <VolumeControl value={state.settings.volume} onChange={v => dispatch({ type: 'VOLUME', value: v })} />
          <T variant="small">{t('所有演示闹钟共用此音量')}</T>
        </Card>

        <Card>
          <T variant="h2">{t('语言')}</T>
          <View style={ui.row}>
            <Chip label="简体中文" selected={state.language === 'zh'} onPress={() => dispatch({ type: 'LANGUAGE', value: 'zh' })} testID="lang-zh" />
            <Chip label="English" selected={state.language === 'en'} onPress={() => dispatch({ type: 'LANGUAGE', value: 'en' })} testID="lang-en" />
          </View>
        </Card>

        <Pressable onPress={() => router.push('/about')} testID="open-about" accessibilityRole="button" accessibilityLabel={t('关于本原型')}
          style={({ pressed }) => [s.aboutRow, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="info" size={18} color={c.primary} />
          <View style={ui.flex}><T variant="label">{t('关于本原型')}</T><T variant="small">{t('版本 0.1.0 Demo')}</T></View>
          <Feather name="chevron-right" size={18} color={c.mutedForeground} />
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
const s = StyleSheet.create({
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.bold, fontSize: 16 },
  fb: { fontFamily: fonts.bold, fontSize: 12.5, minHeight: 17 },
  avatars: { flexDirection: 'row', justifyContent: 'space-around' },
  avatarRing: { borderWidth: 2.5, borderRadius: 34, padding: 3 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1 },
});
