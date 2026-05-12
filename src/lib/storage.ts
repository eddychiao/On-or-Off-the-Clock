import { supabase } from './supabase';
import type { TimeEntry, TimeField } from '../types';

function parseEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    date: row.date as string,
    commute_start: (row.commute_start as string) ?? null,
    commute_end: (row.commute_end as string) ?? null,
    work_start: (row.work_start as string) ?? null,
    work_end: (row.work_end as string) ?? null,
    commute_home_start: (row.commute_home_start as string) ?? null,
    commute_home_end: (row.commute_home_end as string) ?? null,
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
  };
}

export async function getEntries(userId: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(parseEntry);
}

export async function getEntryForDate(userId: string, date: string): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data ? parseEntry(data as Record<string, unknown>) : null;
}

export async function upsertEntry(entry: Partial<TimeEntry> & { user_id: string; date: string }): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from('time_entries')
    .upsert(entry, { onConflict: 'user_id,date' })
    .select()
    .single();
  if (error) throw error;
  return parseEntry(data as Record<string, unknown>);
}

export async function updateEntryField(
  entryId: string,
  field: TimeField | 'notes',
  value: string | null
): Promise<void> {
  const { error } = await supabase
    .from('time_entries')
    .update({ [field]: value })
    .eq('id', entryId);
  if (error) throw error;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', entryId);
  if (error) throw error;
}
