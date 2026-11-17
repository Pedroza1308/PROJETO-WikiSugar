import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, Eyebrow, H1, Icon, IconTile, Paragraph, Screen, Txt } from '../../components';
import { CHECKIN_POINTS } from '../../config/rules';
import { useScreenPadding } from '../../hooks/ui';
import { messageFromError } from '../../lib/errors';
import type { GroupsScreenProps } from '../../navigation/types';
import * as groupService from '../../services/groupService';
import { colors, radius, shadows } from '../../theme/tokens';
import type { GroupSummary } from '../../types';
import { formatNumber } from '../../utils/format';

export function GroupsScreen({ navigation }: GroupsScreenProps<'Groups'>) {
  const px = useScreenPadding();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await groupService.listMyGroups());
      setError(null);
    } catch (e) {
      setError(messageFromError(e, 'Não foi possível carregar seus grupos.'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.intro}>
          <Eyebrow>Grupos</Eyebrow>
          <H1 size={26}>Cuidar junto é mais leve</H1>
          <Paragraph>
            Publique fotos de refeições saudáveis ou atividades e ganhe {CHECKIN_POINTS} pontos em cada grupo escolhido.
          </Paragraph>
        </View>

        <View style={styles.actions}>
          <Button label="Criar grupo" icon="plus" onPress={() => navigation.navigate('CreateGroup')} style={styles.flex} minHeight={48} />
          <Button
            label="Entrar"
            icon="search"
            variant="secondary"
            onPress={() => navigation.navigate('JoinGroup')}
            style={styles.flex}
            minHeight={48}
            accessibilityLabel="Entrar em um grupo"
          />
        </View>

        {groups && groups.length > 0 ? (
          <Button
            label="Fazer check-in com foto"
            icon="camera"
            variant="secondary"
            onPress={() => navigation.navigate('NewCheckin')}
            minHeight={48}
          />
        ) : null}

        {error && !groups ? (
          <ErrorState title="Algo deu errado" message={error} action={{ label: 'Tentar de novo', onPress: () => void load() }} />
        ) : groups === null ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando grupos" />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="users"
            title="Você ainda não está em nenhum grupo"
            message="Crie um grupo e compartilhe o código, ou entre em um grupo com o código e a senha que recebeu."
          />
        ) : (
          <View style={styles.list}>
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} onPress={() => navigation.navigate('GroupDetail', { groupId: g.id, name: g.name })} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function GroupCard({ group, onPress }: { group: GroupSummary; onPress: () => void }) {
  const full = group.memberCount >= group.maxMembers;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}. ${group.memberCount} de ${group.maxMembers} participantes. Você tem ${group.myPoints} pontos e está em ${group.myRank}º lugar.`}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.primaryPale }]}
    >
      <IconTile name="users" size={46} />
      <View style={styles.flex}>
        <Txt size={16} weight={800} numberOfLines={1}>
          {group.name}
        </Txt>
        <Txt size={13} color={colors.muted}>
          {group.memberCount}/{group.maxMembers} participantes{full ? ' · lotado' : ''}
          {group.role === 'owner' ? ' · você criou' : ''}
        </Txt>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Icon name="trophy" size={15} color={colors.primary} />
            <Txt size={13} weight={800} color={colors.primary}>
              {group.myRank}º lugar
            </Txt>
          </View>
          <Txt size={13} weight={800}>
            {formatNumber(group.myPoints)} pts
          </Txt>
        </View>
      </View>
      <Icon name="chevron" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 24, paddingBottom: 32, gap: 16 },
  intro: { gap: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  loading: { paddingVertical: 40, alignItems: 'center' },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 13,
    ...shadows.card,
  },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
