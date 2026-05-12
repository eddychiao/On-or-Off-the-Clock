export interface TimeEntry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  commute_start: string | null;
  commute_end: string | null;
  work_start: string | null;
  work_end: string | null;
  commute_home_start: string | null;
  commute_home_end: string | null;
  notes: string | null;
  created_at: string;
}

export type TimeField =
  | 'commute_start'
  | 'commute_end'
  | 'work_start'
  | 'work_end'
  | 'commute_home_start'
  | 'commute_home_end';

export const TIME_FIELD_LABELS: Record<TimeField, string> = {
  commute_start: 'Leave Home',
  commute_end: 'Arrive Work',
  work_start: 'Start Work',
  work_end: 'End Work',
  commute_home_start: 'Leave Work',
  commute_home_end: 'Arrive Home',
};

export const TIME_FIELD_GROUPS = [
  {
    label: 'Morning Commute',
    fields: ['commute_start', 'commute_end'] as TimeField[],
  },
  {
    label: 'Work',
    fields: ['work_start', 'work_end'] as TimeField[],
  },
  {
    label: 'Evening Commute',
    fields: ['commute_home_start', 'commute_home_end'] as TimeField[],
  },
];

export interface RecordsFilter {
  month: number | null; // 1-12
  year: number | null;
  search: string;
}

export interface StatsFilter {
  range: 'week' | 'month' | '3months' | '6months' | 'year' | 'all';
}
