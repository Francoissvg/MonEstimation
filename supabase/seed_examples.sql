-- Jeu de données d'exemple pour tester l'application (ingrédients, recettes,
-- frais généraux). À exécuter une seule fois, dans le SQL Editor de Supabase.
--
-- Par défaut, il cible l'établissement nommé 'test'. Si le vôtre a un autre
-- nom, changez la valeur ci-dessous (ligne "where nom ilike ...").

do $$
declare
  est_id uuid;

  ing_farine_t55 uuid := gen_random_uuid();
  ing_farine_t65 uuid := gen_random_uuid();
  ing_levure uuid := gen_random_uuid();
  ing_sel uuid := gen_random_uuid();
  ing_beurre uuid := gen_random_uuid();
  ing_sucre uuid := gen_random_uuid();
  ing_oeufs uuid := gen_random_uuid();
  ing_lait uuid := gen_random_uuid();
  ing_chocolat uuid := gen_random_uuid();
  ing_levain uuid := gen_random_uuid();
  ing_creme uuid := gen_random_uuid();
  ing_pommes uuid := gen_random_uuid();

  rec_baguette uuid := gen_random_uuid();
  rec_painchoc uuid := gen_random_uuid();
  rec_croissant uuid := gen_random_uuid();
  rec_tarte uuid := gen_random_uuid();
  rec_campagne uuid := gen_random_uuid();
  rec_eclair uuid := gen_random_uuid();
