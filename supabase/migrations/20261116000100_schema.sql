-- =====================================================================
-- WikiSugar · 01/04 · Schema: extensões, tabelas, índices, gatilhos e RLS
--
-- Como rodar: Supabase Dashboard › SQL Editor › New query › cole e Run.
-- Ordem: 01_schema → 02_functions → 03_storage → 04_taco_foods_data.
-- O script pode ser executado de novo sem erro (idempotente).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Schema interno: segredos e funções auxiliares. NÃO é exposto pela API REST.
create schema if not exists private;
revoke all on schema private from public;
-- As políticas de RLS chamam funções deste schema, então o papel precisa de USAGE.
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------------
-- Regras de negócio centralizadas (fonte única da verdade)
-- ---------------------------------------------------------------------
create or replace function private.group_max_members()
returns integer language sql immutable parallel safe set search_path = ''
as $$ select 10 $$;

create or replace function private.checkin_points()
returns integer language sql immutable parallel safe set search_path = ''
as $$ select 10 $$;

-- Texto normalizado para busca: minúsculo e sem acentos.
create or replace function private.normalize_text(p text)
returns text language sql immutable parallel safe set search_path = ''
as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p, ''))) $$;

-- Converte texto em número dentro de um intervalo; nunca falha.
create or replace function private.clamp_numeric(p_value text, p_default numeric, p_min numeric, p_max numeric)
returns numeric language plpgsql immutable set search_path = ''
as $$
declare
  v numeric;
begin
  begin
    v := p_value::numeric;
  exception when others then
    return p_default;
  end;
  if v is null then
    return p_default;
  end if;
  return least(greatest(v, p_min), p_max);
end;
$$;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Compatibilidade: projeto que já tinha uma tabela "profiles" de rascunho
-- (com outras colunas). Se ela estiver VAZIA, é substituída pela deste
-- schema, junto com gatilhos antigos de auth.users que gravavam nela (eles
-- quebrariam o cadastro). Se tiver dados, o script para sem alterar nada.
-- ---------------------------------------------------------------------
do $$
declare
  t record;
begin
  if to_regclass('public.profiles') is not null
     and not exists (
       select 1 from information_schema.columns c
       where c.table_schema = 'public' and c.table_name = 'profiles' and c.column_name = 'avatar_path'
     ) then
    if exists (select 1 from public.profiles) then
      raise exception 'Já existe public.profiles com outro formato e COM dados. Renomeie antes de continuar: alter table public.profiles rename to profiles_old; (depois rode este script de novo)';
    end if;

    for t in
      select tg.tgname
      from pg_trigger tg
      join pg_proc p on p.oid = tg.tgfoid
      where tg.tgrelid = 'auth.users'::regclass
        and not tg.tgisinternal
        and p.prosrc ilike '%profiles%'
    loop
      execute format('drop trigger %I on auth.users', t.tgname);
      raise notice 'Gatilho antigo removido de auth.users: %', t.tgname;
    end loop;

    drop table public.profiles; -- sem CASCADE: se outra tabela depender dela, o script para
    raise notice 'Tabela public.profiles antiga (vazia) substituída.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfis (1:1 com auth.users). O e-mail fica só no Auth (único lá).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  avatar_path text,
  diabetes_type text not null default 'Não tenho'
    check (diabetes_type in ('Tipo 1', 'Tipo 2', 'Gestacional', 'Não tenho')),
  restrictions text[] not null default '{}',
  goal_calories_kcal integer not null default 2300 check (goal_calories_kcal between 500 and 10000),
  goal_water_ml integer not null default 2900 check (goal_water_ml between 250 and 10000),
  goal_sleep_hours numeric(4, 2) not null default 8 check (goal_sleep_hours between 1 and 16),
  goal_carb_limit_g integer not null default 230 check (goal_carb_limit_g between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Cria o perfil automaticamente no cadastro, a partir dos metadados do signUp.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id, name, diabetes_type, restrictions,
    goal_calories_kcal, goal_water_ml, goal_sleep_hours, goal_carb_limit_g
  )
  values (
    new.id,
    left(coalesce(nullif(btrim(meta ->> 'name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Usuário'), 80),
    case
      when meta ->> 'diabetes_type' in ('Tipo 1', 'Tipo 2', 'Gestacional', 'Não tenho') then meta ->> 'diabetes_type'
      else 'Não tenho'
    end,
    case
      when jsonb_typeof(meta -> 'restrictions') = 'array'
        then array(select left(r, 40) from jsonb_array_elements_text(meta -> 'restrictions') as r limit 10)
      else '{}'::text[]
    end,
    round(private.clamp_numeric(meta ->> 'goal_calories_kcal', 2300, 500, 10000))::integer,
    round(private.clamp_numeric(meta ->> 'goal_water_ml', 2900, 250, 10000))::integer,
    round(private.clamp_numeric(meta ->> 'goal_sleep_hours', 8, 1, 16), 2),
    round(private.clamp_numeric(meta ->> 'goal_carb_limit_g', 230, 0, 1000))::integer
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------
-- Grupos, segredos e membros
-- ---------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 3 and 60),
  description text check (description is null or char_length(description) <= 280),
  invite_code text not null unique check (invite_code ~ '^[A-Z2-9]{6}$'),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Hash bcrypt da senha do grupo. Inacessível pela API: só as funções leem.
create table if not exists private.group_secrets (
  group_id uuid primary key references public.groups (id) on delete cascade,
  password_hash text not null
);

-- Tentativas de senha erradas (bloqueio contra força bruta).
create table if not exists private.group_join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists group_join_attempts_lookup_idx
  on private.group_join_attempts (user_id, group_id, attempted_at);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- Limite estrito de participantes, garantido no banco (mesmo com entradas simultâneas).
create or replace function private.enforce_group_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  -- Trava a linha do grupo: entradas concorrentes no mesmo grupo esperam em fila.
  perform 1 from public.groups g where g.id = new.group_id for update;
  if (select count(*) from public.group_members m where m.group_id = new.group_id)
       >= private.group_max_members() then
    raise exception 'GROUP_FULL'
      using errcode = 'P0001',
            detail = format('O grupo atingiu o limite de %s participantes.', private.group_max_members());
  end if;
  return new;
end;
$$;

drop trigger if exists group_members_capacity on public.group_members;
create trigger group_members_capacity
  before insert on public.group_members
  for each row execute function private.enforce_group_capacity();

-- Usado pelas políticas de RLS (security definer evita recursão no RLS).
create or replace function private.is_group_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid())
  )
