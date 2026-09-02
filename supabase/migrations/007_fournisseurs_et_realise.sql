-- Fournisseurs : associer un fournisseur à un ingrédient acheté, pour comparer les prix
-- entre fournisseurs dans le temps.
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null,
  contact text not null default '',
  created_at timestamptz not null default now(),
  unique (establishment_id, nom)
);

create index if not exists suppliers_establishment_id_idx on suppliers(establishment_id);

alter table suppliers enable row level security;

create policy "suppliers_select_own" on suppliers for select using (
  exists (select 1 from establishments e where e.id = suppliers.establishment_id and e.user_id = auth.uid())
);
create policy "suppliers_insert_own" on suppliers for insert with check (
  exists (select 1 from establishments e where e.id = suppliers.establishment_id and e.user_id = auth.uid())
);
create policy "suppliers_update_own" on suppliers for update using (
  exists (select 1 from establishments e where e.id = suppliers.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = suppliers.establishment_id and e.user_id = auth.uid())
);
create policy "suppliers_delete_own" on suppliers for delete using (
  exists (select 1 from establishments e where e.id = suppliers.establishment_id and e.user_id = auth.uid())
);

alter table ingredient_purchases add column if not exists supplier_id uuid references suppliers(id) on delete set null;

-- Ventes réelles par recette et par mois calendaire. Contrairement au prévisionnel
-- (recipe_monthly_forecasts), qui est un gabarit annuel répété d'année en année, le
-- réalisé est daté avec une année précise pour permettre la comparaison prévu/réalisé.
create table if not exists recipe_monthly_actuals (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  quantity numeric not null default 0 check (quantity >= 0),
  unique (recipe_id, year, month)
);

create index if not exists recipe_monthly_actuals_recipe_id_idx on recipe_monthly_actuals(recipe_id);

alter table recipe_monthly_actuals enable row level security;

create policy "recipe_monthly_actuals_select_own" on recipe_monthly_actuals for select using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_actuals.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_actuals_insert_own" on recipe_monthly_actuals for insert with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_actuals.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_actuals_update_own" on recipe_monthly_actuals for update using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_actuals.recipe_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_actuals.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_actuals_delete_own" on recipe_monthly_actuals for delete using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_actuals.recipe_id and e.user_id = auth.uid()
  )
);
