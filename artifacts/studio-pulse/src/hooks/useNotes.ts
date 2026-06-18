import { useEffect, useMemo, useState } from 'react';

export type NoteRecord = {
  rowNumber?: number;
  timestamp: string;
  tableKey: string;
  location?: string;
  period?: string;
  sectionId?: string;
  author?: string;
  note?: string;
  summary?: string;
  version?: string;
}

export function useNotes(params: { tableKey: string; location?: string; period?: string; sectionId?: string }) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (params.tableKey) q.set('tableKey', params.tableKey);
    if (params.location) q.set('location', params.location);
    if (params.period) q.set('period', params.period);
    if (params.sectionId) q.set('sectionId', params.sectionId);
    return q.toString();
  }, [params.tableKey, params.location, params.period, params.sectionId]);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/notes?${query}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setNotes(json.notes || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const save = async (payload: { author?: string; note?: string; summary?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, ...payload })
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
      return true;
    } catch (e: any) {
      setError(e.message || 'Failed to save note');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateByRow = async (rowNumber: number, payload: { author?: string; note?: string; summary?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, ...payload, row: rowNumber })
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
      return true;
    } catch (e: any) {
      setError(e.message || 'Failed to update note');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteByRow = async (rowNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/notes?row=${encodeURIComponent(String(rowNumber))}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      await reload();
      return true;
    } catch (e: any) {
      setError(e.message || 'Failed to delete note');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [query]);

  return { notes, loading, error, reload, save, updateByRow, deleteByRow };
}
