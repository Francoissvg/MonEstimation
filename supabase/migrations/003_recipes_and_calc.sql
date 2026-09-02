-- Recettes
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  portions numeric not null default 1 check (portions > 0),
  prix_vente numeric not null default 0 check (prix_vente >= 0),
  marge_cible numeric not null default 70 check (marge_cible >= 0 and marge_cible < 100),
  created_at timestamptz not null default now()
);

create unique index if not exists recipes_establishment_nom_unique
  on recipes (establishment_id, lower(nom));
create index if not exists recipes_establishment_id_idx on recipes(establishment_id);

alter table recipes enable row level security;

create policy "recipes_select_own" on recipes for select using (
  exists (select 1 from establishments e where e.id = recipes.establishment_id and e.user_id = auth.uid())
);
create policy "recipes_insert_own" on recipes for insert with check (
  exists (select 1 from establishments e where e.id = recipes.establishment_id and e.user_id = auth.uid())
);
create policy "recipes_update_own" on recipes for update using (
  exists (select 1 from establishments e where e.id = recipes.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = recipes.establishment_id and e.user_id = auth.uid())
);
create policy "recipes_delete_own" on recipes for delete using (
  exists (select 1 from establishments e where e.id = recipes.establishment_id and e.user_id = auth.uid())
);

-- Ingrédients utilisés dans une recette (quantité + unité)
create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantite numeric not null check (quantite > 0),
  unite text not null check (unite in ('g', 'kg', 'ml', 'l', 'piece')),
  unique (recipe_id, ingredient_id)
);

create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients(recipe_id);

alter table recipe_ingredients enable row level security;

create policy "recipe_ingredients_select_own" on recipe_ingredients for select using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_ingredients.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_ingredients_insert_own" on recipe_ingredients for insert with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_ingredients.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_ingredients_update_own" on recipe_ingredients for update using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_ingredients.recipe_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_ingredients.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_ingredients_delete_own" on recipe_ingredients for delete using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_ingredients.recipe_id and e.user_id = auth.uid()
  )
);

-- Frais généraux simplifiés : un montant mensuel réparti sur une quantité de référence.
create table if not exists establishment_settings (
  establishment_id uuid primary key references establishments(id) on delete cascade,
  frais_generaux_mensuels numeric not null default 0 check (frais_generaux_mensuels >= 0),
  quantite_mensuelle_reference numeric not null default 0 check (quantite_mensuelle_reference >= 0)
);

alter table establishment_settings enable row level security;

create policy "establishment_settings_select_own" on establishment_settings for select using (
  exists (select 1 from establishments e where e.id = establishment_settings.establishment_id and e.user_id = auth.uid())
);
create policy "establishment_settings_insert_own" on establishment_settings for insert with check (
  exists (select 1 from establishments e where e.id = establishment_settings.establishment_id and e.user_id = auth.uid())
);
create policy "establishment_settings_update_own" on establishment_settings for update using (
  exists (select 1 from establishments e where e.id = establishment_settings.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = establishment_settings.establishment_id and e.user_id = auth.uid())
);

-- Historique des calculs : capture immuable d'un coût de revient à un instant T.
create table if not exists cost_history (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete set null,
  recipe_nom text not null,
  calculated_at timestamptz not null default now(),
  cout_matiere numeric not null,
  quote_part_frais numeric not null,
  cout_revient_unitaire numeric not null,
  portions numeric not null,
  prix_vente numeric not null,
  marge numeric not null,
  taux_marge numeric not null,
  prix_conseille numeric not null
);

create index if not exists cost_history_establishment_id_idx on cost_history(establishment_id);
create index if not exists cost_history_recipe_id_idx on cost_history(recipe_id);

alter table cost_history enable row level security;

create policy "cost_history_select_own" on cost_history for select using (
  exists (select 1 from establishments e where e.id = cost_history.establishment_id and e.user_id = auth.uid())
);
create policy "cost_history_insert_own" on cost_history for insert with check (
  exists (select 1 from establishments e where e.id = cost_history.establishment_id and e.user_id = auth.uid())
);
create policy "cost_history_delete_own" on cost_history for delete using (
  exists (select 1 from establishments e where e.id = cost_history.establishment_id and e.user_id = auth.uid())
);
