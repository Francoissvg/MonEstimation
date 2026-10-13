// Calculs des ateliers de création : chaque participant reçoit un kit (coût
// variable), et chaque séance coûte un montant fixe (animation + frais divers)
// quel que soit le nombre d'inscrits — d'où un seuil de rentabilité en participants.

export type WorkshopForCosting = {
  prix_participant: number;
  duree_heures: number;
  cout_horaire: number;
  frais_seance: number;
  min_participants: number;
  max_participants: number;
};

export function sessionFixedCost(workshop: WorkshopForCosting): number {
  return workshop.duree_heures * workshop.cout_horaire + workshop.frais_seance;
}

export type SessionEconomics = {
  participants: number;
  revenue: number;
  kitCost: number; // kits de tous les participants
  fixedCost: number; // animation + frais de séance
  overhead: number; // quote-part de frais généraux
  totalCost: number;
  costPerParticipant: number;
  margin: number;
  marginRate: number;
};

// Résultat d'UNE séance pour un nombre donné de participants.
export function sessionEconomics({
  workshop,
  kitCostPerParticipant,
  overheadPerParticipant,
  participants,
}: {
  workshop: WorkshopForCosting;
  kitCostPerParticipant: number;
  overheadPerParticipant: number;
  participants: number;
}): SessionEconomics {
  const revenue = workshop.prix_participant * participants;
  const kitCost = kitCostPerParticipant * participants;
  const fixedCost = sessionFixedCost(workshop);
  const overhead = overheadPerParticipant * participants;
  const totalCost = kitCost + fixedCost + overhead;
  const margin = revenue - totalCost;
  return {
    participants,
    revenue,
    kitCost,
    fixedCost,
    overhead,
    totalCost,
    costPerParticipant: participants > 0 ? totalCost / participants : 0,
    margin,
    marginRate: revenue > 0 ? (margin / revenue) * 100 : 0,
  };
}

// Nombre minimum de participants pour qu'une séance ne perde pas d'argent.
// null si même une séance pleine ne peut pas être rentable (chaque participant
// coûte plus qu'il ne rapporte).
export function breakEvenParticipants({
  workshop,
  kitCostPerParticipant,
  overheadPerParticipant,
}: {
  workshop: WorkshopForCosting;
  kitCostPerParticipant: number;
  overheadPerParticipant: number;
}): number | null {
  const marginPerParticipant = workshop.prix_participant - kitCostPerParticipant - overheadPerParticipant;
  const fixed = sessionFixedCost(workshop);
  if (marginPerParticipant <= 0) return fixed > 0 || marginPerParticipant < 0 ? null : 1;
  return Math.max(1, Math.ceil(fixed / marginPerParticipant - 1e-9));
}

// Paliers de remplissage à afficher (du minimum au maximum, au plus ~6 lignes).
export function participantSteps(workshop: WorkshopForCosting): number[] {
  const min = Math.max(1, Math.round(workshop.min_participants));
  const max = Math.max(min, Math.round(workshop.max_participants));
  const span = max - min;
  const step = Math.max(1, Math.ceil(span / 5));
  const steps: number[] = [];
  for (let p = min; p < max; p += step) steps.push(p);
  steps.push(max);
  return steps;
}

export type WorkshopMonthTotals = {
  revenue: number;
  directCost: number; // kits + frais de séance, hors frais généraux
};

// CA et coûts directs d'un mois pour un atelier : `sessions` séances de
// `participants` personnes en moyenne.
export function workshopMonthTotals({
  workshop,
  kitCostPerParticipant,
  sessions,
  participants,
}: {
  workshop: WorkshopForCosting;
  kitCostPerParticipant: number;
  sessions: number;
  participants: number;
}): WorkshopMonthTotals {
  const totalParticipants = sessions * participants;
  return {
    revenue: totalParticipants * workshop.prix_participant,
    directCost: totalParticipants * kitCostPerParticipant + sessions * sessionFixedCost(workshop),
  };
}
