export function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function durationMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 0) return null;
  return Math.round(diff / 60000);
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function isoToTimeInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeInputToISO(dateStr: string, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  return dt.toISOString();
}

export function getMonthYear(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function workHoursDecimal(entry: { work_start: string | null; work_end: string | null }): number | null {
  const mins = durationMinutes(entry.work_start, entry.work_end);
  if (mins === null) return null;
  return Math.round((mins / 60) * 100) / 100;
}
