import { useState, useCallback } from 'react';

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

function normalizeKey(subcontractorName: string) {
  return subcontractorName.trim().toLowerCase();
}

export function useContactEmails(subcontractorName: string) {
  const [all, setAll] = useState<Record<string, EmailEntry>>(load);

  const key = normalizeKey(subcontractorName);
  const emails = all[key] ?? { email1: '', email2: '' };

  const setEmails = useCallback((email1: string, email2: string) => {
    setAll(prev => {
      const next = { ...prev, [key]: { email1, email2 } };
      save(next);
      return next;
    });
  }, [key]);

  return { emails, setEmails };
}
