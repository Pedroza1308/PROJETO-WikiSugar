import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Chip, EmptyState, Field, H2, Icon, Paragraph, Screen, TopBar, Txt } from '../components';
import { CHECKIN_POINTS, TEXT_MAX } from '../config/rules';
import { useScreenPadding } from '../hooks/ui';
import { messageFromError } from '../lib/errors';
import { PickedImage, pickImage } from '../lib/images';
import type { RootScreenProps } from '../navigation/types';
import * as checkinService from '../services/checkinService';
import * as groupService from '../services/groupService';
import { useApp } from '../store/AppContext';
import { colors, radius } from '../theme/tokens';
import type { GroupSummary } from '../types';

export function NewCheckinScreen({ navigation, route }: RootScreenProps<'NewCheckin'>) {
  const px = useScreenPadding();
  const { user, refreshToday } = useApp();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [selected, setSelected] = useState<string[]>(route.params?.groupId ? [route.params.groupId] : []);
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let alive = true;
    groupService
      .listMyGroups()
      .then((list) => {
        if (!alive) return;
        setGroups(list);
        // With a single group, pre-select it.
        if (list.length === 1) setSelected([list[0].id]);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setGroups([]);
        setError(messageFromError(e, 'Não foi possível carregar seus grupos.'));
      });
    return () => {
      alive = false;
    };
  }, []);

  const take = async (source: 'camera' | 'library') => {
    setError(null);
    try {
      const picked = await pickImage(source);
      if (picked) setPhoto(picked);
    } catch (e) {
      setError(messageFromError(e));
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const publish = async () => {
    if (!user) return;
    if (!photo) return setError('Adicione uma foto da refeição ou da atividade.');
    if (selected.length === 0) return setError('Escolha pelo menos um grupo.');
    setError(null);
    setPublishing(true);
    try {
      await checkinService.createCheckin({ userId: user.id, photo, caption, groupIds: selected });
      void refreshToday();
      navigation.goBack();
    } catch (e) {
      setError(messageFromError(e, 'Não foi possível publicar. Tente novamente.'));
      setPublishing(false);
    }
  };

  const close = () => navigation.goBack();
  const points = selected.length * CHECKIN_POINTS;

  return (
    <Screen edges={['top', 'bottom']} keyboard>
      <TopBar title="Novo check-in" onBack={close} />
      {groups === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando seus grupos" />
        </View>
      ) : groups.length === 0 && !error ? (
        <View style={[styles.center, { paddingHorizontal: px }]}>
          <EmptyState
            icon="users"
            title="Entre em um grupo primeiro"
            message="Os pontos de cada check-in vão para os grupos que você escolher."
          />
          <Button
            label="Ver grupos"
            onPress={() => navigation.navigate('App', { screen: 'GroupsTab', params: { screen: 'Groups' } })}
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
            <View style={styles.intro}>
              <H2 size={20}>Mostre seu cuidado de hoje</H2>
              <Paragraph size={14}>Uma foto de refeição saudável ou de atividade física. Data e hora são registradas na publicação.</Paragraph>
            </View>

            {photo ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" accessibilityLabel="Foto escolhida" />
                <View style={styles.photoActions}>
                  <Button label="Tirar outra" icon="camera" variant="secondary" onPress={() => void take('camera')} style={styles.flex} minHeight={46} />
                  <Button label="Galeria" icon="image" variant="secondary" onPress={() => void take('library')} style={styles.flex} minHeight={46} />
                </View>
              </View>
            ) : (
              <View style={styles.pickRow}>
                <PickTile icon="camera" label="Tirar foto" onPress={() => void take('camera')} />
                <PickTile icon="image" label="Escolher da galeria" onPress={() => void take('library')} />
              </View>
            )}

            <Field
              label="Legenda (opcional)"
              placeholder="Ex.: Salada com frango grelhado"
              value={caption}
              onChangeText={setCaption}
              maxLength={TEXT_MAX}
              multiline
            />

            <View style={styles.groupBlock}>
              <Txt size={15} weight={800}>
                Publicar em
              </Txt>
              <Txt size={13} color={colors.muted}>
                Os pontos contam só nos grupos marcados.
              </Txt>
              <View style={styles.chips}>
                {(groups ?? []).map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    role="checkbox"
                    selected={selected.includes(g.id)}
                    onPress={() => toggle(g.id)}
                  />
                ))}
              </View>
            </View>

            {error ? <Banner message={error} /> : null}
          </ScrollView>

          <View style={[styles.footer, { paddingHorizontal: px }]}>
            <Txt size={13} weight={800} color={colors.good} align="center" accessibilityLiveRegion="polite">
              {selected.length > 0
                ? `+${points} pontos (${CHECKIN_POINTS} em ${selected.length === 1 ? '1 grupo' : `cada um dos ${selected.length} grupos`})`
                : 'Escolha ao menos um grupo'}
            </Txt>
            <Button label="Publicar check-in" icon="check" onPress={publish} loading={publishing} testID="checkin-publish" />
          </View>
        </>
      )}
    </Screen>
  );
}

function PickTile({ icon, label, onPress }: { icon: 'camera' | 'image'; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.pickTile, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <Icon name={icon} size={30} color={colors.primary} />
      <Txt size={14} weight={800} color={colors.primary} align="center">
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { paddingTop: 20, paddingBottom: 24, gap: 18 },
  intro: { gap: 6 },
  pickRow: { flexDirection: 'row', gap: 12 },
  pickTile: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 160,
    borderRadius: radius.card,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.welcomeOrbDashed,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
  },
  previewWrap: { gap: 10 },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: colors.goalInputBg },
  photoActions: { flexDirection: 'row', gap: 10 },
  groupBlock: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  footer: { paddingTop: 10, paddingBottom: 12, gap: 8, backgroundColor: colors.screenBg, borderTopWidth: 1, borderTopColor: colors.line },
});
