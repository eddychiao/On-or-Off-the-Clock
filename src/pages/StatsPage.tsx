import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import type { StatsFilter } from '../types';
import { durationMinutes, formatDuration } from '../utils/time';
import './StatsPage.css';

const RANGES: { label: string; value: StatsFilter['range'] }[] = [
  { label: '7 days', value: 'week' },
  { label: '1 month', value: 'month' },
  { label: '3 months', value: '3months' },
  { label: '6 months', value: '6months' },
  { label: 'Year', value: 'year' },
  { label: 'All time', value: 'all' },
];

function getCutoff(range: StatsFilter['range']): Date | null {
  const now = new Date();
  switch (range) {
    case 'week':    return new Date(now.getTime() - 7   * 86400000);
    case 'month':   return new Date(now.getTime() - 30  * 86400000);
    case '3months': return new Date(now.getTime() - 90  * 86400000);
    case '6months': return new Date(now.getTime() - 180 * 86400000);
    case 'year':    return new Date(now.getTime() - 365 * 86400000);
    case 'all':     return null;
  }
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function safeMax(nums: number[]): number {
  return nums.length ? Math.max(...nums) : 0;
}

function safeMin(nums: number[]): number {
  return nums.length ? Math.min(...nums) : 0;
}

function toDateLabel(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function toTimeDecimal(iso: string): number {
  const d = new Date(iso);
  return Math.round((d.getHours() + d.getMinutes() / 60) * 10) / 10;
}

function formatTimeDecimal(v: number): string {
  const h = Math.floor(v);
  const m = String(Math.round((v % 1) * 60)).padStart(2, '0');
  return `${h}:${m}`;
}

function fmtMins(v: unknown): string {
  return formatDuration(Math.round(Number(v)));
}

function KpiCard({ label, value, sub, colorClass }: {
  label: string; value: string; sub?: string; colorClass?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${colorClass ?? ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function StatsPage() {
  const { entries } = useApp();
  const [range, setRange] = useState<StatsFilter['range']>('month');

  const filtered = useMemo(() => {
    const cutoff = getCutoff(range);
    return entries.filter(e =>
      !cutoff || new Date(e.date + 'T12:00:00') >= cutoff
    );
  }, [entries, range]);

  const commuteMorMins = useMemo(() =>
    filtered.map(e => durationMinutes(e.commute_start, e.commute_end)).filter((v): v is number => v !== null),
  [filtered]);

  const commuteEveMins = useMemo(() =>
    filtered.map(e => durationMinutes(e.commute_home_start, e.commute_home_end)).filter((v): v is number => v !== null),
  [filtered]);

  const totalCommuteMins = useMemo(() => {
    return filtered.flatMap(e => {
      const mor = durationMinutes(e.commute_start, e.commute_end);
      const eve = durationMinutes(e.commute_home_start, e.commute_home_end);
      if (mor !== null && eve !== null) return [mor + eve];
      return [];
    });
  }, [filtered]);

  const daysLogged = filtered.length;
  const avgMor = avg(commuteMorMins);
  const avgEve = avg(commuteEveMins);
  const avgTotal = avg(totalCommuteMins);
  const longestMor = safeMax(commuteMorMins);
  const shortestMor = safeMin(commuteMorMins);
  const longestEve = safeMax(commuteEveMins);
  const shortestEve = safeMin(commuteEveMins);

  // Duration over time — line chart
  const commuteByDay = useMemo(() =>
    filtered
      .filter(e => e.commute_start || e.commute_home_start)
      .map(e => ({
        date: toDateLabel(e.date),
        morning: durationMinutes(e.commute_start, e.commute_end) ?? undefined,
        evening: durationMinutes(e.commute_home_start, e.commute_home_end) ?? undefined,
      }))
      .reverse(),
  [filtered]);

  // Morning commute bars
  const morningByDay = useMemo(() =>
    filtered
      .filter(e => e.commute_start && e.commute_end)
      .map(e => ({
        date: toDateLabel(e.date),
        mins: Math.round(durationMinutes(e.commute_start, e.commute_end)!),
      }))
      .reverse(),
  [filtered]);

  // Evening commute bars
  const eveningByDay = useMemo(() =>
    filtered
      .filter(e => e.commute_home_start && e.commute_home_end)
      .map(e => ({
        date: toDateLabel(e.date),
        mins: Math.round(durationMinutes(e.commute_home_start, e.commute_home_end)!),
      }))
      .reverse(),
  [filtered]);

  // Departure time trend — when do you leave home?
  const departureByDay = useMemo(() =>
    filtered
      .filter(e => e.commute_start)
      .map(e => ({
        date: toDateLabel(e.date),
        time: toTimeDecimal(e.commute_start!),
      }))
      .reverse(),
  [filtered]);

  // Arrival home trend — when do you get home?
  const arrivalByDay = useMemo(() =>
    filtered
      .filter(e => e.commute_home_end)
      .map(e => ({
        date: toDateLabel(e.date),
        time: toTimeDecimal(e.commute_home_end!),
      }))
      .reverse(),
  [filtered]);

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '13px',
  };

  const hasAnyData = commuteMorMins.length > 0 || commuteEveMins.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Stats</h1>
        <p className="page-subtitle">{daysLogged} day{daysLogged !== 1 ? 's' : ''} logged in range</p>
      </div>

      <div className="stats-filters">
        {RANGES.map(r => (
          <button
            key={r.value}
            className={`stats-range-btn${range === r.value ? ' active' : ''}`}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="stats-kpi-grid">
        <KpiCard
          label="🌅 Avg morning commute"
          value={commuteMorMins.length ? formatDuration(Math.round(avgMor)) : '--'}
          sub="leave home → arrive work"
          colorClass="morning"
        />
        <KpiCard
          label="🌆 Avg evening commute"
          value={commuteEveMins.length ? formatDuration(Math.round(avgEve)) : '--'}
          sub="leave work → arrive home"
          colorClass="evening"
        />
        <KpiCard
          label="⏱ Avg total commute"
          value={totalCommuteMins.length ? formatDuration(Math.round(avgTotal)) : '--'}
          sub="both legs combined"
          colorClass="accent"
        />
        <KpiCard
          label="🔺 Longest morning"
          value={commuteMorMins.length ? formatDuration(longestMor) : '--'}
          sub={commuteMorMins.length ? `shortest: ${formatDuration(shortestMor)}` : undefined}
          colorClass="morning"
        />
        <KpiCard
          label="🔺 Longest evening"
          value={commuteEveMins.length ? formatDuration(longestEve) : '--'}
          sub={commuteEveMins.length ? `shortest: ${formatDuration(shortestEve)}` : undefined}
          colorClass="evening"
        />
        <KpiCard
          label="📅 Days logged"
          value={String(daysLogged)}
          sub="in selected range"
          colorClass="accent"
        />
      </div>

      {commuteByDay.length > 0 && (
        <div className="stats-chart-card">
          <div className="stats-chart-title">
            🚗 Commute Duration Over Time
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={commuteByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={fmtMins} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMins(v), '']} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
              <Line type="monotone" dataKey="morning" stroke="var(--color-morning)" strokeWidth={2} dot={false} name="Morning 🌅" connectNulls />
              <Line type="monotone" dataKey="evening" stroke="var(--color-evening)" strokeWidth={2} dot={false} name="Evening 🌆" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="stats-two-col">
        {morningByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title stats-chart-title--morning">🌅 Morning Commute</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={morningByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={fmtMins} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMins(v), 'Duration']} />
                <Bar dataKey="mins" fill="var(--color-morning)" radius={[3, 3, 0, 0]} name="Morning" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {eveningByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title stats-chart-title--evening">🌆 Evening Commute</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eveningByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={fmtMins} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMins(v), 'Duration']} />
                <Bar dataKey="mins" fill="var(--color-evening)" radius={[3, 3, 0, 0]} name="Evening" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="stats-two-col">
        {departureByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title stats-chart-title--morning">🏠 Leave Home</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={departureByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={formatTimeDecimal}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [formatTimeDecimal(Number(v)), 'Departure']}
                />
                <Line type="monotone" dataKey="time" stroke="var(--color-morning)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {arrivalByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title stats-chart-title--evening">🏡 Arrive Home</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={arrivalByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={formatTimeDecimal}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [formatTimeDecimal(Number(v)), 'Arrival']}
                />
                <Line type="monotone" dataKey="time" stroke="var(--color-evening)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {!hasAnyData && (
        <div className="empty-state">
          <span className="empty-state-icon">📊</span>
          <span>No commute data for this period</span>
        </div>
      )}
    </div>
  );
}
