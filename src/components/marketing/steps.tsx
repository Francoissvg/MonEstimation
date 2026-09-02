import {
  FraisMockup,
  IngredientsMockup,
  PlanningMockup,
  RapportMockup,
  RecipeMockup,
} from "./screen-mockups";

export const STEPS = [
  {
    n: "1",
    title: "Vos ingrédients & fournisseurs",
    body: "Saisissez vos prix d'achat une fois — l'app calcule automatiquement le coût par gramme, millilitre ou unité, et garde l'historique des prix par fournisseur.",
    Mockup: IngredientsMockup,
  },
  {
    n: "2",
    title: "Vos recettes",
    body: "Associez ingrédients, quantités et nombre de parts. Le coût de revient, la marge et le taux de marge se recalculent en direct à chaque modification.",
    Mockup: RecipeMockup,
  },
  {
    n: "3",
    title: "Vos frais généraux",
    body: "Salaires, charges fixes, énergie : renseignés une fois par mois, ils sont ensuite répartis automatiquement entre vos recettes au prorata de leur poids dans votre chiffre d'affaires prévisionnel.",
    Mockup: FraisMockup,
  },
  {
    n: "4",
    title: "Votre prévisionnel",
    body: "Définissez vos quantités prévues recette par recette, mois par mois. Comparez ensuite le prévisionnel au réalisé pour ajuster votre production.",
    Mockup: PlanningMockup,
  },
  {
    n: "5",
    title: "Vos rapports",
    body: "Marge par recette, évolution des prix d'achat, prévisionnel annuel — et export PDF ou Excel de tout l'établissement en un clic.",
    Mockup: RapportMockup,
  },
] as const;
