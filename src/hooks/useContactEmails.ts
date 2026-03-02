import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'coi-contact-emails';

interface EmailEntry {
  email1: string;
  email2: string;
}

function load(): Record<string, EmailEntry> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, EmailEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function normalizeKey(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Simple bigram-based similarity (Dice coefficient).
 * Returns a value between 0 and 1.
 */
function similarity(a: string, b: string): number {
  const na = a.trim().toLowerCase();
  const nb = b.trim().toLowerCase();
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;

  const bigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const pair = s.substring(i, i + 2);
      map.set(pair, (map.get(pair) ?? 0) + 1);
    }
    return map;
  };

  const aB = bigrams(na);
  const bB = bigrams(nb);
  let intersection = 0;
  for (const [pair, count] of aB) {
    intersection += Math.min(count, bB.get(pair) ?? 0);
  }
  return (2 * intersection) / (na.length - 1 + nb.length - 1);
}

const FUZZY_THRESHOLD = 0.8;

export function useContactEmails(subcontractorName: string) {
  const [all, setAll] = useState<Record<string, EmailEntry>>(load);

  const key = normalizeKey(subcontractorName);

  // Exact match first, then fuzzy match against all stored keys
  const emails = useMemo(() => {
    if (all[key] && (all[key].email1 || all[key].email2)) {
      return all[key];
    }
    // Fuzzy: find the best match above threshold
    let bestScore = 0;
    let bestEntry: EmailEntry | null = null;
    for (const [storedKey, entry] of Object.entries(all)) {
      if (!entry.email1 && !entry.email2) continue;
      const score = similarity(key, storedKey);
      if (score >= FUZZY_THRESHOLD && score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }
    return bestEntry ?? { email1: '', email2: '' };
  }, [all, key]);

  const setEmails = useCallback((email1: string, email2: string) => {
    setAll(prev => {
      const next = { ...prev, [key]: { email1, email2 } };
      save(next);
      return next;
    });
  }, [key]);

  return { emails, setEmails };
}
