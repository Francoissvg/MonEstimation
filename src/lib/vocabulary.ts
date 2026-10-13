// Vocabulaire affiché selon le métier de l'établissement. Le modèle de données reste
// le même (ingredients / recipes) ; seuls les libellés changent. Uniquement des
// chaînes et booléens : l'objet peut être passé tel quel à un Client Component.
export type Vocabulary = {
  // Ingrédients (masculin) / Fournitures (féminin) : les tournures accordées sont
  // données entières plutôt que reconstruites à partir d'un article.
  ingredients: string; // "Ingrédients"
  ingredientsLower: string; // "ingrédients"
  ingredient: string; // "Ingrédient"
  anIngredient: string; // "un ingrédient"
  thisIngredient: string; // "cet ingrédient"
  theIngredient: string; // "l'ingrédient"
  sameIngredient: string; // "un même ingrédient"
  noIngredient: string; // "Aucun ingrédient"
  ingredientExists: string; // "Un ingrédient avec ce nom existe déjà."
  chooseIngredient: string; // "Choisissez un ingrédient."
  ingredientNotFound: string; // "Ingrédient introuvable."

  recipes: string; // "Recettes"
  recipesLower: string; // "recettes"
  recipe: string; // "Recette"
  recipeLower: string; // "recette"

  // Unité de production (fournée) et unité vendue (part).
  batch: string; // "fournée"
  batches: string; // "fournées"
  part: string; // "part"
  parts: string; // "parts"
  // Masque le nombre de parts quand un produit est toujours vendu d'un seul tenant.
  showPortions: boolean;
  // Module "Ateliers" (kit par participant + frais par séance), réservé aux fleuristes.
  hasWorkshops: boolean;

  matterCost: string; // "Coût matière"
  matterCostLower: string; // "coût matière"

  categories: readonly string[];
  ingredientPlaceholder: string; // "Ex : Farine T55"
  recipePlaceholder: string; // "Ex : Baguette tradition"
  pieceLabel: string; // libellé de l'unité "piece" dans les listes d'unités
  defaultPurchaseUnit: "g" | "kg" | "ml" | "l" | "piece";
  purchaseLot: string; // "du paquet acheté"
  seasonalExample: string; // exemple d'écart saisonnier pour la grille du prévisionnel
  starterHint: string;
};

const FOOD: Omit<Vocabulary, "starterHint"> = {
  ingredients: "Ingrédients",
  ingredientsLower: "ingrédients",
  ingredient: "Ingrédient",
  anIngredient: "un ingrédient",
  thisIngredient: "cet ingrédient",
  theIngredient: "l'ingrédient",
  sameIngredient: "un même ingrédient",
  noIngredient: "Aucun ingrédient",
  ingredientExists: "Un ingrédient avec ce nom existe déjà.",
  chooseIngredient: "Choisissez un ingrédient.",
  ingredientNotFound: "Ingrédient introuvable.",
  recipes: "Recettes",
  recipesLower: "recettes",
  recipe: "Recette",
  recipeLower: "recette",
  batch: "fournée",
  batches: "fournées",
  part: "part",
  parts: "parts",
  showPortions: true,
  hasWorkshops: false,
  matterCost: "Coût matière",
  matterCostLower: "coût matière",
  categories: [
    "Farines et céréales",
    "Produits laitiers",
    "Viandes",
    "Fruits et légumes",
    "Épicerie",
    "Liquides",
    "Œufs",
    "Autre",
  ],
  ingredientPlaceholder: "Ex : Farine T55",
  recipePlaceholder: "Ex : Baguette tradition",
  pieceLabel: "pièce(s)",
  defaultPurchaseUnit: "kg",
  purchaseLot: "du paquet acheté",
  seasonalExample: "plus de mojitos l'été, moins en hiver",
};

const FLORIST: Omit<Vocabulary, "starterHint"> = {
  ingredients: "Fournitures",
  ingredientsLower: "fournitures",
  ingredient: "Fourniture",
  anIngredient: "une fourniture",
  thisIngredient: "cette fourniture",
  theIngredient: "la fourniture",
  sameIngredient: "une même fourniture",
  noIngredient: "Aucune fourniture",
  ingredientExists: "Une fourniture avec ce nom existe déjà.",
  chooseIngredient: "Choisissez une fourniture.",
  ingredientNotFound: "Fourniture introuvable.",
  recipes: "Compositions",
  recipesLower: "compositions",
  recipe: "Composition",
  recipeLower: "composition",
  // Une composition est vendue d'un seul tenant : "fournée" et "part" se confondent.
  batch: "composition",
  batches: "compositions",
  part: "pièce",
  parts: "pièces",
  showPortions: false,
  hasWorkshops: true,
  matterCost: "Coût fournitures",
  matterCostLower: "coût des fournitures",
  categories: [
    "Fleurs coupées",
    "Feuillages",
    "Plantes",
    "Contenants",
    "Emballage",
    "Accessoires",
    "Autre",
  ],
  ingredientPlaceholder: "Ex : Rose rouge 50 cm (tige)",
  recipePlaceholder: "Ex : Bouquet rond de saison",
  pieceLabel: "tige(s) / pièce(s)",
  defaultPurchaseUnit: "piece",
  purchaseLot: "de la botte ou du lot acheté",
  seasonalExample: "plus de roses à la Saint-Valentin, de chrysanthèmes à la Toussaint",
};

export const ESTABLISHMENT_TYPES = ["Boulangerie", "Restaurant", "Bar", "Fleuriste", "Autre"] as const;
export type EstablishmentType = (typeof ESTABLISHMENT_TYPES)[number];

const VOCABULARIES: Record<EstablishmentType, Vocabulary> = {
  Boulangerie: { ...FOOD, starterHint: "baguette, croissant, pain au chocolat..." },
  Restaurant: { ...FOOD, starterHint: "steak frites, burger, salade composée..." },
  Bar: { ...FOOD, starterHint: "mojito, vodka orange, bière pression..." },
  Fleuriste: { ...FLORIST, starterHint: "bouquet rond, bouquet de roses, centre de table..." },
  Autre: { ...FOOD, starterHint: "sandwich jambon-beurre, sandwich crudités-fromage..." },
};

// Toutes les catégories connues, tous métiers confondus : une catégorie reste
// valide même si elle vient d'un autre vocabulaire (données existantes, import).
export const ALL_INGREDIENT_CATEGORIES: readonly string[] = [
  ...new Set([...FOOD.categories, ...FLORIST.categories]),
];

export function isEstablishmentType(type: string): type is EstablishmentType {
  return (ESTABLISHMENT_TYPES as readonly string[]).includes(type);
}

export function getVocabulary(type: string): Vocabulary {
  return isEstablishmentType(type) ? VOCABULARIES[type] : VOCABULARIES.Autre;
}

// Première lettre en majuscule, pour les tournures placées en début de phrase.
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
