-- Jeu de données COMPLET et autonome pour tester toutes les fonctionnalités de
-- l'application : ingrédients, fournisseurs + historique d'achats, recettes,
-- prévisionnel mensuel (saisonnier), ventes réelles, salariés/charges fixes
-- saisonniers, énergie sur plusieurs années, marge cible et historique de calculs.
--
-- Ce script crée son propre établissement ("Boulangerie Test Complet") pour ne
-- rien mélanger avec vos données existantes. Il est ré-exécutable sans erreur :
-- l'établissement, les ingrédients, les recettes et les fournisseurs sont mis à
-- jour s'ils existent déjà (le reste — achats, énergie, historique — est rejoué
-- à l'identique, donc à exécuter en principe une seule fois).
--
-- Cible le compte dont l'email est ci-dessous. Changez-le si besoin.

do $$
declare
  target_email text := 'francois.svg@hotmail.fr';
  v_user_id uuid;
  est_id uuid;

  ing_farine_t55 uuid;
  ing_farine_t65 uuid;
  ing_levure uuid;
  ing_sel uuid;
  ing_beurre uuid;
  ing_sucre uuid;
  ing_oeufs uuid;
  ing_lait uuid;
  ing_chocolat uuid;
  ing_levain uuid;
  ing_creme uuid;
  ing_pommes uuid;
  ing_fraises uuid;
  ing_amandes uuid;

  rec_baguette uuid;
  rec_painchoc uuid;
  rec_croissant uuid;
  rec_tarte_pommes uuid;
  rec_campagne uuid;
  rec_eclair uuid;
  rec_tarte_fraises uuid;
  rec_financier uuid;

  sup_grandval uuid;
  sup_moulin_bio uuid;
  sup_ferme uuid;
  sup_chocolats uuid;
  sup_verger uuid;
