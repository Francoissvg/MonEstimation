-- Ateliers de création (fleuristes) : un kit par participant + des frais fixes par séance.
create table if not exists workshops (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  nom text not null check (char_length(trim(nom)) > 0),
  prix_participant numeric not null default 0 check (prix_participant >= 0),
  -- Frais fixes d'une séance, quel que soit le nombre d'inscrits.
  duree_heures numeric not null default 0 check (duree_heures >= 0),
  cout_horaire numeric not null default 0 check (cout_horaire >= 0),
  frais_seance numeric not null default 0 check (frais_seance >= 0),
  min_participants integer not null default 1 check (min_participants >= 1),
  max_participants integer not null default 8 check (max_participants >= min_participants),
  created_at timestamptz not null default now()
);

create unique index if not exists workshops_establishment_nom_unique
  on workshops (establishment_id, lower(nom));
create index if not exists workshops_establishment_id_idx on workshops(establishment_id);

alter table workshops enable row level security;

create policy "workshops_select_own" on workshops for select using (
  exists (select 1 from establishments e where e.id = workshops.establishment_id and e.user_id = auth.uid())
);
create policy "workshops_insert_own" on workshops for insert with check (
  exists (select 1 from establishments e where e.id = workshops.establishment_id and e.user_id = auth.uid())
);
create policy "workshops_update_own" on workshops for update using (
  exists (select 1 from establishments e where e.id = workshops.establishment_id and e.user_id = auth.uid())
) with check (
  exists (select 1 from establishments e where e.id = workshops.establishment_id and e.user_id = auth.uid())
);
create policy "workshops_delete_own" on workshops for delete using (
  exists (select 1 from establishments e where e.id = workshops.establishment_id and e.user_id = auth.uid())
);

-- Kit fourni à CHAQUE participant (quantités par personne).
create table if not exists workshop_items (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantite numeric not null check (quantite > 0),
  unite text not null check (unite in ('g', 'kg', 'ml', 'l', 'piece')),
  unique (workshop_id, ingredient_id)
);

create index if not exists workshop_items_workshop_id_idx on workshop_items(workshop_id);

alter table workshop_items enable row level security;

create policy "workshop_items_select_own" on workshop_items for select using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_items.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_items_insert_own" on workshop_items for insert with check (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_items.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_items_update_own" on workshop_items for update using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_items.workshop_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_items.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_items_delete_own" on workshop_items for delete using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_items.workshop_id and e.user_id = auth.uid()
  )
);

-- Prévisionnel mensuel : nombre de séances et nombre moyen de participants par séance.
create table if not exists workshop_monthly_forecasts (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  sessions numeric not null default 0 check (sessions >= 0),
  participants numeric not null default 0 check (participants >= 0),
  unique (workshop_id, month)
);

create index if not exists workshop_monthly_forecasts_workshop_id_idx on workshop_monthly_forecasts(workshop_id);

alter table workshop_monthly_forecasts enable row level security;

create policy "workshop_monthly_forecasts_select_own" on workshop_monthly_forecasts for select using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_monthly_forecasts.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_monthly_forecasts_insert_own" on workshop_monthly_forecasts for insert with check (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_monthly_forecasts.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_monthly_forecasts_update_own" on workshop_monthly_forecasts for update using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_monthly_forecasts.workshop_id and e.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_monthly_forecasts.workshop_id and e.user_id = auth.uid()
  )
);
create policy "workshop_monthly_forecasts_delete_own" on workshop_monthly_forecasts for delete using (
  exists (
    select 1 from workshops w join establishments e on e.id = w.establishment_id
    where w.id = workshop_monthly_forecasts.workshop_id and e.user_id = auth.uid()
  )
);
