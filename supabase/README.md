# Backend WikiSugar (Supabase)

Tudo o que o app precisa no Supabase está nos 4 arquivos de `migrations/`. Eles
criam as tabelas, as regras de segurança (RLS), as funções chamadas pelo app,
os buckets de fotos e a base nutricional TACO.

## 1. Rodar os SQL (uma vez por projeto)

No [Dashboard do Supabase](https://supabase.com/dashboard), abra o projeto e vá em
**SQL Editor › New query**. Cole o conteúdo de cada arquivo e clique em **Run**,
**nesta ordem**:

| # | Arquivo | O que cria |
|---|---------|------------|
| 1 | `20261116000100_schema.sql` | Tabelas, gatilhos (perfil automático no cadastro, limite de 10 membros, cálculo nutricional) e RLS |
| 2 | `20261116000200_functions.sql` | Funções do app: grupos, senha, ranking, feed, check-in, histórico, busca de alimentos |
| 3 | `20261116000300_storage.sql` | Buckets `avatars` (público) e `checkins` (privado) e as regras de acesso às fotos |
| 4 | `20261116000400_taco_foods_data.sql` | Os 597 alimentos da Tabela TACO (NEPA/UNICAMP, 4ª ed.) |

Os scripts podem ser executados de novo sem erro. Para conferir, em
**Table Editor** devem aparecer `profiles`, `groups`, `group_members`,
`checkins`, `checkin_groups`, `foods` (597 linhas), `journal_entries` e `meal_items`.

> Com a [Supabase CLI](https://supabase.com/docs/guides/cli) o mesmo vale para
> `supabase link --project-ref <id>` e depois `supabase db push`.

**Se der erro:** cada arquivo roda numa única transação. Se algo falhar, nada é
aplicado e dá para rodar de novo. Se o projeto já tinha uma tabela
`public.profiles` de rascunho com outras colunas, o `01_schema` resolve sozinho:
- **Vazia:** é substituída, junto com gatilhos antigos de `auth.users` que gravavam nela.
- **Com dados:** o script para com a mensagem *"Já existe public.profiles com
  outro formato e COM dados"*. Nesse caso rode
  `alter table public.profiles rename to profiles_old;` e execute o `01` de novo.

## 2. Configurar o Auth

Em **Authentication › Sign In / Providers › Email**:

- **Password requirements**: *Minimum length* `8` e *Lowercase, uppercase letters and digits*.
  É a mesma regra que o app mostra no cadastro; assim o servidor também a garante.
- **Confirm email**:
  - **Desligado (recomendado no desenvolvimento)**: a conta entra direto no app
    após o cadastro, já com a foto de perfil.
  - **Ligado**: o app avisa para confirmar o e-mail e leva ao login. O envio de
    e-mails padrão do Supabase tem limite baixo por hora; para produção configure
    um SMTP próprio (**Authentication › Emails › SMTP Settings**).

## 3. Conectar o app

Crie `mobile/.env.local` a partir de `mobile/.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave publishable ou anon>
```

Os valores ficam em **Project Settings › API Keys** (ou no botão **Connect**). A
chave pública pode ficar no app: quem protege os dados é o RLS. **Nunca** coloque
a `service_role`/secret key nem a senha do banco no app ou no git. Depois rode
`npx expo start` dentro de `mobile/` (ou `docker compose up`).

## Como as regras são garantidas

| Regra | Onde |
|-------|------|
| E-mail único | Supabase Auth + função `is_email_available` (checagem no 1º passo do cadastro) |
| Senha mínima do usuário | Política do Auth (passo 2) + validação no app |
| Senha do grupo | Hash bcrypt em `private.group_secrets`, inacessível pela API; 5 erros bloqueiam por 15 min |
| Máximo de 10 membros | Gatilho em `group_members` com trava por grupo (vale até para entradas simultâneas) + `join_group` responde `GROUP_FULL` |
| +10 pontos por check-in | `create_checkin` grava os pontos em cada grupo escolhido; o app não define o valor |
| Pontos isolados por grupo | Ranking soma só `checkin_groups` daquele grupo |
| Data e hora exatas | `created_at` gravado pelo servidor (`now()`) na publicação |
| Fotos privadas | Bucket `checkins` privado; só o autor e membros dos grupos onde a foto foi publicada geram URL |
| Dados de saúde | `profiles` só é legível pelo próprio usuário; outros membros veem apenas nome e foto |

Funções expostas ao app (`supabase.rpc`): `is_email_available`, `create_group`,
`search_groups`, `join_group`, `my_groups`, `group_leaderboard`, `group_feed`,
`create_checkin`, `my_checkins`, `my_streak` e `search_foods`.

## Observações sobre a TACO

- Valores por 100 g da parte comestível. "Tr" (traços) foi gravado como 0; "NA" e "*" como vazio (NULL).
- Alguns alimentos não têm todos os nutrientes analisados na TACO, por exemplo
  `Leite, de vaca, integral`, que não tem kcal. O app mostra "—" e registra 0 kcal na dieta.
- Fonte: NEPA/UNICAMP. *Tabela Brasileira de Composição de Alimentos – TACO*, 4ª ed. Campinas, 2011.
