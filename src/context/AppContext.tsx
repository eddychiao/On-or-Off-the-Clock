import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { TimeEntry, TimeField } from '../types';
import * as storage from '../lib/storage';
import { todayISO, nowISO } from '../utils/time';
import { useAuth } from './AuthContext';

interface AppContextValue {
  entries: TimeEntry[];
  todayEntry: TimeEntry | null;
  loading: boolean;
  error: string | null;
  logField: (field: TimeField) => Promise<void>;
  clearField: (entryId: string, field: TimeField) => Promise<void>;
  updateField: (entryId: string, field: TimeField | 'notes', value: string | null) => Promise<void>;
  saveNotes: (value: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = todayISO();

  const todayEntry = entries.find(e => e.date === today) ?? null;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await storage.getEntries(user.id);
      setEntries(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
    else { setEntries([]); setLoading(false); }
  }, [user, load]);

  const logField = useCallback(async (field: TimeField) => {
    if (!user) return;
    const timestamp = nowISO();
    const existing = entries.find(e => e.date === today);

    if (existing) {
      const updated = { ...existing, [field]: timestamp };
      setEntries(prev => prev.map(e => e.id === existing.id ? updated : e));
      await storage.updateEntryField(existing.id, field, timestamp);
    } else {
      const optimistic: TimeEntry = {
        id: crypto.randomUUID(),
        user_id: user.id,
        date: today,
        commute_start: null,
        commute_end: null,
        work_start: null,
        work_end: null,
        commute_home_start: null,
        commute_home_end: null,
        notes: null,
        created_at: timestamp,
        [field]: timestamp,
      };
      setEntries(prev => [optimistic, ...prev]);
      const saved = await storage.upsertEntry({
        user_id: user.id,
        date: today,
        [field]: timestamp,
      });
      setEntries(prev => prev.map(e => e.id === optimistic.id ? saved : e));
    }
  }, [user, entries, today]);

  const clearField = useCallback(async (entryId: string, field: TimeField) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: null } : e));
    await storage.updateEntryField(entryId, field, null);
  }, []);

  const updateField = useCallback(async (entryId: string, field: TimeField | 'notes', value: string | null) => {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e));
    await storage.updateEntryField(entryId, field, value);
  }, []);

  const saveNotes = useCallback(async (value: string) => {
    if (!user) return;
    const trimmed = value.trim() || null;
    const existing = entries.find(e => e.date === today);
    if (existing) {
      setEntries(prev => prev.map(e => e.id === existing.id ? { ...e, notes: trimmed } : e));
      await storage.updateEntryField(existing.id, 'notes', trimmed);
    } else if (trimmed) {
      const saved = await storage.upsertEntry({ user_id: user.id, date: today, notes: trimmed });
      setEntries(prev => [saved, ...prev]);
    }
  }, [user, entries, today]);

  const deleteEntry = useCallback(async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    await storage.deleteEntry(entryId);
  }, []);

  return (
    <AppContext.Provider value={{
      entries,
      todayEntry,
      loading,
      error,
      logField,
      clearField,
      updateField,
      saveNotes,
      deleteEntry,
      refresh: load,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
