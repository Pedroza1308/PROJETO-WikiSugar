-- =====================================================================
-- WikiSugar · 03/04 · Storage: buckets de fotos e políticas de acesso
--
-- avatars  → público (foto de perfil), escrita só na pasta <uid>/
-- checkins → privado; o app gera URLs assinadas. Cada foto é visível
--            para o autor e para os membros dos grupos onde foi publicada.
-- Rode depois do 02_functions. Pode ser executado de novo sem erro.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('checkins', 'checkins', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- avatars (bucket público: a leitura pela URL pública não passa pelo RLS)
-- ---------------------------------------------------------------------
drop policy if exists "avatars: dono lê" on storage.objects;
create policy "avatars: dono lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: dono envia" on storage.objects;
create policy "avatars: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: dono atualiza" on storage.objects;
create policy "avatars: dono atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: dono apaga" on storage.objects;
create policy "avatars: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------
-- checkins (bucket privado)
-- ---------------------------------------------------------------------
drop policy if exists "checkins: dono envia" on storage.objects;
create policy "checkins: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'checkins' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "checkins: autor e membros dos grupos veem" on storage.objects;
create policy "checkins: autor e membros dos grupos veem" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checkins'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.can_view_checkin_photo(name)
    )
  );

-- O autor só pode apagar fotos que ainda não viraram check-in (limpeza de
-- envio que falhou). Fotos publicadas não somem do histórico do grupo.
drop policy if exists "checkins: dono apaga foto não publicada" on storage.objects;
create policy "checkins: dono apaga foto não publicada" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.checkins c where c.photo_path = objects.name)
  );
