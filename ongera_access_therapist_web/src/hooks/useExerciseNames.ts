import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getModuleCatalog } from '../services/moduleService';

export interface ExerciseNameInfo {
  name: string;
  code: string;
  moduleName: string;
}

/**
 * Loads the module catalog once and returns a map of exerciseId → { name,
 * moduleName } so raw progress records (which only carry exercise IDs) can be
 * shown with human-readable exercise names.
 */
export function useExerciseNames() {
  const { token } = useAuth();
  const [names, setNames] = useState<Map<string, ExerciseNameInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setNames(new Map());
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    getModuleCatalog(token)
      .then((catalog) => {
        if (!active) return;
        const map = new Map<string, ExerciseNameInfo>();
        for (const domain of catalog.domains) {
          for (const module of domain.modules) {
            for (const exercise of module.exercises) {
              map.set(exercise.id, {
                name: exercise.name,
                code: exercise.code,
                moduleName: module.name,
              });
            }
          }
        }
        setNames(map);
      })
      .catch(() => {
        if (active) setNames(new Map());
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  return { names, isLoading };
}
