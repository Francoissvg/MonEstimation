-- Jeu de données volontairement simple : une boulangerie avec une marge nette
-- clairement positive sur chaque recette et sur l'ensemble de l'établissement.
--
-- Les volumes prévisionnels sont calibrés pour que le chiffre d'affaires reste
-- largement supérieur aux frais généraux (loyer, salaire, charges) : la marge
-- nette (après répartition des frais) ressort à environ 60% sur chaque
-- recette. Sans ça, un prix de vente bas (ex: une baguette à 1,30€) associé à
-- un volume trop faible peut faire absorber plus de frais généraux que ce que
-- la recette rapporte, et donner une marge négative même si le coût matière
-- est correct — voir allocateOverhead() dans src/lib/costing.ts.
--
-- Crée son propre établissement ("Boulangerie Marge Positive"), sans toucher
-- à vos autres données. Ré-exécutable sans erreur (upsert sur tout).
--
-- Cible le compte dont l'email est ci-dessous. Changez-le si besoin.

do $$
declare
  target_email text := 'francois.svg@hotmail.fr';
  v_user_id uuid;
  est_id uuid;

  ing_farine uuid;
  ing_beurre uuid;
  ing_sucre uuid;
  ing_levure uuid;
  ing_sel uuid;
  ing_oeufs uuid;
  ing_pommes uuid;

  rec_baguette uuid;
  rec_croissant uuid;
  rec_painchoc uuid;
  rec_tarte_pommes uuid;
begin
  select id into v_user_id from auth.users where email = target_email;
  if v_user_id is null then
    raise exception 'Aucun compte avec l''email % trouvé. Modifiez target_email en haut du script, valeur trouvable via: select email from auth.users;', target_email;
  end if;

  -- Établissement (réutilisé si déjà créé par une exécution précédente)
  select id into est_id from establishments where establishments.user_id = v_user_id and nom = 'Boulangerie Marge Positive';
  if est_id is null then
    insert into establishments (user_id, nom, type) values (v_user_id, 'Boulangerie Marge Positive', 'Boulangerie')
    returning id into est_id;
  end if;

  -- ==========================================================================
  -- Ingrédients
  -- ==========================================================================
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Farine T65', 'Farines et céréales', 25, 'kg', 'g', 20.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_farine;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Beurre doux', 'Produits laitiers', 5, 'kg', 'g', 30.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_beurre;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Sucre en poudre', 'Épicerie', 5, 'kg', 'g', 6.50)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_sucre;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Levure boulangère', 'Épicerie', 500, 'g', 'g', 4.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_levure;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Sel fin', 'Épicerie', 1, 'kg', 'g', 0.90)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_sel;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Œufs', 'Œufs', 30, 'piece', 'piece', 6.60)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_oeufs;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Pommes', 'Fruits et légumes', 10, 'kg', 'g', 15.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_pommes;

  -- ==========================================================================
  -- Recettes (prix de vente exprimé par part, comme partout dans l'app)
  -- ==========================================================================
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Baguette tradition', 1, 1.30)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente, portions = excluded.portions
    returning id into rec_baguette;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Croissant beurre', 1, 1.40)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente, portions = excluded.portions
    returning id into rec_croissant;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Pain au chocolat', 1, 1.45)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente, portions = excluded.portions
    returning id into rec_painchoc;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Tarte aux pommes (6 parts)', 6, 3.20)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente, portions = excluded.portions
    returning id into rec_tarte_pommes;

  -- ==========================================================================
  -- Ingrédients de chaque recette
  -- ==========================================================================
  insert into recipe_ingredients (recipe_id, ingredient_id, quantite, unite) values
    (rec_baguette, ing_farine, 320, 'g'),
    (rec_baguette, ing_levure, 6, 'g'),
    (rec_baguette, ing_sel, 6, 'g'),

    (rec_croissant, ing_farine, 55, 'g'),
    (rec_croissant, ing_beurre, 25, 'g'),
    (rec_croissant, ing_sucre, 5, 'g'),

    (rec_painchoc, ing_farine, 60, 'g'),
    (rec_painchoc, ing_beurre, 20, 'g'),
    (rec_painchoc, ing_sucre, 5, 'g'),

    (rec_tarte_pommes, ing_pommes, 1200, 'g'),
    (rec_tarte_pommes, ing_farine, 300, 'g'),
    (rec_tarte_pommes, ing_beurre, 150, 'g'),
    (rec_tarte_pommes, ing_sucre, 100, 'g'),
    (rec_tarte_pommes, ing_oeufs, 2, 'piece')
  on conflict (recipe_id, ingredient_id) do update set quantite = excluded.quantite, unite = excluded.unite;

  -- ==========================================================================
  -- Prévisionnel mensuel (même volume les 12 mois, pour que la marge soit
  -- positive quel que soit le mois affiché dans l'app)
  -- ==========================================================================
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_baguette, generate_series(1, 12), 6000
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_croissant, generate_series(1, 12), 3000
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_painchoc, generate_series(1, 12), 2500
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_tarte_pommes, generate_series(1, 12), 60
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;

  -- ==========================================================================
  -- Frais généraux modestes : le total (≈3 155 €/mois) reste largement sous
  -- le chiffre d'affaires prévisionnel (≈16 800 €/mois), donc les frais
  -- répartis par recette restent bas devant chaque prix de vente.
  -- ==========================================================================
  insert into employees (establishment_id, nom, salary_mode, hourly_rate, hours_per_week, monthly_salary, note, active_months) values
    (est_id, 'Boulanger (temps plein)', 'mensuel', 0, 35, 2200, '', null)
  on conflict do nothing;

  insert into fixed_costs (establishment_id, nom, montant, frequence, categorie, note, active_months) values
    (est_id, 'Loyer', 900, 'mensuel', 'Local', '', null),
    (est_id, 'Assurance', 300, 'annuel', 'Assurance', '', null),
    (est_id, 'Logiciel caisse', 30, 'mensuel', 'Abonnements', '', null)
  on conflict do nothing;

  -- ==========================================================================
  -- Marge cible et quantité de secours (utilisées seulement si aucune recette
  -- prévisionnalisée n'est tarifée, ce qui n'arrive pas ici)
  -- ==========================================================================
  insert into establishment_settings (establishment_id, quantite_mensuelle_reference, marge_cible)
  values (est_id, 1000, 65)
  on conflict (establishment_id) do update set
    quantite_mensuelle_reference = excluded.quantite_mensuelle_reference,
    marge_cible = excluded.marge_cible;

  raise notice 'Établissement "Boulangerie Marge Positive" prêt (id: %). Marge nette attendue ≈ 60%%.', est_id;
end $$;