begin
  select id into v_user_id from auth.users where email = target_email;
  if v_user_id is null then
    raise exception 'Aucun compte avec l''email % trouvé. Modifiez target_email en haut du script, valeur trouvable via: select email from auth.users;', target_email;
  end if;

  -- Établissement (réutilisé si déjà créé par une exécution précédente)
  select id into est_id from establishments where establishments.user_id = v_user_id and nom = 'Boulangerie Test Complet';
  if est_id is null then
    insert into establishments (user_id, nom, type) values (v_user_id, 'Boulangerie Test Complet', 'Boulangerie')
    returning id into est_id;
  end if;

  -- ==========================================================================
  -- Ingrédients
  -- ==========================================================================
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Farine T55', 'Farines et céréales', 25, 'kg', 'g', 18.50)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_farine_t55;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Farine T65', 'Farines et céréales', 25, 'kg', 'g', 19.90)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_farine_t65;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Levure boulangère', 'Épicerie', 500, 'g', 'g', 4.20)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_levure;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Sel fin', 'Épicerie', 1, 'kg', 'g', 0.90)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_sel;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Beurre doux', 'Produits laitiers', 5, 'kg', 'g', 30.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_beurre;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Sucre en poudre', 'Épicerie', 5, 'kg', 'g', 6.50)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_sucre;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Œufs', 'Œufs', 30, 'piece', 'piece', 6.50)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_oeufs;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Lait entier', 'Produits laitiers', 6, 'l', 'ml', 7.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_lait;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Chocolat noir pistoles', 'Épicerie', 2, 'kg', 'g', 17.50)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_chocolat;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Levain naturel', 'Farines et céréales', 1, 'kg', 'g', 5.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_levain;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Crème fraîche', 'Produits laitiers', 1, 'l', 'ml', 4.80)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_creme;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Pommes', 'Fruits et légumes', 10, 'kg', 'g', 15.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_pommes;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Fraises', 'Fruits et légumes', 5, 'kg', 'g', 22.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_fraises;
  insert into ingredients (establishment_id, nom, categorie, purchase_quantity, purchase_unit, usage_unit, purchase_price)
    values (est_id, 'Amandes en poudre', 'Épicerie', 1, 'kg', 'g', 14.00)
    on conflict (establishment_id, lower(nom)) do update set purchase_price = excluded.purchase_price
    returning id into ing_amandes;

  -- ==========================================================================
  -- Recettes (dont deux nouvelles : Tarte aux fraises et Financier amande)
  -- ==========================================================================
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Baguette tradition', 1, 1.20)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_baguette;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Pain au chocolat', 1, 1.40)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_painchoc;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Croissant beurre', 1, 1.30)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_croissant;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Tarte aux pommes (6 parts)', 6, 18.00)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_tarte_pommes;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Pain de campagne', 1, 3.80)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_campagne;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Éclair au chocolat', 1, 3.20)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_eclair;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Tarte aux fraises (6 parts)', 6, 20.00)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_tarte_fraises;
  insert into recipes (establishment_id, nom, portions, prix_vente) values (est_id, 'Financier amande', 1, 2.50)
    on conflict (establishment_id, lower(nom)) do update set prix_vente = excluded.prix_vente
    returning id into rec_financier;

  -- ==========================================================================
  -- Ingrédients de chaque recette
  -- ==========================================================================
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

    (rec_tarte_pommes, ing_pommes, 1200, 'g'),
    (rec_tarte_pommes, ing_farine_t55, 300, 'g'),
    (rec_tarte_pommes, ing_beurre, 150, 'g'),
    (rec_tarte_pommes, ing_sucre, 100, 'g'),
    (rec_tarte_pommes, ing_oeufs, 2, 'piece'),
    (rec_tarte_pommes, ing_creme, 200, 'ml'),

    (rec_campagne, ing_farine_t55, 450, 'g'),
    (rec_campagne, ing_levain, 100, 'g'),
    (rec_campagne, ing_sel, 9, 'g'),

    (rec_eclair, ing_farine_t65, 70, 'g'),
    (rec_eclair, ing_beurre, 40, 'g'),
    (rec_eclair, ing_oeufs, 2, 'piece'),
    (rec_eclair, ing_chocolat, 30, 'g'),
    (rec_eclair, ing_lait, 125, 'ml'),

    (rec_tarte_fraises, ing_fraises, 900, 'g'),
    (rec_tarte_fraises, ing_farine_t55, 250, 'g'),
    (rec_tarte_fraises, ing_beurre, 120, 'g'),
    (rec_tarte_fraises, ing_sucre, 80, 'g'),
    (rec_tarte_fraises, ing_oeufs, 1, 'piece'),
    (rec_tarte_fraises, ing_creme, 150, 'ml'),

    (rec_financier, ing_amandes, 80, 'g'),
    (rec_financier, ing_beurre, 60, 'g'),
    (rec_financier, ing_sucre, 70, 'g'),
    (rec_financier, ing_oeufs, 3, 'piece'),
    (rec_financier, ing_farine_t55, 20, 'g')
  on conflict (recipe_id, ingredient_id) do update set quantite = excluded.quantite, unite = excluded.unite;

  -- ==========================================================================
  -- Prévisionnel mensuel par recette (saisonnier, janvier -> décembre)
  -- ==========================================================================
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_baguette, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[220,220,240,250,260,300,340,340,270,240,220,260])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_painchoc, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[160,160,170,150,140,120,100,100,150,170,180,190])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_croissant, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[180,180,190,170,160,140,120,120,170,190,200,210])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_tarte_pommes, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[50,40,30,20,15,10,10,15,60,90,80,70])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_campagne, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[40,40,38,35,32,30,28,28,32,36,38,42])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_eclair, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[25,25,28,30,32,35,38,38,32,28,25,30])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  -- Tarte aux fraises : produit d'été, quasi nulle hors saison
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_tarte_fraises, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[5,5,8,15,35,60,80,85,70,30,10,5])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;
  insert into recipe_monthly_forecasts (recipe_id, month, quantity)
  select rec_financier, unnest(array[1,2,3,4,5,6,7,8,9,10,11,12]),
         unnest(array[40,40,42,45,48,50,50,48,45,42,40,40])
  on conflict (recipe_id, month) do update set quantity = excluded.quantity;

  -- ==========================================================================
  -- Ventes réelles (réalisé) : pour chaque mois déjà écoulé cette année, une
  -- valeur proche du prévisionnel (± 15%), pour tester Planning et le graphique
  -- "Prévisionnel vs réalisé" du Rapport.
  -- ==========================================================================
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

  -- ==========================================================================
  -- Salariés (Marc = renfort d'été, Sophie = pâtissière saisonnière d'hiver)
  -- ==========================================================================
  insert into employees (establishment_id, nom, salary_mode, hourly_rate, hours_per_week, monthly_salary, note, active_months) values
    (est_id, 'Julie (boulangère)', 'mensuel', 0, 35, 2200, 'Temps plein', null),
    (est_id, 'Marc (vente, renfort été)', 'horaire', 12.50, 20, 0, 'Temps partiel saisonnier', array[6,7,8]),
    (est_id, 'Sophie (pâtisserie, hiver)', 'horaire', 14.00, 25, 0, 'Renfort tartes/financiers d''hiver', array[10,11,12,1,2,3]);

  -- ==========================================================================
  -- Charges fixes (chauffage l'hiver, climatisation l'été)
  -- ==========================================================================
  insert into fixed_costs (establishment_id, nom, montant, frequence, categorie, note, active_months) values
    (est_id, 'Loyer', 1400, 'mensuel', 'Local', '', null),
    (est_id, 'Assurance', 600, 'annuel', 'Assurance', '', null),
    (est_id, 'Logiciel caisse', 45, 'mensuel', 'Abonnements', '', null),
    (est_id, 'Chauffage', 180, 'mensuel', 'Énergie', '', array[11,12,1,2,3]),
    (est_id, 'Climatisation', 90, 'mensuel', 'Énergie', '', array[6,7,8]);

  -- ==========================================================================
  -- Marge cible et quantité de secours
  -- ==========================================================================
  insert into establishment_settings (establishment_id, quantite_mensuelle_reference, marge_cible)
  values (est_id, 500, 70)
  on conflict (establishment_id) do update set
    quantite_mensuelle_reference = excluded.quantite_mensuelle_reference,
    marge_cible = excluded.marge_cible;

  -- ==========================================================================
  -- Fournisseurs
  -- ==========================================================================
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
  insert into suppliers (establishment_id, nom, contact) values (est_id, 'Verger du Coin', '06 11 22 33 44')
    on conflict (establishment_id, nom) do update set contact = excluded.contact
    returning id into sup_verger;

  -- ==========================================================================
  -- Historique d'achats (avec fournisseur), pour tester la comparaison de prix
  -- et le rapport des hausses fournisseurs.
  -- ==========================================================================
  insert into ingredient_purchases (establishment_id, ingredient_id, supplier_id, purchased_at, quantity, unit, price, note) values
    -- Farine T55 : deux fournisseurs, pour comparer
    (est_id, ing_farine_t55, sup_grandval, (current_date - interval '90 days')::date, 25, 'kg', 17.80, ''),
    (est_id, ing_farine_t55, sup_grandval, (current_date - interval '60 days')::date, 25, 'kg', 18.20, ''),
    (est_id, ing_farine_t55, sup_grandval, (current_date - interval '30 days')::date, 25, 'kg', 18.50, ''),
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '55 days')::date, 25, 'kg', 19.00, ''),
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '25 days')::date, 25, 'kg', 19.20, ''),
    (est_id, ing_farine_t55, sup_moulin_bio, (current_date - interval '3 days')::date, 25, 'kg', 19.50, ''),

    -- Beurre : hausse notable
    (est_id, ing_beurre, sup_ferme, (current_date - interval '100 days')::date, 5, 'kg', 30.00, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '70 days')::date, 5, 'kg', 31.20, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '35 days')::date, 5, 'kg', 32.50, ''),
    (est_id, ing_beurre, sup_ferme, (current_date - interval '5 days')::date, 5, 'kg', 34.00, ''),

    -- Lait et œufs, même fournisseur
    (est_id, ing_lait, sup_ferme, (current_date - interval '90 days')::date, 6, 'l', 7.00, ''),
    (est_id, ing_lait, sup_ferme, (current_date - interval '45 days')::date, 6, 'l', 7.15, ''),
    (est_id, ing_lait, sup_ferme, (current_date - interval '3 days')::date, 6, 'l', 7.35, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '90 days')::date, 30, 'piece', 6.50, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '45 days')::date, 30, 'piece', 6.75, ''),
    (est_id, ing_oeufs, sup_ferme, (current_date - interval '3 days')::date, 30, 'piece', 7.10, ''),

    -- Chocolat : hausse marquée (cours du cacao)
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '100 days')::date, 2, 'kg', 17.50, ''),
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '50 days')::date, 2, 'kg', 18.40, ''),
    (est_id, ing_chocolat, sup_chocolats, (current_date - interval '5 days')::date, 2, 'kg', 19.80, ''),

    -- Fraises et pommes
    (est_id, ing_fraises, sup_verger, (current_date - interval '60 days')::date, 5, 'kg', 20.00, ''),
    (est_id, ing_fraises, sup_verger, (current_date - interval '20 days')::date, 5, 'kg', 22.00, ''),
    (est_id, ing_fraises, sup_verger, (current_date - interval '2 days')::date, 5, 'kg', 24.50, ''),
    (est_id, ing_pommes, sup_verger, (current_date - interval '80 days')::date, 10, 'kg', 14.50, ''),
    (est_id, ing_pommes, sup_verger, (current_date - interval '40 days')::date, 10, 'kg', 15.00, ''),
    (est_id, ing_pommes, sup_verger, (current_date - interval '10 days')::date, 10, 'kg', 15.30, '');

  -- ==========================================================================
  -- Historique des calculs (coût de revient vs prix de vente dans le temps),
  -- pour tester "Achat vs vente dans le temps" dans l'onglet Historique.
  -- ==========================================================================
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
    ('Tarte aux pommes (6 parts)', (current_date - interval '5 days')::date, 3.70, 1.30, 0.833, 18.00),

    ('Tarte aux fraises (6 parts)', (current_date - interval '90 days')::date, 4.20, 1.30, 0.917, 20.00),
    ('Tarte aux fraises (6 parts)', (current_date - interval '45 days')::date, 4.40, 1.35, 0.958, 20.00),
    ('Tarte aux fraises (6 parts)', (current_date - interval '5 days')::date, 4.60, 1.40, 1.000, 20.00),

    ('Financier amande', (current_date - interval '90 days')::date, 0.55, 0.25, 0.80, 2.50),
    ('Financier amande', (current_date - interval '45 days')::date, 0.58, 0.26, 0.84, 2.50),
    ('Financier amande', (current_date - interval '5 days')::date, 0.62, 0.28, 0.90, 2.50)
  ) as snap(recipe_nom, calculated_at, cout_matiere, quote_part_frais, cout_revient_unitaire, prix_vente)
    on r.nom = snap.recipe_nom
  where r.establishment_id = est_id;

  -- ==========================================================================
  -- Énergie / eau sur 24 mois, avec saisonnalité (chauffage l'hiver), pour que
  -- la moyenne historique par mois calendaire (Planning, Rapport) ait du sens.
  -- ==========================================================================
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

  raise notice 'Établissement "Boulangerie Test Complet" prêt (id: %).', est_id;
end $$;