$$;

-- ---------------------------------------------------------------------
-- Check-ins por foto e pontuação por vínculo usuário-grupo
-- ---------------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 280),
  created_at timestamptz not null default now()
);
create index if not exists checkins_user_created_idx on public.checkins (user_id, created_at desc);

-- Uma linha por grupo de destino: cada uma gera os pontos naquele grupo.
create table if not exists public.checkin_groups (
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null check (points >= 0),
  created_at timestamptz not null default now(),
  primary key (checkin_id, group_id)
);
create index if not exists checkin_groups_group_created_idx on public.checkin_groups (group_id, created_at desc);
create index if not exists checkin_groups_group_user_idx on public.checkin_groups (group_id, user_id);

-- Quem pode ver a foto de um check-in: membros de algum grupo onde ela foi publicada.
create or replace function private.can_view_checkin_photo(p_object_name text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.checkins c
    join public.checkin_groups cg on cg.checkin_id = c.id
    join public.group_members m on m.group_id = cg.group_id
    where c.photo_path = p_object_name and m.user_id = (select auth.uid())
  )
$$;

-- ---------------------------------------------------------------------
-- Base nutricional (Tabela TACO, valores por 100 g). Dados: arquivo 04.
-- ---------------------------------------------------------------------
create table if not exists public.foods (
  id integer primary key,
  name text not null,
  category text not null,
  kcal numeric(7, 2),
  protein_g numeric(7, 2),
  fat_g numeric(7, 2),
  saturated_fat_g numeric(7, 2),
  carbs_g numeric(7, 2),
  fiber_g numeric(7, 2),
  sodium_mg numeric(9, 2)
);

