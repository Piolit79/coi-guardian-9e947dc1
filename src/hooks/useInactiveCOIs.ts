import { useState, useCallback } from 'react';

const STORAGE_KEY = 'coi-inactive-ids';

function loadInactiveIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

export function useInactiveCOIs() {
  const [inactiveIds, setInactiveIds] = useState<Set<string>>(loadInactiveIds);

  const toggleActive = useCallback((id: string, isActive: boolean) => {
    setInactiveIds(prev => {
      const next = new Set(prev);
      if (isActive) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { inactiveIds, toggleActive };
}
