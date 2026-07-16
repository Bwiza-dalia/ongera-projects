import { asArray } from './asArray';
import type { ApiExercise, ApiModule, ApiModuleWithExercises } from '../types/api';

export type TherapyDomainId = 'speech' | 'cognitive' | 'motion';

export interface TherapyDomainMeta {
  id: TherapyDomainId;
  name: string;
  category: string;
  tone: 'mint' | 'blue' | 'amber';
  apiType: string;
}

export interface CatalogModuleRow extends ApiModule {
  exerciseCount: number;
  exercises: ApiExercise[];
  /** Aggregated question counts per exercise id (filled after enrichment). */
  exerciseQuestionTotals?: Record<string, number>;
}

export interface TherapyDomainCatalog {
  id: TherapyDomainId;
  name: string;
  category: string;
  tone: 'mint' | 'blue' | 'amber';
  /** Prefer first module description (same as therapist portal). */
  description: string;
  apiType: string;
  modules: CatalogModuleRow[];
}

export const THERAPY_DOMAINS: TherapyDomainMeta[] = [
  {
    id: 'speech',
    name: 'Speech and Language',
    category: 'Speech therapy',
    tone: 'mint',
    apiType: 'SPEECH_AND_LANGUAGE',
  },
  {
    id: 'cognitive',
    name: 'Cognitive',
    category: 'Cognitive therapy',
    tone: 'blue',
    apiType: 'COGNITIVE',
  },
  {
    id: 'motion',
    name: 'Motion',
    category: 'Motion therapy',
    tone: 'amber',
    apiType: 'MOTION',
  },
];

const TYPE_ALIASES: Record<string, TherapyDomainId> = {
  SPEECH_AND_LANGUAGE: 'speech',
  SPEECH: 'speech',
  LANGUAGE: 'speech',
  COGNITION: 'cognitive',
  COGNITIVE: 'cognitive',
  MOTION: 'motion',
  MOTOR: 'motion',
};

function normalizeType(raw: string | undefined) {
  return (raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

/** Match therapist portal: resolve from type first, then module name. */
export function resolveDomainId(
  type: string | undefined,
  name?: string,
): TherapyDomainId {
  for (const raw of [type, name]) {
    const normalized = normalizeType(raw);
    if (!normalized) continue;
    if (TYPE_ALIASES[normalized]) return TYPE_ALIASES[normalized];
    if (normalized.includes('SPEECH') || normalized.includes('LANGUAGE')) return 'speech';
    if (normalized.includes('COGNIT')) return 'cognitive';
    if (normalized.includes('MOTION') || normalized.includes('MOTOR')) return 'motion';
  }
  return 'speech';
}

export function readModuleType(module: ApiModule) {
  return module.type ?? module.module_type;
}

function apiDescription(modules: CatalogModuleRow[]) {
  return modules.map((mod) => mod.description?.trim()).find((text) => Boolean(text)) ?? '';
}

export function groupModulesByDomain(modules: CatalogModuleRow[]): TherapyDomainCatalog[] {
  const grouped = new Map<TherapyDomainId, CatalogModuleRow[]>();

  for (const mod of modules) {
    const domainId = resolveDomainId(readModuleType(mod), mod.name);
    const list = grouped.get(domainId) ?? [];
    list.push(mod);
    grouped.set(domainId, list);
  }

  return THERAPY_DOMAINS.map((meta) => {
    const domainModules = grouped.get(meta.id) ?? [];
    return {
      ...meta,
      // Stable domain label; description only from API modules.
      name: meta.name,
      description: apiDescription(domainModules),
      modules: domainModules,
    };
  });
}

export function domainExerciseCount(domain: TherapyDomainCatalog) {
  return domain.modules.reduce((sum, mod) => sum + mod.exercises.length, 0);
}

export function toCatalogModuleRow(
  summary: ApiModule,
  detail?: ApiModuleWithExercises | null,
): CatalogModuleRow {
  const exercises = asArray(detail?.exercises);
  return {
    ...summary,
    ...detail,
    exercises,
    exerciseCount: exercises.length,
  };
}
