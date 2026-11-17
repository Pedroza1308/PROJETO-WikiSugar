import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, EmptyState, Field, H2, Icon, IconTile, Paragraph, Screen, TopBar, Txt } from '../../components';
import { GROUP_MAX_MEMBERS } from '../../config/rules';
import { useScreenPadding } from '../../hooks/ui';
import { messageFromError } from '../../lib/errors';
import type { GroupsScreenProps } from '../../navigation/types';
import * as groupService from '../../services/groupService';
import { colors, radius, shadows } from '../../theme/tokens';
import type { GroupSearchResult } from '../../types';

const DEBOUNCE_MS = 350;

export function JoinGroupScreen({ navigation }: GroupsScreenProps<'JoinGroup'>) {
  const px = useScreenPadding();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GroupSearchResult | null>(null);
  const [password, setPassword] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const requestId = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const id = ++requestId.current;
    setSearching(true);
    try {
      const found = await groupService.searchGroups(q);
      if (id !== requestId.current) return;
      setResults(found);
      setSearchError(null);
    } catch (e) {
      if (id === requestId.current) setSearchError(messageFromError(e, 'Não foi possível buscar grupos.'));
    } finally {
      if (id === requestId.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    setSelected(null);
    setJoinError(null);
    if (q.length < 2) {
      requestId.current++;
      setResults(null);
      setSearching(false);
      return;
    }
    const t = setTimeout(() => void runSearch(q), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const select = (group: GroupSearchResult) => {
    if (group.isMember) {
      navigation.replace('GroupDetail', { groupId: group.id, name: group.name });
      return;
    }
    setSelected((s) => (s?.id === group.id ? null : group));
    setPassword('');
    setJoinError(null);
  };

  const join = async () => {
    if (!selected) return;
    if (!password) return setJoinError('Digite a senha do grupo.');
    setJoining(true);
    setJoinError(null);
    try {
      const result = await groupService.joinGroup(selected.id, password);
      if (result === 'OK' || result === 'ALREADY_MEMBER') {
        navigation.replace('GroupDetail', { groupId: selected.id, name: selected.name });
        return;
      }
      setJoinError(groupService.JOIN_MESSAGES[result]);
      if (result === 'GROUP_FULL') {
        setResults((rs) => rs?.map((r) => (r.id === selected.id ? { ...r, isFull: true, memberCount: r.maxMembers } : r)) ?? rs);
      }
    } catch (e) {
      setJoinError(messageFromError(e, 'Não foi possível entrar no grupo.'));
    } finally {
      setJoining(false);
    }
  };

  return (
    <Screen keyboard>
      <TopBar title="Entrar em um grupo" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <H2 size={20}>Encontre o grupo</H2>
          <Paragraph size={14}>Busque pelo código de convite (ex.: K7M2QX) ou pelo nome. Depois, digite a senha.</Paragraph>
        </View>

        <Field
          icon="search"
          placeholder="Código ou nome do grupo"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar grupo por código ou nome"
          onSubmitEditing={() => query.trim().length >= 2 && void runSearch(query.trim())}
        />

        {searching ? (
          <View style={styles.loading} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.primary} />
            <Txt size={14} weight={700} color={colors.muted}>
              Buscando…
            </Txt>
          </View>
        ) : null}

        {searchError ? <Banner message={searchError} /> : null}

        {!searching && results && results.length === 0 ? (
          <EmptyState
            icon="users"
            title="Nenhum grupo encontrado"
            message="Confira o código com quem criou o grupo. Ele tem 6 letras e números."
          />
        ) : null}

        {results && results.length > 0 ? (
          <View style={styles.list}>
            {results.map((g) => {
              const open = selected?.id === g.id;
              return (
                <View key={g.id} style={[styles.card, open && styles.cardOpen]}>
                  <Pressable
                    onPress={() => select(g)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${g.name}, código ${g.inviteCode}. ${g.memberCount} de ${g.maxMembers} participantes.${
                      g.isFull ? ' Grupo lotado.' : ''
                    }${g.isMember ? ' Você já participa.' : ''}`}
                    style={styles.cardHead}
                  >
                    <IconTile
                      name="users"
                      size={44}
                      color={g.isFull && !g.isMember ? colors.muted : colors.primary}
                      bg={g.isFull && !g.isMember ? colors.goalInputBg : colors.primarySoft}
                    />
                    <View style={styles.flex}>
                      <Txt size={16} weight={800} numberOfLines={1}>
                        {g.name}
                      </Txt>
                      <Txt size={13} color={colors.muted}>
                        #{g.inviteCode} · {g.memberCount}/{g.maxMembers} participantes
                      </Txt>
                      {g.isMember ? (
                        <Txt size={12} weight={800} color={colors.good}>
                          Você já participa · toque para abrir
                        </Txt>
                      ) : g.isFull ? (
                        <Txt size={12} weight={800} color={colors.danger}>
                          Lotado
                        </Txt>
                      ) : null}
                    </View>
                    <Icon name="chevron" size={20} color={colors.muted} />
                  </Pressable>

                  {open ? (
                    <View style={styles.cardBody}>
                      {g.description ? (
                        <Txt size={14} color={colors.muted}>
                          {g.description}
                        </Txt>
                      ) : null}
                      {g.isFull ? (
                        <Banner
                          title="Grupo lotado"
                          message={`Este grupo atingiu o limite de ${GROUP_MAX_MEMBERS} participantes. Não é possível entrar.`}
                        />
                      ) : (
                        <>
                          <Field
                            label="Senha do grupo"
                            icon="lock"
                            placeholder="Digite a senha"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="off"
                            onSubmitEditing={join}
                          />
                          {joinError ? <Banner message={joinError} /> : null}
                          <Button label="Entrar no grupo" onPress={join} loading={joining} testID="group-join" />
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 32, gap: 16 },
  intro: { gap: 6 },
  loading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    ...shadows.card,
  },
  cardOpen: { borderColor: colors.mealOpenBorder, borderWidth: 1.5 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, minHeight: 70 },
  cardBody: { gap: 12, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
