-- La marge cible devient un réglage unique par établissement au lieu d'un champ par recette.
alter table establishment_settings add column if not exists marge_cible numeric not null default 70 check (marge_cible >= 0 and marge_cible < 100);
alter table recipes drop column if exists marge_cible;

-- Historique des achats d'un ingrédient, pour comparer les prix dans le temps
-- (ex : farine achetée plusieurs fois à des prix différents). Ajouter un achat
-- met aussi à jour le prix "courant" de l'ingrédient utilisé dans les calculs.
create table if not exists ingredient_purchases (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  purchased_at date not null default current_date,
  quantity numeric not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'ml', 'l', 'piece')),
  price numeric not null check (price >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists ingredient_purchases_ingredient_id_idx on ingredient_purchases(ingredient_id);
create index if not exists ingredient_purchases_establishment_id_idx on ingredient_purchases(establishment_id);

alter table ingredient_purchases enable row level security;

create policy "ingredient_purchases_select_own" on ingredient_purchases for select using (
  exists (select 1 from establishments e where e.id = ingredient_purchases.establishment_id and e.user_id = auth.uid())
);
create policy "ingredient_purchases_insert_own" on ingredient_purchases for insert with check (
  exists (select 1 from establishments e where e.id = ingredient_purchases.establishment_id and e.user_id = auth.uid())
);
create policy "ingredient_purchases_delete_own" on ingredient_purchases for delete using (
  exists (select 1 from establishments e where e.id = ingredient_purchases.establishment_id and e.user_id = auth.uid())
);
