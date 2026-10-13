"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getVocabulary, type Vocabulary } from "@/lib/vocabulary";

const VocabularyContext = createContext<Vocabulary>(getVocabulary("Autre"));

export function VocabularyProvider({ vocabulary, children }: { vocabulary: Vocabulary; children: ReactNode }) {
  return <VocabularyContext.Provider value={vocabulary}>{children}</VocabularyContext.Provider>;
}

export function useVocabulary(): Vocabulary {
  return useContext(VocabularyContext);
}