begin
  select id into est_id from establishments where nom ilike 'test' order by created_at desc limit 1;

  if est_id is null then
    raise exception 'Aucun établissement nommé ''test'' trouvé. Éditez le script (where nom ilike ...) avec le nom exact du vôtre, visible via: select id, nom from establishments;';
  end if;

  -- Ingrédients
  insert into ingredients (id, establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price) values
    (ing_farine_t55, est_id, 'Farine T55', 'Farines et céréales', 25, 'kg', 'g', 18.50),
    (ing_farine_t65, est_id, 'Farine T65', 'Farines et céréales', 25, 'kg', 'g', 19.90),
    (ing_levure, est_id, 'Levure boulangère', 'Épicerie', 500, 'g', 'g', 4.20),
    (ing_sel, est_id, 'Sel fin', 'Épicerie', 1, 'kg', 'g', 0.90),
    (ing_beurre, est_id, 'Beurre doux', 'Produits laitiers', 5, 'kg', 'g', 32.00),
    (ing_sucre, est_id, 'Sucre en poudre', 'Épicerie', 5, 'kg', 'g', 6.50),
    (ing_oeufs, est_id, 'Œufs', 'Œufs', 30, 'piece', 'piece', 6.90),
    (ing_lait, est_id, 'Lait entier', 'Produits laitiers', 6, 'l', 'ml', 7.20),
    (ing_chocolat, est_id, 'Chocolat noir pistoles', 'Épicerie', 2, 'kg', 'g', 18.00),
    (ing_levain, est_id, 'Levain naturel', 'Farines et céréales', 1, 'kg', 'g', 5.00),
    (ing_creme, est_id, 'Crème fraîche', 'Produits laitiers', 1, 'l', 'ml', 4.80),
    (ing_pommes, est_id, 'Pommes', 'Fruits et légumes', 10, 'kg', 'g', 15.00);

  -- Recettes (prix de vente réaliste)
  insert into recipes (id, establishment_id, nom, portions, prix_vente) values
    (rec_baguette, est_id, 'Baguette tradition', 1, 1.20),
    (rec_painchoc, est_id, 'Pain au chocolat', 1, 1.40),
    (rec_croissant, est_id, 'Croissant beurre', 1, 1.30),
    (rec_tarte, est_id, 'Tarte aux pommes (6 parts)', 6, 18.00),
    (rec_campagne, est_id, 'Pain de campagne', 1, 3.80),
    (rec_eclair, est_id, 'Éclair au chocolat', 1, 3.20);

  -- Ingrédients de chaque recette
  insert into recipe_ingredients (recipe_id, ingredient_id, quantite, unite) values
    (rec_baguette, ing_farine_t55, 320, 'g'),
    (rec_baguette, ing_levure, 6, 'g'),
    (rec_baguette, ing_sel, 6, 'g'),

    (rec_painchoc, ing_farine_t65, 60, 'g'),
    (rec_painchoc, ing_beurre, 20, 'g'),
    (rec_painchoc, ing_chocolat, 12, 'g'),
    (rec_painchoc, ing_sucre, 5, 'g'),

    (rec_croissant, ing_farine_t65, 55, 'g'),
    (rec_croissant, ing_beurre, 25, 'g'),
    (rec_croissant, ing_sucre, 5, 'g'),
    (rec_croissant, ing_lait, 10, 'ml'),

    (rec_tarte, ing_pommes, 1200, 'g'),
    (rec_tarte, ing_farine_t55, 300, 'g'),
    (rec_tarte, ing_beurre, 150, 'g'),
    (rec_tarte, ing_sucre, 100, 'g'),
    (rec_tarte, ing_oeufs, 2, 'piece'),
    (rec_tarte, ing_creme, 200, 'ml'),

    (rec_campagne, ing_farine_t55, 450, 'g'),
    (rec_campagne, ing_levain, 100, 'g'),
    (rec_campagne, ing_sel, 9, 'g'),

    (rec_eclair, ing_farine_t65, 70, 'g'),
    (rec_eclair, ing_beurre, 40, 'g'),
    (rec_eclair, ing_oeufs, 2, 'piece'),
    (rec_eclair, ing_chocolat, 30, 'g'),
    (rec_eclair, ing_lait, 125, 'ml');

  -- Prévisionnel mensuel par recette (variations saisonnières, janvier -> décembre)
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_baguette, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[220,220,240,250,260,300,340,340,270,240,220,260]);
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_painchoc, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[160,160,170,150,140,120,100,100,150,170,180,190]);
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_croissant, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[180,180,190,170,160,140,120,120,170,190,200,210]);
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_tarte, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[50,40,30,20,15,10,10,15,60,90,80,70]);
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_campagne, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[40,40,38,35,32,30,28,28,32,36,38,42]);
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_eclair, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[25,25,28,30,32,35,38,38,32,28,25,30]);

  -- Salariés (Marc est un renfort saisonnier, actif seulement en été)
  insert into employees (establishment_id, nom, salary_mode, hourly_rate, hours_per_week, monthly_salary, note, active_months) values
    (est_id, 'Julie (boulangère)', 'mensuel', 0, 35, 2200, 'Temps plein', null),
    (est_id, 'Marc (vente, renfort été)', 'horaire', 12.50, 20, 0, 'Temps partiel saisonnier', array[6,7,8]);

  -- Charges fixes (le chauffage ne s'applique qu'en hiver)
  insert into fixed_costs (establishment_id, nom, montant, frequence, categorie, note, active_months) values
    (est_id, 'Loyer', 1400, 'mensuel', 'Local', '', null),
    (est_id, 'Assurance', 600, 'annuel', 'Assurance', '', null),
    (est_id, 'Logiciel caisse', 45, 'mensuel', 'Abonnements', '', null),
    (est_id, 'Chauffage', 180, 'mensuel', 'Énergie', '', array[11,12,1,2,3]);

  -- Énergie / eau
  insert into utilities (establishment_id, type, recorded_at, consumption, unite, prix, note) values
    (est_id, 'electricite', current_date, 850, 'kWh', 210, 'Facture du mois'),
    (est_id, 'eau', current_date, 12, 'm3', 45, 'Facture du mois');

  -- Historique d'achats de la farine T55, pour tester la comparaison de prix
  insert into ingredient_purchases (establishment_id, ingredient_id, purchased_at, quantity, unit, price, note) values
    (est_id, ing_farine_t55, (current_date - interval '60 days')::date, 25, 'kg', 17.80, 'Premier fournisseur'),
    (est_id, ing_farine_t55, (current_date - interval '30 days')::date, 25, 'kg', 18.90, 'Hausse du prix du blé'),
    (est_id, ing_farine_t55, current_date, 25, 'kg', 18.50, 'Retour à la normale');

  -- Marge cible et quantité de secours (utilisée seulement si le prévisionnel des recettes est vide)
  insert into establishment_settings (establishment_id, quantite_mensuelle_reference, marge_cible)
  values (est_id, 500, 70)
  on conflict (establishment_id) do update set
    quantite_mensuelle_reference = excluded.quantite_mensuelle_reference,
    marge_cible = excluded.marge_cible;

end $$;
