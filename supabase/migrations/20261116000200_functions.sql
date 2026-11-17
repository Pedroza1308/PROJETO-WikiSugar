-- =====================================================================
-- WikiSugar · 02/04 · Funções (RPC) chamadas pelo app via supabase.rpc()
--
-- Regras críticas ficam aqui, no servidor: senha do grupo (bcrypt), limite
-- de 10 membros, pontos por check-in e isolamento da pontuação por grupo.
-- Rode depois do 01_schema. Pode ser executado de novo sem erro.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Cadastro: unicidade de e-mail (consulta antes de criar a conta)
-- ---------------------------------------------------------------------
create or replace function public.is_email_available(p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')))
  )
$$;

-- ---------------------------------------------------------------------
-- Grupos
-- ---------------------------------------------------------------------

-- Cria o grupo, gera o código de convite e adiciona o criador como dono.
create or replace function public.create_group(p_name text, p_password text, p_description text default null)
returns table (id uuid, name text, invite_code text)
language plpgsql security definer set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_desc text := nullif(btrim(coalesce(p_description, '')), '');
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem 0/O/1/I
  v_code text;
  v_group_id uuid;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;
  if char_length(v_name) not between 3 and 60 then
    raise exception 'INVALID_GROUP_NAME' using errcode = '22023';
  end if;
  if v_desc is not null and char_length(v_desc) > 280 then
    raise exception 'INVALID_DESCRIPTION' using errcode = '22023';
  end if;
  if p_password is null or char_length(p_password) < 4 or octet_length(p_password) > 72 then
    raise exception 'INVALID_GROUP_PASSWORD' using errcode = '22023';
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * 32)::integer, 1);
    end loop;
    begin
      insert into public.groups (name, description, invite_code, owner_id)
      values (v_name, v_desc, v_code, v_uid)
      returning public.groups.id into v_group_id;
      exit;
    exception when unique_violation then
      -- código já existe: sorteia outro
    end;
  end loop;

  insert into private.group_secrets (group_id, password_hash)
  values (v_group_id, extensions.crypt(p_password, extensions.gen_salt('bf')));

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_uid, 'owner');

  return query select v_group_id, v_name, v_code;
end;
$$;

