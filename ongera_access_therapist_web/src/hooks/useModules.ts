import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  enrichDomainModules,
  getExercise,
  getModule,
  getModuleCatalog,
  levelToApiDifficulty,
  listExerciseQuestions,
} from '../services/moduleService';
import type { ModuleCatalog, ModuleExercise, TherapyDomain, TherapyModule } from '../types/modules';
import type { ApiQuestion } from '../types/api';

export function useModuleCatalog() {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState<ModuleCatalog>({ domains: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) {
      setCatalog({ domains: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await getModuleCatalog(token);
      setCatalog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
      setCatalog({ domains: [] });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { catalog, isLoading, error, reload: load };
}

export function useDomainModules(domain: TherapyDomain | null) {
  const { token } = useAuth();
  const [modules, setModules] = useState<TherapyModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!domain || !token) {
      setModules([]);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');

    enrichDomainModules(token, domain.modules)
      .then((data) => {
        if (active) setModules(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load modules');
          setModules(domain.modules);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [domain, token]);

  return { modules, isLoading, error };
}

export function useModuleDetail(moduleId: string | null) {
  const { token } = useAuth();
  const [mod, setMod] = useState<TherapyModule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!moduleId || !token) {
      setMod(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');

    getModule(token, moduleId)
      .then((data) => {
        if (active) setMod(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load module');
          setMod(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [moduleId, token]);

  return { mod, isLoading, error };
}

export function useExerciseDetail(
  exerciseId: string | null,
  fallback: ModuleExercise | null,
) {
  const { token } = useAuth();
  const [exercise, setExercise] = useState<ModuleExercise | null>(fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exerciseId || !token) {
      setExercise(fallback);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');

    getExercise(token, exerciseId, fallback ?? undefined)
      .then((data) => {
        if (active) setExercise(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load exercise');
          setExercise(fallback);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [exerciseId, token, fallback]);

  return { exercise, isLoading, error };
}

export function useExerciseQuestions(
  exerciseId: string | null,
  levelId: string | null,
) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exerciseId || !levelId || !token) {
      setQuestions([]);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');

    listExerciseQuestions(token, exerciseId, levelToApiDifficulty(levelId))
      .then((data) => {
        if (active) setQuestions(data);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load questions');
          setQuestions([]);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [exerciseId, levelId, token]);

  return { questions, isLoading, error };
}
