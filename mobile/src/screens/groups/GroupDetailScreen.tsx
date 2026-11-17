import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, Share, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  H1,
  Icon,
  Paragraph,
  Screen,
  SegmentedControl,
  TopBar,
  Txt,
} from '../../components';
import { useScreenPadding } from '../../hooks/ui';
import { messageFromError } from '../../lib/errors';
import type { GroupsScreenProps } from '../../navigation/types';
import * as checkinService from '../../services/checkinService';
import * as groupService from '../../services/groupService';
import { useApp } from '../../store/AppContext';
import { colors, radius, shadows } from '../../theme/tokens';
import type { FeedItem, GroupSummary, LeaderboardEntry } from '../../types';
import { formatDateTime, formatDateTimeLong, formatNumber, initialsFrom } from '../../utils/format';

const TABS = ['Feed', 'Ranking'] as const;
type Tab = (typeof TABS)[number];

export function GroupDetailScreen({ navigation, route }: GroupsScreenProps<'GroupDetail'>) {
  const px = useScreenPadding();
  const { user } = useApp();
  const { groupId } = route.params;
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [notMember, setNotMember] = useState(false);
  const [tab, setTab] = useState<Tab>('Feed');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedEnd, setFeedEnd] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingMoreRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const [g, items, ranking] = await Promise.all([
        groupService.getGroup(groupId),
        checkinService.getGroupFeed(groupId),
        groupService.getLeaderboard(groupId),
      ]);
      setGroup(g);
      setNotMember(!g);
      setFeed(items);
      setFeedEnd(items.length < checkinService.FEED_PAGE_SIZE);
      setBoard(ranking);
      setError(null);
    } catch (e) {
      setError(messageFromError(e, 'Não foi possível carregar o grupo.'));
    } finally {
      setLoaded(true);
    }
  }, [groupId]);

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

  const loadMore = async () => {
    if (tab !== 'Feed' || feedEnd || loadingMoreRef.current || feed.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const older = await checkinService.getGroupFeed(groupId, feed[feed.length - 1].createdAt);
      setFeed((f) => [...f, ...older.filter((o) => !f.some((x) => x.checkinId === o.checkinId))]);
      setFeedEnd(older.length < checkinService.FEED_PAGE_SIZE);
    } catch {
      // keep what we have; the user can pull to refresh
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  const title = group?.name ?? route.params.name ?? 'Grupo';
  const back = () => navigation.goBack();

  if (!loaded) {
    return (
      <Screen>
        <TopBar title={title} onBack={back} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando grupo" />
        </View>
      </Screen>
    );
  }

  if (error && !group) {
    return (
      <Screen>
        <TopBar title={title} onBack={back} />
        <ErrorState title="Algo deu errado" message={error} action={{ label: 'Tentar de novo', onPress: () => void load() }} />
      </Screen>
    );
  }

  if (notMember || !group) {
    return (
      <Screen>
        <TopBar title={title} onBack={back} />
        <EmptyState icon="lock" title="Grupo restrito" message="Só participantes veem o feed e o placar deste grupo." />
      </Screen>
    );
  }

  const share = () =>
    Share.share({
      message: `Entre no grupo "${group.name}" no WikiSugar!\nCódigo: ${group.inviteCode}\nPeça a senha a quem te convidou.`,
    });

  const header = (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <H1 size={24}>{group.name}</H1>
        {group.description ? <Paragraph size={14}>{group.description}</Paragraph> : null}
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.flex}>
            <Txt size={12} weight={800} color={colors.muted}>
              CÓDIGO
            </Txt>
            <Txt size={20} weight={800} color={colors.primary} ls={3} selectable accessibilityLabel={`Código ${group.inviteCode.split('').join(' ')}`}>
              {group.inviteCode}
            </Txt>
          </View>
          <View style={styles.flex}>
            <Txt size={12} weight={800} color={colors.muted}>
              PARTICIPANTES
            </Txt>
            <Txt size={20} weight={800} color={group.memberCount >= group.maxMembers ? colors.danger : colors.ink}>
              {group.memberCount}/{group.maxMembers}
            </Txt>
          </View>
          <View style={styles.flex}>
            <Txt size={12} weight={800} color={colors.muted}>
              VOCÊ
            </Txt>
            <Txt size={20} weight={800}>
              {group.myRank}º · {formatNumber(group.myPoints)}
            </Txt>
          </View>
        </View>
        {group.memberCount >= group.maxMembers ? (
          <Txt size={12} weight={700} color={colors.danger}>
            Grupo lotado: ninguém mais consegue entrar.
          </Txt>
        ) : null}
        <Button label="Compartilhar código" icon="share" variant="secondary" onPress={() => void share()} minHeight={46} />
      </Card>

      <Button
        label="Novo check-in neste grupo"
        icon="camera"
        onPress={() => navigation.navigate('NewCheckin', { groupId: group.id })}
        testID="group-checkin"
      />

      <SegmentedControl options={TABS} value={tab} onChange={setTab} accessibilityLabel="Ver feed ou ranking" />
    </View>
  );

  if (tab === 'Ranking') {
    return (
      <Screen>
        <TopBar title={title} onBack={back} />
        <FlatList
          data={board}
          keyExtractor={(r) => r.userId}
          ListHeaderComponent={header}
          contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => <RankRow entry={item} isMe={item.userId === user?.id} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListFooterComponent={
            <Txt size={12} color={colors.muted} align="center" style={styles.footnote}>
              Pontos valem só neste grupo: cada check-in publicado aqui soma +10.
            </Txt>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={title} onBack={back} />
      <FlatList
        data={feed}
        keyExtractor={(f) => f.checkinId}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingHorizontal: px }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => <FeedCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            icon="camera"
            title="Nenhum check-in ainda"
            message="Publique a primeira foto de uma refeição saudável ou atividade e saia na frente."
          />
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footnote} /> : undefined}
      />
    </Screen>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  return (
    <View
      style={styles.feedCard}
      accessible
      accessibilityLabel={`${item.authorName}, ${formatDateTimeLong(item.createdAt)}. ${item.caption ?? 'Sem legenda'}. Mais ${item.points} pontos.`}
    >
      <View style={styles.feedHead}>
        <Avatar initials={initialsFrom(item.authorName)} uri={item.authorAvatarUrl} size={40} />
        <View style={styles.flex}>
          <Txt size={15} weight={800} numberOfLines={1}>
            {item.authorName}
          </Txt>
          <Txt size={12} color={colors.muted}>
            {formatDateTime(item.createdAt)}
          </Txt>
        </View>
        <View style={styles.pointsPill}>
          <Txt size={13} weight={800} color={colors.good}>
            +{item.points} pts
          </Txt>
        </View>
      </View>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.photo, styles.photoMissing]}>
          <Icon name="image" size={28} color={colors.muted} />
        </View>
      )}
      {item.caption ? (
        <Txt size={15} lh={1.4}>
          {item.caption}
        </Txt>
      ) : null}
    </View>
  );
}

function RankRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const medal = entry.place <= 3 && entry.points > 0;
  return (
    <View
      style={[styles.rankRow, isMe && styles.rankMe]}
      accessible
      accessibilityLabel={`${entry.place}º lugar: ${entry.name}${isMe ? ' (você)' : ''}, ${entry.points} pontos em ${entry.checkinCount} check-ins.`}
    >
      <View style={[styles.place, medal && styles.placeMedal]}>
        <Txt size={15} weight={800} color={medal ? colors.white : colors.ink}>
          {entry.place}
        </Txt>
      </View>
      <Avatar initials={initialsFrom(entry.name)} uri={entry.avatarUrl} size={40} />
      <View style={styles.flex}>
        <Txt size={15} weight={800} numberOfLines={1}>
          {entry.name}
          {isMe ? ' (você)' : ''}
        </Txt>
        <Txt size={12} color={colors.muted}>
          {entry.checkinCount} {entry.checkinCount === 1 ? 'check-in' : 'check-ins'}
          {entry.role === 'owner' ? ' · criou o grupo' : ''}
        </Txt>
      </View>
      <Txt size={17} weight={800} color={colors.primary}>
        {formatNumber(entry.points)}
        <Txt size={12} weight={700} color={colors.muted}>
          {' '}
          pts
        </Txt>
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 20, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 14 },
  titleBlock: { gap: 4 },
  infoCard: { gap: 12 },
  infoRow: { flexDirection: 'row', gap: 8 },
  sep: { height: 12 },
  footnote: { marginTop: 16 },
  feedCard: {
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 12,
    ...shadows.card,
  },
  feedHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointsPill: { backgroundColor: colors.goodBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, backgroundColor: colors.goalInputBg },
  photoMissing: { alignItems: 'center', justifyContent: 'center' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 12,
  },
  rankMe: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  place: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.goalInputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeMedal: { backgroundColor: colors.primary },
});
