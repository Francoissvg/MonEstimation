-- Table des établissements : chaque utilisateur peut en créer plusieurs.
create table if not exists establishments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  type text not null check (type in ('Boulangerie', 'Restaurant', 'Bar', 'Autre')),
  created_at timestamptz not null default now()
);

create index if not exists establishments_user_id_idx on establishments(user_id);

alter table establishments enable row level security;

-- Isolation stricte : chaque utilisateur ne voit / modifie que ses propres établissements.
create policy "establishments_select_own"
  on establishments for select
  using (auth.uid() = user_id);

create policy "establishments_insert_own"
  on establishments for insert
  with check (auth.uid() = user_id);

create policy "establishments_update_own"
  on establishments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "establishments_delete_own"
  on establishments for delete
  using (auth.uid() = user_id);
