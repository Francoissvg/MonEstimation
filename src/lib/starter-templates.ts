export type StarterIngredient = {
  nom: string;
  categorie: string;
  purchase_quantity: number;
  purchase_unit: "g" | "kg" | "ml" | "l" | "piece";
  purchase_price: number;
};

export type StarterRecipe = {
  nom: string;
  portions: number;
  prix_vente: number;
  items: { ingredient: string; quantite: number; unite: "g" | "kg" | "ml" | "l" | "piece" }[];
};

export type StarterTemplate = {
  ingredients: StarterIngredient[];
  recipes: StarterRecipe[];
};

export const STARTER_TEMPLATES: Record<string, StarterTemplate> = {
  Boulangerie: {
    ingredients: [
      { nom: "Farine T55", categorie: "Farines et céréales", purchase_quantity: 25, purchase_unit: "kg", purchase_price: 18.5 },
      { nom: "Levure boulangère", categorie: "Épicerie", purchase_quantity: 500, purchase_unit: "g", purchase_price: 4.2 },
      { nom: "Sel fin", categorie: "Épicerie", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 0.9 },
      { nom: "Beurre doux", categorie: "Produits laitiers", purchase_quantity: 5, purchase_unit: "kg", purchase_price: 32 },
      { nom: "Sucre en poudre", categorie: "Épicerie", purchase_quantity: 5, purchase_unit: "kg", purchase_price: 6.5 },
      { nom: "Chocolat noir pistoles", categorie: "Épicerie", purchase_quantity: 2, purchase_unit: "kg", purchase_price: 18 },
    ],
    recipes: [
      {
        nom: "Baguette tradition",
        portions: 1,
        prix_vente: 1.2,
        items: [
          { ingredient: "Farine T55", quantite: 320, unite: "g" },
          { ingredient: "Levure boulangère", quantite: 6, unite: "g" },
          { ingredient: "Sel fin", quantite: 6, unite: "g" },
        ],
      },
      {
        nom: "Croissant beurre",
        portions: 1,
        prix_vente: 1.3,
        items: [
          { ingredient: "Farine T55", quantite: 55, unite: "g" },
          { ingredient: "Beurre doux", quantite: 25, unite: "g" },
          { ingredient: "Sucre en poudre", quantite: 5, unite: "g" },
        ],
      },
      {
        nom: "Pain au chocolat",
        portions: 1,
        prix_vente: 1.4,
        items: [
          { ingredient: "Farine T55", quantite: 60, unite: "g" },
          { ingredient: "Beurre doux", quantite: 20, unite: "g" },
          { ingredient: "Chocolat noir pistoles", quantite: 12, unite: "g" },
        ],
      },
      {
        nom: "Pain de campagne",
        portions: 1,
        prix_vente: 3.8,
        items: [
          { ingredient: "Farine T55", quantite: 450, unite: "g" },
          { ingredient: "Sel fin", quantite: 9, unite: "g" },
        ],
      },
    ],
  },

  Restaurant: {
    ingredients: [
      { nom: "Steak haché", categorie: "Viandes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 12 },
      { nom: "Pommes de terre", categorie: "Fruits et légumes", purchase_quantity: 5, purchase_unit: "kg", purchase_price: 6 },
      { nom: "Salade verte", categorie: "Fruits et légumes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 3 },
      { nom: "Tomates", categorie: "Fruits et légumes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 2.8 },
      { nom: "Pain burger", categorie: "Farines et céréales", purchase_quantity: 10, purchase_unit: "piece", purchase_price: 4 },
      { nom: "Fromage râpé", categorie: "Produits laitiers", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 9 },
      { nom: "Huile d'olive", categorie: "Liquides", purchase_quantity: 1, purchase_unit: "l", purchase_price: 7 },
    ],
    recipes: [
      {
        nom: "Steak frites",
        portions: 1,
        prix_vente: 14.5,
        items: [
          { ingredient: "Steak haché", quantite: 200, unite: "g" },
          { ingredient: "Pommes de terre", quantite: 300, unite: "g" },
          { ingredient: "Huile d'olive", quantite: 20, unite: "ml" },
        ],
      },
      {
        nom: "Burger maison",
        portions: 1,
        prix_vente: 12,
        items: [
          { ingredient: "Pain burger", quantite: 1, unite: "piece" },
          { ingredient: "Steak haché", quantite: 150, unite: "g" },
          { ingredient: "Fromage râpé", quantite: 30, unite: "g" },
          { ingredient: "Tomates", quantite: 40, unite: "g" },
          { ingredient: "Salade verte", quantite: 20, unite: "g" },
        ],
      },
      {
        nom: "Salade composée",
        portions: 1,
        prix_vente: 9.5,
        items: [
          { ingredient: "Salade verte", quantite: 100, unite: "g" },
          { ingredient: "Tomates", quantite: 100, unite: "g" },
          { ingredient: "Fromage râpé", quantite: 30, unite: "g" },
          { ingredient: "Huile d'olive", quantite: 10, unite: "ml" },
        ],
      },
    ],
  },

  Bar: {
    ingredients: [
      { nom: "Rhum blanc", categorie: "Liquides", purchase_quantity: 1, purchase_unit: "l", purchase_price: 18 },
      { nom: "Citron vert", categorie: "Fruits et légumes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 4 },
      { nom: "Sucre de canne", categorie: "Épicerie", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 3 },
      { nom: "Eau gazeuse", categorie: "Liquides", purchase_quantity: 1, purchase_unit: "l", purchase_price: 1 },
      { nom: "Vodka", categorie: "Liquides", purchase_quantity: 1, purchase_unit: "l", purchase_price: 16 },
      { nom: "Jus d'orange", categorie: "Liquides", purchase_quantity: 1, purchase_unit: "l", purchase_price: 2.5 },
      { nom: "Bière bouteille", categorie: "Liquides", purchase_quantity: 24, purchase_unit: "piece", purchase_price: 30 },
    ],
    recipes: [
      {
        nom: "Mojito",
        portions: 1,
        prix_vente: 8.5,
        items: [
          { ingredient: "Rhum blanc", quantite: 50, unite: "ml" },
          { ingredient: "Citron vert", quantite: 30, unite: "g" },
          { ingredient: "Sucre de canne", quantite: 15, unite: "g" },
          { ingredient: "Eau gazeuse", quantite: 100, unite: "ml" },
        ],
      },
      {
        nom: "Vodka orange",
        portions: 1,
        prix_vente: 7.5,
        items: [
          { ingredient: "Vodka", quantite: 40, unite: "ml" },
          { ingredient: "Jus d'orange", quantite: 150, unite: "ml" },
        ],
      },
      {
        nom: "Bière pression",
        portions: 1,
        prix_vente: 5,
        items: [{ ingredient: "Bière bouteille", quantite: 1, unite: "piece" }],
      },
    ],
  },

  Autre: {
    ingredients: [
      { nom: "Pain sandwich", categorie: "Farines et céréales", purchase_quantity: 10, purchase_unit: "piece", purchase_price: 5 },
      { nom: "Jambon blanc", categorie: "Viandes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 11 },
      { nom: "Beurre doux", categorie: "Produits laitiers", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 9 },
      { nom: "Emmental râpé", categorie: "Produits laitiers", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 10 },
      { nom: "Salade verte", categorie: "Fruits et légumes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 3 },
      { nom: "Tomates", categorie: "Fruits et légumes", purchase_quantity: 1, purchase_unit: "kg", purchase_price: 2.8 },
    ],
    recipes: [
      {
        nom: "Sandwich jambon-beurre",
        portions: 1,
        prix_vente: 4.5,
        items: [
          { ingredient: "Pain sandwich", quantite: 1, unite: "piece" },
          { ingredient: "Jambon blanc", quantite: 60, unite: "g" },
          { ingredient: "Beurre doux", quantite: 15, unite: "g" },
        ],
      },
      {
        nom: "Sandwich crudités-fromage",
        portions: 1,
        prix_vente: 4.2,
        items: [
          { ingredient: "Pain sandwich", quantite: 1, unite: "piece" },
          { ingredient: "Emmental râpé", quantite: 40, unite: "g" },
          { ingredient: "Salade verte", quantite: 20, unite: "g" },
          { ingredient: "Tomates", quantite: 30, unite: "g" },
        ],
      },
    ],
  },
};

export function hasStarterTemplate(type: string): boolean {
  return type in STARTER_TEMPLATES;
}