-- Busca grupos pelo código de convite (exato, com ou sem #) ou pelo nome.
create or replace function public.search_groups(p_query text)
returns table (
  id uuid, name text, description text, invite_code text,
  member_count integer, max_members integer, is_member boolean, is_full boolean
)
language sql stable security definer set search_path = ''
as $$
  with q as (
    select
      upper(regexp_replace(btrim(coalesce(p_query, '')), '^#', '')) as code,
      private.normalize_text(btrim(coalesce(p_query, ''))) as term
  ),
  matches as (
    select g.*, (g.invite_code = q.code) as code_match
    from public.groups g, q
    where (select auth.uid()) is not null
      and char_length(q.term) >= 2
      and (g.invite_code = q.code or position(q.term in private.normalize_text(g.name)) > 0)
    order by (g.invite_code = q.code) desc, g.name
    limit 20
  )
  select
    f.id, f.name, f.description, f.invite_code,
    c.total,
    private.group_max_members(),
    exists (select 1 from public.group_members m where m.group_id = f.id and m.user_id = (select auth.uid())),
    c.total >= private.group_max_members()
  from matches f
  cross join lateral (
    select count(*)::integer as total from public.group_members m where m.group_id = f.id
  ) c
  order by f.code_match desc, f.name
$$;

-- Entra no grupo validando a senha e a capacidade.
-- Retorna: OK | NOT_FOUND | ALREADY_MEMBER | GROUP_FULL | INVALID_PASSWORD | TOO_MANY_ATTEMPTS
-- (retorna status em vez de erro para que a tentativa errada fique registrada)
create or replace function public.join_group(p_group_id uuid, p_password text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_failed integer;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  -- Trava o grupo: duas entradas simultâneas não passam do limite.
  perform 1 from public.groups g where g.id = p_group_id for update;
  if not found then
    return 'NOT_FOUND';
  end if;

  if exists (select 1 from public.group_members m where m.group_id = p_group_id and m.user_id = v_uid) then
    return 'ALREADY_MEMBER';
  end if;

  if (select count(*) from public.group_members m where m.group_id = p_group_id) >= private.group_max_members() then
    return 'GROUP_FULL';
  end if;

  select count(*) into v_failed
  from private.group_join_attempts a
  where a.user_id = v_uid and a.group_id = p_group_id and a.attempted_at > now() - interval '15 minutes';
  if v_failed >= 5 then
    return 'TOO_MANY_ATTEMPTS';
  end if;

  select s.password_hash into v_hash from private.group_secrets s where s.group_id = p_group_id;
  if v_hash is null or extensions.crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    insert into private.group_join_attempts (user_id, group_id) values (v_uid, p_group_id);
    return 'INVALID_PASSWORD';
  end if;

  insert into public.group_members (group_id, user_id, role) values (p_group_id, v_uid, 'member');
  delete from private.group_join_attempts a where a.user_id = v_uid and a.group_id = p_group_id;
  return 'OK';
end;
$$;

-- Grupos do usuário com seus pontos e posição em cada um.
-- Para um grupo específico: supabase.rpc('my_groups').eq('id', groupId)
create or replace function public.my_groups()
returns table (
  id uuid, name text, description text, invite_code text, role text,
  member_count integer, max_members integer, my_points integer, my_rank integer, joined_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  with mine as (
    select m.group_id, m.role, m.joined_at
    from public.group_members m
    where m.user_id = (select auth.uid())
  ),
  scores as (
    select m.group_id, m.user_id, coalesce(sum(cg.points), 0)::integer as points
    from public.group_members m
    join mine on mine.group_id = m.group_id
    left join public.checkin_groups cg on cg.group_id = m.group_id and cg.user_id = m.user_id
    group by m.group_id, m.user_id
  ),
  ranked as (
    select s.group_id, s.user_id, s.points,
           rank() over (partition by s.group_id order by s.points desc)::integer as place
    from scores s
  )
  select
    g.id, g.name, g.description, g.invite_code, mine.role,
    (select count(*)::integer from public.group_members x where x.group_id = g.id),
    private.group_max_members(),
    r.points, r.place, mine.joined_at
  from mine
  join public.groups g on g.id = mine.group_id
  join ranked r on r.group_id = g.id and r.user_id = (select auth.uid())
  order by mine.joined_at desc
$$;

-- Placar interno do grupo (somente membros). Pontos contam só neste grupo.
create or replace function public.group_leaderboard(p_group_id uuid)
returns table (
  user_id uuid, name text, avatar_path text, role text,
  points integer, checkin_count integer, place integer, joined_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select
    m.user_id, p.name, p.avatar_path, m.role,
    coalesce(sum(cg.points), 0)::integer,
    count(cg.checkin_id)::integer,
    rank() over (order by coalesce(sum(cg.points), 0) desc)::integer,
    m.joined_at
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  left join public.checkin_groups cg on cg.group_id = m.group_id and cg.user_id = m.user_id
  where m.group_id = p_group_id
    and private.is_group_member(p_group_id)
  group by m.user_id, p.name, p.avatar_path, m.role, m.joined_at
  order by coalesce(sum(cg.points), 0) desc, count(cg.checkin_id) desc, m.joined_at
$$;

-- Feed cronológico do grupo (mais recentes primeiro), paginado por data.
create or replace function public.group_feed(p_group_id uuid, p_limit integer default 20, p_before timestamptz default null)
returns table (
  checkin_id uuid, user_id uuid, author_name text, author_avatar_path text,
  photo_path text, caption text, created_at timestamptz, points integer
)
language sql stable security definer set search_path = ''
as $$
  select c.id, c.user_id, p.name, p.avatar_path, c.photo_path, c.caption, c.created_at, cg.points
  from public.checkin_groups cg
  join public.checkins c on c.id = cg.checkin_id
  join public.profiles p on p.id = c.user_id
  where cg.group_id = p_group_id
    and private.is_group_member(p_group_id)
    and (p_before is null or c.created_at < p_before)
  order by c.created_at desc, c.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;

-- ---------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------

-- Publica um check-in: a foto já deve estar no bucket 'checkins' em <uid>/...
-- Cada grupo escolhido recebe +10 pontos para o autor (só naquele grupo).
create or replace function public.create_checkin(p_photo_path text, p_group_ids uuid[], p_caption text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_caption text := nullif(btrim(coalesce(p_caption, '')), '');
  v_groups uuid[];
  v_checkin_id uuid;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select array_agg(distinct g) into v_groups
  from unnest(coalesce(p_group_ids, '{}'::uuid[])) as g
  where g is not null;
  if v_groups is null or cardinality(v_groups) = 0 then
    raise exception 'NO_GROUPS' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(v_groups) as g
    where not exists (select 1 from public.group_members m where m.group_id = g and m.user_id = v_uid)
  ) then
    raise exception 'NOT_A_MEMBER' using errcode = '42501';
  end if;

  if v_caption is not null and char_length(v_caption) > 280 then
    raise exception 'INVALID_CAPTION' using errcode = '22023';
  end if;

  if p_photo_path is null or p_photo_path not like v_uid::text || '/%' then
    raise exception 'INVALID_PHOTO' using errcode = '22023';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'checkins' and o.name = p_photo_path) then
    raise exception 'PHOTO_NOT_FOUND' using errcode = '22023';
  end if;
  if exists (select 1 from public.checkins c where c.photo_path = p_photo_path) then
    raise exception 'DUPLICATE_PHOTO' using errcode = '23505';
  end if;

  insert into public.checkins (user_id, photo_path, caption, created_at)
  values (v_uid, p_photo_path, v_caption, v_now)
  returning id into v_checkin_id;

  insert into public.checkin_groups (checkin_id, group_id, user_id, points, created_at)
  select v_checkin_id, g, v_uid, private.checkin_points(), v_now
  from unnest(v_groups) as g;

  return v_checkin_id;
end;
$$;

-- Galeria pessoal + histórico de pontos (mais recentes primeiro).
create or replace function public.my_checkins(p_limit integer default 30, p_before timestamptz default null)
returns table (
  checkin_id uuid, photo_path text, caption text, created_at timestamptz,
  total_points integer, groups jsonb
)
language sql stable security definer set search_path = ''
as $$
  select
    c.id, c.photo_path, c.caption, c.created_at,
    coalesce(sum(cg.points), 0)::integer,
    coalesce(
      jsonb_agg(jsonb_build_object('group_id', g.id, 'name', g.name, 'points', cg.points) order by g.name)
        filter (where g.id is not null),
      '[]'::jsonb
    )
  from public.checkins c
  left join public.checkin_groups cg on cg.checkin_id = c.id
  left join public.groups g on g.id = cg.group_id
  where c.user_id = (select auth.uid())
    and (p_before is null or c.created_at < p_before)
  group by c.id
  order by c.created_at desc, c.id
  limit least(greatest(coalesce(p_limit, 30), 1), 100)
$$;

-- Dias seguidos com algum registro (check-in, diário ou refeição).
create or replace function public.my_streak(p_tz text default 'America/Sao_Paulo')
returns integer
language sql stable security definer set search_path = ''
as $$
  with tz as (
    select case
      when exists (select 1 from pg_catalog.pg_timezone_names n where n.name = p_tz) then p_tz
      else 'America/Sao_Paulo'
    end as name
  ),
  today as (
    select (now() at time zone tz.name)::date as d from tz
  ),
  days as (
    select distinct x.d from (
      select (c.created_at at time zone tz.name)::date as d
      from public.checkins c, tz where c.user_id = (select auth.uid())
      union all
      select j.entry_date from public.journal_entries j where j.user_id = (select auth.uid())
      union all
      select mi.entry_date from public.meal_items mi where mi.user_id = (select auth.uid())
    ) x
  ),
  anchor as (
    select case
      when exists (select 1 from days, today where days.d = today.d) then (select today.d from today)
      when exists (select 1 from days, today where days.d = today.d - 1) then (select today.d - 1 from today)
    end as a
  ),
  seq as (
    select days.d, row_number() over (order by days.d desc) as rn
    from days, anchor
    where anchor.a is not null and days.d <= anchor.a
  )
  select count(*)::integer from seq, anchor where seq.d = anchor.a - (seq.rn - 1)::integer
$$;

-- ---------------------------------------------------------------------
-- Busca de alimentos (TACO): todas as palavras, sem acento/maiúsculas
-- ---------------------------------------------------------------------
create or replace function public.search_foods(p_query text, p_limit integer default 30)
returns setof public.foods
language sql stable set search_path = ''
as $$
  with t as (
    select array_remove(
      regexp_split_to_array(private.normalize_text(btrim(coalesce(p_query, ''))), '[\s,]+'),
      ''
    ) as words
  )
  select f.*
  from public.foods f, t
  where cardinality(t.words) > 0
    and not exists (
      select 1 from unnest(t.words) as w
      where position(w in private.normalize_text(f.name)) = 0
    )
  order by
    (private.normalize_text(f.name) like t.words[1] || '%') desc,
    char_length(f.name),
    f.name
  limit least(greatest(coalesce(p_limit, 30), 1), 50)
$$;

-- ---------------------------------------------------------------------
-- Permissões: só usuários autenticados chamam as funções do app
-- ---------------------------------------------------------------------
revoke execute on function public.is_email_available(text) from public;
revoke execute on function public.create_group(text, text, text) from public, anon;
revoke execute on function public.search_groups(text) from public, anon;
revoke execute on function public.join_group(uuid, text) from public, anon;
revoke execute on function public.my_groups() from public, anon;
revoke execute on function public.group_leaderboard(uuid) from public, anon;
revoke execute on function public.group_feed(uuid, integer, timestamptz) from public, anon;
revoke execute on function public.create_checkin(text, uuid[], text) from public, anon;
revoke execute on function public.my_checkins(integer, timestamptz) from public, anon;
revoke execute on function public.my_streak(text) from public, anon;
revoke execute on function public.search_foods(text, integer) from public;

grant execute on function public.is_email_available(text) to anon, authenticated;
grant execute on function public.create_group(text, text, text) to authenticated;
grant execute on function public.search_groups(text) to authenticated;
grant execute on function public.join_group(uuid, text) to authenticated;
grant execute on function public.my_groups() to authenticated;
grant execute on function public.group_leaderboard(uuid) to authenticated;
grant execute on function public.group_feed(uuid, integer, timestamptz) to authenticated;
grant execute on function public.create_checkin(text, uuid[], text) to authenticated;
grant execute on function public.my_checkins(integer, timestamptz) to authenticated;
grant execute on function public.my_streak(text) to authenticated;
grant execute on function public.search_foods(text, integer) to anon, authenticated;

notify pgrst, 'reload schema';