-- ---------------------------------------------------------------------
-- Diário (água, sono, medicação, atividade) e refeições do dia
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entry_date date not null,
  water_ml integer not null default 0 check (water_ml between 0 and 20000),
  sleep_hours numeric(4, 2) check (sleep_hours is null or sleep_hours between 0 and 24),
  took_medication boolean not null default false,
  medication_time text check (medication_time is null or medication_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
  activity_type text check (activity_type is null or char_length(activity_type) <= 60),
  activity_minutes integer check (activity_minutes is null or activity_minutes between 0 and 1440),
  notes text check (notes is null or char_length(notes) <= 1000),
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

drop trigger if exists journal_entries_touch_updated_at on public.journal_entries;
create trigger journal_entries_touch_updated_at
  before update on public.journal_entries
  for each row execute function private.touch_updated_at();

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entry_date date not null,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'snack', 'dinner', 'supper')),
  food_id integer references public.foods (id) on delete set null,
  food_name text not null check (char_length(food_name) between 1 and 200),
  grams numeric(7, 1) not null check (grams > 0 and grams <= 5000),
  kcal numeric(8, 1) not null default 0 check (kcal >= 0),
  carbs_g numeric(7, 1),
  created_at timestamptz not null default now()
);
create index if not exists meal_items_user_date_idx on public.meal_items (user_id, entry_date);

-- Calcula nome/kcal/carboidratos a partir da TACO (o app não decide os valores).
create or replace function private.fill_meal_item_nutrition()
returns trigger language plpgsql set search_path = ''
as $$
declare
  f public.foods%rowtype;
begin
  if new.food_id is not null then
    select * into f from public.foods where id = new.food_id;
    if found then
      new.food_name := f.name;
      new.kcal := round(coalesce(f.kcal, 0) * new.grams / 100, 1);
      new.carbs_g := round(f.carbs_g * new.grams / 100, 1);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists meal_items_fill_nutrition on public.meal_items;
create trigger meal_items_fill_nutrition
  before insert or update of food_id, grams on public.meal_items
  for each row execute function private.fill_meal_item_nutrition();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_groups enable row level security;
alter table public.foods enable row level security;
alter table public.journal_entries enable row level security;
alter table public.meal_items enable row level security;
alter table private.group_secrets enable row level security;      -- sem políticas: ninguém lê pela API
alter table private.group_join_attempts enable row level security; -- sem políticas: ninguém lê pela API

-- Perfis: cada um vê e edita só o próprio. Dados de outros membros (nome/foto)
-- chegam apenas pelas funções de grupo, sem expor dados de saúde.
drop policy if exists "profiles: ler o próprio" on public.profiles;
create policy "profiles: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profiles: editar o próprio" on public.profiles;
create policy "profiles: editar o próprio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (avatar_path is null or avatar_path like (select auth.uid())::text || '/%')
  );

-- Grupos e membros: visíveis só para quem participa. Criação/entrada via funções.
drop policy if exists "groups: membros leem" on public.groups;
create policy "groups: membros leem" on public.groups
  for select to authenticated using (private.is_group_member(id));

drop policy if exists "group_members: membros leem" on public.group_members;
create policy "group_members: membros leem" on public.group_members
  for select to authenticated using (private.is_group_member(group_id));

-- Check-ins: o autor lê os seus. Feeds de grupo saem pelas funções.
drop policy if exists "checkins: autor lê" on public.checkins;
create policy "checkins: autor lê" on public.checkins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "checkin_groups: autor lê" on public.checkin_groups;
create policy "checkin_groups: autor lê" on public.checkin_groups
  for select to authenticated using (user_id = (select auth.uid()));

-- TACO: leitura pública.
drop policy if exists "foods: leitura pública" on public.foods;
create policy "foods: leitura pública" on public.foods
  for select to anon, authenticated using (true);

-- Diário e refeições: cada usuário gerencia apenas os próprios registros.
drop policy if exists "journal_entries: dono gerencia" on public.journal_entries;
create policy "journal_entries: dono gerencia" on public.journal_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "meal_items: dono gerencia" on public.meal_items;
create policy "meal_items: dono gerencia" on public.meal_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Privilégios (explícitos: projetos novos não expõem tabelas por padrão)
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.groups, public.group_members, public.checkins,
  public.checkin_groups, public.journal_entries, public.meal_items from anon;
revoke all on private.group_secrets, private.group_join_attempts from anon, authenticated;

grant select on public.foods to anon, authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (name, avatar_path, diabetes_type, restrictions,
  goal_calories_kcal, goal_water_ml, goal_sleep_hours, goal_carb_limit_g) on public.profiles to authenticated;
grant select on public.groups, public.group_members, public.checkins, public.checkin_groups to authenticated;
grant select, insert, update, delete on public.journal_entries, public.meal_items to authenticated;

revoke all on all functions in schema private from public;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.can_view_checkin_photo(text) to authenticated;
grant execute on function private.normalize_text(text) to anon, authenticated;

notify pgrst, 'reload schema';
