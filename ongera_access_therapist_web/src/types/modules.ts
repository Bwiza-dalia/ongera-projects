export type TherapyDomainId = 'speech' | 'motion' | 'cognitive';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ModuleSession {
  number: number;
  name: string;
  itemCount?: number;
}

export interface ModuleLevel {
  id: string;
  difficulty: Difficulty;
  label: string;
  questionCount?: number;
  sessions: ModuleSession[];
}

export interface ModuleExercise {
  id: string;
  code: string;
  name: string;
  description: string;
  mechanic?: string;
  levels: ModuleLevel[];
}

export interface TherapyModule {
  id: string;
  name: string;
  subtitle?: string;
  domain: TherapyDomainId;
  description: string;
  clinicalTarget: string;
  exercises: ModuleExercise[];
}

export interface TherapyDomain {
  id: TherapyDomainId;
  name: string;
  description: string;
  modules: TherapyModule[];
}

export interface ModuleCatalog {
  domains: TherapyDomain[];
}
