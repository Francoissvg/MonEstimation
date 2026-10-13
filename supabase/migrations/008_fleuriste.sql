-- Ajout du type d'établissement "Fleuriste".
alter table establishments drop constraint if exists establishments_type_check;
alter table establishments
  add constraint establishments_type_check
  check (type in ('Boulangerie', 'Restaurant', 'Bar', 'Fleuriste', 'Autre'));
