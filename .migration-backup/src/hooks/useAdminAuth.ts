import { useState, useCallback } from 'react';

const STORAGE_KEY = 'p57_admin_unlocked';
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE ?? '';

function readSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean>(readSession);
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback((code: string): boolean => {
    if (code.trim() === ADMIN_CODE) {
      try { sessionStorage.setItem(STORAGE_KEY, 'true'); } catch {}
      setIsAdmin(true);
      setError(null);
      return true;
    }
    setError('Wrong code');
    return false;
  }, []);

  const lock = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setIsAdmin(false);
  }, []);

  return { isAdmin, error, unlock, lock };
}
