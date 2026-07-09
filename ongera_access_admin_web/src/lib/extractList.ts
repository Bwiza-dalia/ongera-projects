export function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'vocabulary', 'questions']) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}
