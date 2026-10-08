begin;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0 and length(content) <= 10000),
  created_at timestamptz not null default now()
);

create index notes_user_created_at_idx on public.notes (user_id, created_at desc);
alter table public.notes enable row level security;

revoke all on public.notes from anon, authenticated;
grant select, insert, delete on public.notes to authenticated;

create policy "Users can read their own notes" on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own notes" on public.notes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can delete their own notes" on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
