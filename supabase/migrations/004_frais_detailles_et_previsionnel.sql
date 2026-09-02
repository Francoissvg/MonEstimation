-- Le montant unique est remplacé par le détail salariés + charges fixes + énergie.
-- La quantité de référence reste : secours utilisé si aucun prévisionnel de recette n'est renseigné.
alter table establishment_settings drop column if exists frais_generaux_mensuels;

-- Quantité prévisionnelle mensuelle par recette (pour la projection de CA et la répartition des frais).
alter table recipes add column if not exists forecast_quantity numeric not null default 0 check (forecast_quantity >= 0);

-- Salariés
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  salary_mode text not null default 'horaire' check (salary_mode in ('horaire', 'mensuel')),
  hourly_rate numeric not null default 0 check (hourly_rate >= 0),
  hours_per_week numeric not null default 35 check (hours_per_week >= 0),
  monthly_salary numeric not null default 0 check (monthly_salary >= 0),
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists employees_establishment_id_idx on employees(establishment_id);
alter table employees enable row level security;

create policy "employees_select_own" on employees for select using (
  exists (select 1 from establishments e where e.id = employees.establishment_id and e.user_id = auth.uid())
);
create policy "employees_insert_own" on employees for insert with check (
  exists (select 1 from establishments e where e.id = employees.establishment_id and e.user_id = auth.uid())
);
create policy "employees_update_own" on employees for update using (
  exists (select 1 from establishments e where e.id = employees.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = employees.establishment_id and e.user_id = auth.uid())
);
create policy "employees_delete_own" on employees for delete using (
  exists (select 1 from establishments e where e.id = employees.establishment_id and e.user_id = auth.uid())
);

-- Charges fixes
create table if not exists fixed_costs (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  montant numeric not null check (montant >= 0),
  frequence text not null default 'mensuel' check (frequence in ('mensuel', 'annuel')),
  categorie text not null default 'Général',
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists fixed_costs_establishment_id_idx on fixed_costs(establishment_id);
alter table fixed_costs enable row level security;

create policy "fixed_costs_select_own" on fixed_costs for select using (
  exists (select 1 from establishments e where e.id = fixed_costs.establishment_id and e.user_id = auth.uid())
);
create policy "fixed_costs_insert_own" on fixed_costs for insert with check (
  exists (select 1 from establishments e where e.id = fixed_costs.establishment_id and e.user_id = auth.uid())
);
create policy "fixed_costs_update_own" on fixed_costs for update using (
  exists (select 1 from establishments e where e.id = fixed_costs.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = fixed_costs.establishment_id and e.user_id = auth.uid())
);
create policy "fixed_costs_delete_own" on fixed_costs for delete using (
  exists (select 1 from establishments e where e.id = fixed_costs.establishment_id and e.user_id = auth.uid())
);

-- Énergie / eau
create table if not exists utilities (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  type text not null default 'electricite' check (type in ('electricite', 'gaz', 'eau')),
  recorded_at date not null default current_date,
  consumption numeric not null check (consumption >= 0),
  unite text not null default 'kWh',
  prix numeric not null check (prix >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists utilities_establishment_id_idx on utilities(establishment_id);
alter table utilities enable row level security;

create policy "utilities_select_own" on utilities for select using (
  exists (select 1 from establishments e where e.id = utilities.establishment_id and e.user_id = auth.uid())
);
create policy "utilities_insert_own" on utilities for insert with check (
  exists (select 1 from establishments e where e.id = utilities.establishment_id and e.user_id = auth.uid())
);
create policy "utilities_update_own" on utilities for update using (
  exists (select 1 from establishments e where e.id = utilities.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = utilities.establishment_id and e.user_id = auth.uid())
);
create policy "utilities_delete_own" on utilities for delete using (
  exists (select 1 from establishments e where e.id = utilities.establishment_id and e.user_id = auth.uid())
);
