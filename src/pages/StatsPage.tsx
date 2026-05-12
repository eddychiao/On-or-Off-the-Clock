import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
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
    case 'week': return new Date(now.getTime() - 7 * 86400000);
    case 'month': return new Date(now.getTime() - 30 * 86400000);
    case '3months': return new Date(now.getTime() - 90 * 86400000);
    case '6months': return new Date(now.getTime() - 180 * 86400000);
    case 'year': return new Date(now.getTime() - 365 * 86400000);
    case 'all': return null;
  }
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function KpiCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass?: string }) {
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
    return entries.filter(e => {
      if (!cutoff) return true;
      return new Date(e.date + 'T12:00:00') >= cutoff;
    });
  }, [entries, range]);

  const workMins = useMemo(() =>
    filtered.map(e => durationMinutes(e.work_start, e.work_end)).filter((v): v is number => v !== null),
    [filtered]);

  const commuteMorMins = useMemo(() =>
    filtered.map(e => durationMinutes(e.commute_start, e.commute_end)).filter((v): v is number => v !== null),
    [filtered]);

  const commuteEveMins = useMemo(() =>
    filtered.map(e => durationMinutes(e.commute_home_start, e.commute_home_end)).filter((v): v is number => v !== null),
    [filtered]);

  const daysWithWork = workMins.length;
  const avgWork = avg(workMins);
  const avgCommuteMor = avg(commuteMorMins);
  const avgCommuteEve = avg(commuteEveMins);
  const totalMins = workMins.reduce((a, b) => a + b, 0);
  const overtimeDays = workMins.filter(m => m > 480).length;
  const longestDay = Math.max(0, ...workMins);
  const shortestDay = workMins.length ? Math.min(...workMins) : 0;

  const workByDay = useMemo(() => {
    return filtered
      .filter(e => e.work_start && e.work_end)
      .map(e => {
        const d = new Date(e.date + 'T12:00:00');
        return {
          date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          hours: Math.round((durationMinutes(e.work_start, e.work_end)! / 60) * 10) / 10,
        };
      })
      .reverse();
  }, [filtered]);

  const commuteByDay = useMemo(() => {
    return filtered
      .filter(e => e.commute_start || e.commute_home_start)
      .map(e => {
        const d = new Date(e.date + 'T12:00:00');
        const mor = durationMinutes(e.commute_start, e.commute_end);
        const eve = durationMinutes(e.commute_home_start, e.commute_home_end);
        return {
          date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          morning: mor !== null ? Math.round(mor) : undefined,
          evening: eve !== null ? Math.round(eve) : undefined,
        };
      })
      .reverse();
  }, [filtered]);

  const startTimeByDay = useMemo(() => {
    return filtered
      .filter(e => e.work_start)
      .map(e => {
        const d = new Date(e.work_start!);
        const decimal = d.getHours() + d.getMinutes() / 60;
        return {
          date: new Date(e.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }),
          startHour: Math.round(decimal * 10) / 10,
        };
      })
      .reverse();
  }, [filtered]);

  const overtimeData = useMemo(() => {
    return filtered
      .filter(e => e.work_start && e.work_end)
      .map(e => {
        const mins = durationMinutes(e.work_start, e.work_end)!;
        return {
          date: new Date(e.date + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }),
          hours: Math.round((mins / 60) * 10) / 10,
          over: mins > 480,
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [filtered]);

  const tooltipStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text)',
    fontSize: '13px',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Stats</h1>
        <p className="page-subtitle">{daysWithWork} work day{daysWithWork !== 1 ? 's' : ''} in range</p>
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
        <KpiCard label="Avg work hours" value={formatDuration(Math.round(avgWork))} sub="per day worked" colorClass="work" />
        <KpiCard label="Total hours" value={formatDuration(totalMins)} sub={`across ${daysWithWork} days`} colorClass="accent" />
        <KpiCard label="Overtime days" value={String(overtimeDays)} sub="> 8 hours" colorClass="morning" />
        <KpiCard label="Avg morning commute" value={formatDuration(Math.round(avgCommuteMor))} sub="leave home → arrive work" />
        <KpiCard label="Avg evening commute" value={formatDuration(Math.round(avgCommuteEve))} sub="leave work → arrive home" />
        <KpiCard label="Longest day" value={formatDuration(longestDay)} sub={`shortest: ${formatDuration(shortestDay)}`} colorClass="evening" />
      </div>

      {workByDay.length > 0 && (
        <div className="stats-chart-card">
          <div className="stats-chart-title">
            💼 Work Hours per Day
            <span className="stats-chart-subtitle">8h reference line</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} unit="h" domain={[0, 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}h`, 'Hours']} />
              <ReferenceLine y={8} stroke="var(--color-warning)" strokeDasharray="4 4" />
              <Bar dataKey="hours" fill="var(--color-work)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="stats-two-col">
        {commuteByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title">🚗 Commute Duration (min)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={commuteByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} unit="m" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}m`, '']} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
                <Line type="monotone" dataKey="morning" stroke="var(--color-morning)" strokeWidth={2} dot={false} name="Morning" connectNulls />
                <Line type="monotone" dataKey="evening" stroke="var(--color-evening)" strokeWidth={2} dot={false} name="Evening" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {startTimeByDay.length > 0 && (
          <div className="stats-chart-card">
            <div className="stats-chart-title">⏰ Work Start Time</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={startTimeByDay} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => {
                    const num = Number(v);
                    const h = Math.floor(num);
                    const m = String(Math.round((num % 1) * 60)).padStart(2, '0');
                    return [`${h}:${m}`, 'Start time'];
                  }}
                />
                <Line type="monotone" dataKey="startHour" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Start" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {overtimeData.length > 0 && (
        <div className="stats-chart-card">
          <div className="stats-chart-title">📈 Top 10 Longest Days</div>
          <div className="stats-overtime-list">
            {overtimeData.map(row => (
              <div key={row.date} className={`overtime-row ${row.over ? 'over' : 'under'}`}>
                <span>{row.date}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{row.hours}h</span>
                  <span className={`overtime-badge ${row.over ? 'over' : 'under'}`}>
                    {row.over ? `+${Math.round(row.hours - 8)}h` : 'Under 8h'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📊</span>
          <span>No data for this period</span>
        </div>
      )}
    </div>
  );
}
