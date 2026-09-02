-- Données de test pour les fonctionnalités récentes : fournisseurs, ventes réelles
-- (prévisionnel vs réalisé), historique des calculs (achat vs vente) et énergie sur
-- plusieurs mois (pour la moyenne saisonnière du Rapport/Planning).
--
-- Prérequis : avoir déjà exécuté supabase/seed_examples.sql sur l'établissement
-- nommé 'test' (ce script réutilise ses ingrédients et recettes par leur nom).
-- À exécuter une seule fois, dans le SQL Editor de Supabase.

do $$
declare
  est_id uuid;

  ing_farine_t55 uuid;
  ing_beurre uuid;
  ing_lait uuid;
  ing_oeufs uuid;
  ing_chocolat uuid;

  sup_grandval uuid;
  sup_moulin_bio uuid;
  sup_ferme uuid;
  sup_chocolats uuid;

  recipe_count int;
begin
  select id into est_id from establishments where nom ilike 'test' order by created_at desc limit 1;
  if est_id is null then
    raise exception 'Aucun établissement nommé ''test'' trouvé. Éditez le script (where nom ilike ...) avec le nom exact du vôtre, visible via: select id, nom from establishments;';
  end if;

  select count(*) into recipe_count from recipes where establishment_id = est_id;
  if recipe_count = 0 then
    raise exception 'Aucune recette trouvée pour cet établissement. Exécutez d''abord supabase/seed_examples.sql.';
  end if;

  select id into ing_farine_t55 from ingredients where establishment_id = est_id and nom = 'Farine T55';
  select id into ing_beurre from ingredients where establishment_id = est_id and nom = 'Beurre doux';
  select id into ing_lait from ingredients where establishment_id = est_id and nom = 'Lait entier';
  select id into ing_oeufs from ingredients where establishment_id = est_id and nom = 'Œufs';
  select id into ing_chocolat from ingredients where establishment_id = est_id and nom = 'Chocolat noir pistoles';
  if ing_farine_t55 is null or ing_beurre is null or ing_lait is null or ing_oeufs is null or ing_chocolat is null then
    raise exception 'Un ou plusieurs ingrédients attendus sont introuvables. Exécutez d''abord supabase/seed_examples.sql.';
  end if;

  -- Fournisseurs
  insert into suppliers (establishment_id, nom, contact) values (est_id, 'Minoterie Grandval', '03 44 12 34 56')
    on conflict (establishment_id, nom) do update set contact = excluded.contact
    returning id into sup_grandval;
  insert into suppliers (establishment_id, nom, contact) values (est_id, 'Moulin Bio du Sud', 'contact@moulinbiodusud.fr')
    on conflict (establishment_id, nom) do update set contact = excluded.contact
    returning id into sup_moulin_bio;
  insert into suppliers (establishment_id, nom, contact) values (est_id, 'Ferme des 3 Vallées', '06 78 90 12 34')
    on conflict (establishment_id, nom) do update set contact = excluded.contact
    returning id into sup_ferme;
  insert into suppliers (establishment_id, nom, contact) values (est_id, 'Chocolats Excellence', 'commandes@choc-excellence.fr')
    on conflict (establishment_id, nom) do update set contact = excluded.contact
    returning id into sup_chocolats;

  -- Rattache les 3 achats de farine T55 déjà présents (seed_examples.sql) à Minoterie Grandval
  update ingredient_purchases
  set supplier_id = sup_grandval
  where establishment_id = est_id and ingredient_id = ing_farine_t55 and supplier_id is null;

  -- Fournisseur concurrent pour la farine T55, pour tester la comparaison de prix
  insert into ingredient_purchases (establishment_id, ingredient_id, supplier_id, purchased_at, quantity, unit, price, note) values
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '55 days')::date, 25, 'kg', 19.00, ''),
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '25 days')::date, 25, 'kg', 19.20, ''),
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '3 days')::date, 25, 'kg', 19.50, '');

  -- Beurre : hausse notable, pour le rapport fournisseurs
  insert into ingredient_purchases (establishment_id, ingredient_id, supplier_id, purchased_at, quantity, unit, price, note) values
    (est_id, ing_beurre, sup_ferme, (current_date - interval '100 days')::date, 5, 'kg', 30.00, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '70 days')::date, 5, 'kg', 31.20, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '35 days')::date, 5, 'kg', 32.50, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '5 days')::date, 5, 'kg', 34.00, '');

  -- Lait et œufs, même fournisseur
  insert into ingredient_purchases (establishment_id, ingredient_id, supplier_id, purchased_at, quantity, unit, price, note) values
    (est_id, ing_lait, sup_ferme, (current_date - interval '90 days')::date, 6, 'l', 7.00, ''),
    (est_id, ing_lait, sup_ferme, (current_date - interval '45 days')::date, 6, 'l', 7.15, ''),
    (est_id, ing_lait, sup_ferme, (current_date - interval '3 days')::date, 6, 'l', 7.35, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '90 days')::date, 30, 'piece', 6.50, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '45 days')::date, 30, 'piece', 6.75, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '3 days')::date, 30, 'piece', 7.10, '');

  -- Chocolat : hausse marquée (cours du cacao)
  insert into ingredient_purchases (establishment_id, ingredient_id, supplier_id, purchased_at, quantity, unit, price, note) values
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '100 days')::date, 2, 'kg', 17.50, ''),
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '50 days')::date, 2, 'kg', 18.40, ''),
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '5 days')::date, 2, 'kg', 19.80, '');

  -- Ventes réelles (réalisé) : pour chaque mois déjà écoulé cette année, une valeur
  -- proche du prévisionnel (± 15%), pour tester la colonne "Réalisé" du Planning et
  -- le graphique "Prévisionnel vs réalisé" du Rapport.
  insert into recipe_monthly_actuals (recipe_id, year, month, quantity)
  select f.recipe_id,
         extract(year from current_date)::smallint,
         f.month,
         round(f.quantity * (0.85 + random() * 0.3))
  from recipe_monthly_forecasts f
  join recipes r on r.id = f.recipe_id
  where r.establishment_id = est_id
    and f.month <= extract(month from current_date)::int
  on conflict (recipe_id, year, month) do update set quantity = excluded.quantity;

  -- Historique des calculs (coût de revient vs prix de vente dans le temps), pour
  -- tester la section "Achat vs vente dans le temps" de l'onglet Historique.
  insert into cost_history (
    establishment_id, recipe_id, recipe_nom, calculated_at,
    cout_matiere, quote_part_frais, cout_revient_unitaire, portions, prix_vente, marge, taux_marge, prix_conseille
  )
  select est_id, r.id, r.nom, snap.calculated_at,
         snap.cout_matiere, snap.quote_part_frais, snap.cout_revient_unitaire, r.portions,
         snap.prix_vente, snap.prix_vente - snap.cout_revient_unitaire,
         case when snap.prix_vente > 0 then (snap.prix_vente - snap.cout_revient_unitaire) / snap.prix_vente * 100 else 0 end,
         snap.cout_revient_unitaire / 0.3
  from recipes r
  join (values
    ('Baguette tradition', (current_date - interval '90 days')::date, 0.28::numeric, 0.18::numeric, 0.46::numeric, 1.20::numeric),
    ('Baguette tradition', (current_date - interval '45 days')::date, 0.29, 0.20, 0.49, 1.20),
    ('Baguette tradition', (current_date - interval '5 days')::date, 0.31, 0.21, 0.52, 1.20),

    ('Pain au chocolat', (current_date - interval '90 days')::date, 0.40, 0.22, 0.62, 1.35),
    ('Pain au chocolat', (current_date - interval '45 days')::date, 0.42, 0.23, 0.65, 1.40),
    ('Pain au chocolat', (current_date - interval '5 days')::date, 0.44, 0.24, 0.68, 1.40),

    ('Croissant beurre', (current_date - interval '90 days')::date, 0.38, 0.20, 0.58, 1.30),
    ('Croissant beurre', (current_date - interval '45 days')::date, 0.39, 0.21, 0.60, 1.30),
    ('Croissant beurre', (current_date - interval '5 days')::date, 0.41, 0.22, 0.63, 1.30),

    ('Pain de campagne', (current_date - interval '90 days')::date, 0.55, 0.30, 0.85, 3.80),
    ('Pain de campagne', (current_date - interval '45 days')::date, 0.57, 0.31, 0.88, 3.80),
    ('Pain de campagne', (current_date - interval '5 days')::date, 0.60, 0.33, 0.93, 3.80),

    ('Éclair au chocolat', (current_date - interval '90 days')::date, 0.62, 0.28, 0.90, 3.20),
    ('Éclair au chocolat', (current_date - interval '45 days')::date, 0.65, 0.29, 0.94, 3.20),
    ('Éclair au chocolat', (current_date - interval '5 days')::date, 0.70, 0.31, 1.01, 3.20),

    ('Tarte aux pommes (6 parts)', (current_date - interval '90 days')::date, 3.40, 1.20, 0.767, 18.00),
    ('Tarte aux pommes (6 parts)', (current_date - interval '45 days')::date, 3.55, 1.25, 0.800, 18.00),
    ('Tarte aux pommes (6 parts)', (current_date - interval '5 days')::date, 3.70, 1.30, 0.833, 18.00)
  ) as snap(recipe_nom, calculated_at, cout_matiere, quote_part_frais, cout_revient_unitaire, prix_vente)
    on r.nom = snap.recipe_nom
  where r.establishment_id = est_id;

  -- Énergie / eau sur 24 mois, avec une saisonnalité (chauffage l'hiver), pour que
  -- la moyenne historique par mois calendaire (Planning, Rapport) ait du sens.
  with months as (
    select
      (date_trunc('month', current_date) - (n || ' months')::interval)::date as month_start,
      extract(month from (date_trunc('month', current_date) - (n || ' months')::interval))::int as moy
    from generate_series(1, 24) as n
  )
  insert into utilities (establishment_id, type, recorded_at, consumption, unite, prix, note)
  select est_id, 'electricite', month_start,
         round((case when moy in (12, 1, 2, 3) then 1100 when moy in (6, 7, 8) then 650 else 850 end + (random() * 100 - 50))::numeric),
         'kWh',
         round((case when moy in (12, 1, 2, 3) then 280 when moy in (6, 7, 8) then 160 else 210 end + (random() * 30 - 15))::numeric, 2),
         'Facture mensuelle (test)'
  from months
  union all
  select est_id, 'eau', month_start,
         round((12 + (random() * 4 - 2))::numeric, 1),
         'm3',
         round((45 + (random() * 10 - 5))::numeric, 2),
         'Facture mensuelle (test)'
  from months;

end $$;
