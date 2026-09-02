-- Le prévisionnel devient mensuel (12 valeurs par recette) au lieu d'un chiffre unique à l'année.
create table if not exists recipe_monthly_forecasts (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  quantity numeric not null default 0 check (quantity >= 0),
  unique (recipe_id, month)
);

create index if not exists recipe_monthly_forecasts_recipe_id_idx on recipe_monthly_forecasts(recipe_id);

alter table recipe_monthly_forecasts enable row level security;

create policy "recipe_monthly_forecasts_select_own" on recipe_monthly_forecasts for select using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_forecasts.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_forecasts_insert_own" on recipe_monthly_forecasts for insert with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_forecasts.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_forecasts_update_own" on recipe_monthly_forecasts for update using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_forecasts.recipe_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_forecasts.recipe_id and e.user_id = auth.uid()
  )
);
create policy "recipe_monthly_forecasts_delete_own" on recipe_monthly_forecasts for delete using (
  exists (
    select 1 from recipes r join establishments e on e.id = r.establishment_id
    where r.id = recipe_monthly_forecasts.recipe_id and e.user_id = auth.uid()
  )
);

alter table recipes drop column if exists forecast_quantity;

-- Salariés et charges fixes actifs seulement certains mois (ex : embauche saisonnière,
-- chauffage l'hiver). NULL = actif toute l'année (comportement inchangé par défaut).
alter table employees add column if not exists active_months smallint[];
alter table fixed_costs add column if not exists active_months smallint[];
