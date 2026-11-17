import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, Field, H1, H2, Icon, Paragraph, Screen, TopBar, Txt } from '../../components';
import { GROUP_MAX_MEMBERS, GROUP_NAME_MAX, GROUP_NAME_MIN, GROUP_PASSWORD_MIN, TEXT_MAX } from '../../config/rules';
import { useScreenPadding } from '../../hooks/ui';
import { messageFromError } from '../../lib/errors';
import type { GroupsScreenProps } from '../../navigation/types';
import * as groupService from '../../services/groupService';
import { colors, radius } from '../../theme/tokens';

type Errors = Partial<Record<'name' | 'description' | 'password' | 'confirm', string>>;

export function CreateGroupScreen({ navigation }: GroupsScreenProps<'CreateGroup'>) {
  const px = useScreenPadding();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string; inviteCode: string } | null>(null);

  const submit = async () => {
    const e: Errors = {};
    const n = name.trim();
    if (n.length < GROUP_NAME_MIN || n.length > GROUP_NAME_MAX) {
      e.name = `Use de ${GROUP_NAME_MIN} a ${GROUP_NAME_MAX} caracteres.`;
    }
    if (description.trim().length > TEXT_MAX) e.description = `Use até ${TEXT_MAX} caracteres.`;
    if (password.length < GROUP_PASSWORD_MIN) e.password = `A senha precisa ter pelo menos ${GROUP_PASSWORD_MIN} caracteres.`;
    if (confirm !== password) e.confirm = 'As senhas não são iguais.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setFormError(null);
    setSaving(true);
    try {
      setCreated(await groupService.createGroup({ name: n, description, password }));
    } catch (err) {
      setFormError(messageFromError(err, 'Não foi possível criar o grupo.'));
    } finally {
      setSaving(false);
    }
  };

  const share = (group: { name: string; inviteCode: string }) =>
    Share.share({
      message:
        `Entre no meu grupo "${group.name}" no WikiSugar!\n` +
        `Código: ${group.inviteCode}\n` +
        'Peça a senha do grupo para mim.',
    });

  if (created) {
    return (
      <Screen>
        <TopBar title="Grupo criado" onBack={() => navigation.popToTop()} />
        <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]}>
          <View style={styles.successIcon}>
            <Icon name="check" size={34} color={colors.good} strokeWidth={2.6} />
          </View>
          <H1 size={24} align="center">
            {created.name} está pronto!
          </H1>
          <Paragraph align="center">
            Compartilhe o código e a senha com até {GROUP_MAX_MEMBERS - 1} pessoas. Quem entrar poderá publicar check-ins e
            disputar o placar do grupo.
          </Paragraph>
          <Card style={styles.codeCard}>
            <Txt size={13} weight={800} color={colors.muted} align="center">
              CÓDIGO DO GRUPO
            </Txt>
            <Txt
              size={34}
              weight={800}
              color={colors.primary}
              align="center"
              ls={6}
              selectable
              accessibilityLabel={`Código do grupo: ${created.inviteCode.split('').join(' ')}`}
            >
              {created.inviteCode}
            </Txt>
            <Txt size={12} color={colors.muted} align="center">
              A senha não aparece aqui: envie-a só para quem você quiser no grupo.
            </Txt>
          </Card>
          <Button label="Compartilhar código" icon="share" onPress={() => void share(created)} />
          <Button
            label="Abrir grupo"
            variant="secondary"
            onPress={() => navigation.replace('GroupDetail', { groupId: created.id, name: created.name })}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <TopBar title="Criar grupo" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: px }]} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <H2 size={20}>Novo grupo</H2>
          <Paragraph size={14}>
            Grupos têm no máximo {GROUP_MAX_MEMBERS} participantes, incluindo você. Para entrar, as pessoas precisam do
            código do grupo e da senha.
          </Paragraph>
        </View>

        {formError ? <Banner message={formError} /> : null}

        <Field
          label="Nome do grupo"
          icon="users"
          placeholder="Ex.: Caminhada da firma"
          value={name}
          onChangeText={setName}
          maxLength={GROUP_NAME_MAX}
          autoCapitalize="sentences"
          error={errors.name}
        />
        <Field
          label="Descrição (opcional)"
          placeholder="Qual é o objetivo do grupo?"
          value={description}
          onChangeText={setDescription}
          maxLength={TEXT_MAX}
          multiline
          error={errors.description}
        />
        <Field
          label="Senha de acesso"
          icon="lock"
          placeholder={`Pelo menos ${GROUP_PASSWORD_MIN} caracteres`}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="off"
          rightIcon={showPassword ? 'eyeOff' : 'eye'}
          onRightIconPress={() => setShowPassword((v) => !v)}
          rightIconLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          error={errors.password}
        />
        <Field
          label="Confirme a senha"
          icon="lock"
          placeholder="Repita a senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="off"
          error={errors.confirm}
        />
        <View style={styles.note}>
          <Icon name="lock" size={18} color={colors.primary} />
          <Txt size={13} weight={700} color={colors.primary} style={styles.flex}>
            A senha é guardada criptografada. Nem você consegue vê-la depois, então anote.
          </Txt>
        </View>

        <Button label="Criar grupo" onPress={submit} loading={saving} testID="group-create" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 32, gap: 16 },
  intro: { gap: 6 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.field,
    padding: 12,
  },
  successIcon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goodBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  codeCard: { gap: 8, paddingVertical: 20 },
});
