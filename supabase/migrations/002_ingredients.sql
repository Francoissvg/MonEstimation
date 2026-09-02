create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  categorie text not null default 'Autre',
  purchase_quantity numeric not null check (purchase_quantity > 0),
  purchase_unit text not null check (purchase_unit in ('g', 'kg', 'ml', 'l', 'piece')),
  usage_unit text not null,
  purchase_price numeric not null check (purchase_price >= 0),
  created_at timestamptz not null default now()
);

create unique index if not exists ingredients_establishment_nom_unique
  on ingredients (establishment_id, lower(nom));

create index if not exists ingredients_establishment_id_idx on ingredients(establishment_id);

alter table ingredients enable row level security;

-- Isolation via l'établissement parent : un ingrédient n'est visible/modifiable
-- que si l'établissement auquel il appartient appartient à l'utilisateur connecté.
create policy "ingredients_select_own"
  on ingredients for select
  using (
    exists (
      select 1 from establishments e
      where e.id = ingredients.establishment_id and e.user_id = auth.uid()
    )
  );

create policy "ingredients_insert_own"
  on ingredients for insert
  with check (
    exists (
      select 1 from establishments e
      where e.id = ingredients.establishment_id and e.user_id = auth.uid()
    )
  );

create policy "ingredients_update_own"
  on ingredients for update
  using (
    exists (
      select 1 from establishments e
      where e.id = ingredients.establishment_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from establishments e
      where e.id = ingredients.establishment_id and e.user_id = auth.uid()
    )
  );

create policy "ingredients_delete_own"
  on ingredients for delete
  using (
    exists (
      select 1 from establishments e
      where e.id = ingredients.establishment_id and e.user_id = auth.uid()
    )
  );
