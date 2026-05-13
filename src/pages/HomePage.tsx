import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TIME_FIELD_LABELS, TIME_FIELD_GROUPS } from '../types';
import type { TimeField } from '../types';
import TimeCard from '../components/TimeCard';
import { formatDate, todayISO } from '../utils/time';
import './HomePage.css';

const GROUP_META = [
  { variant: 'morning' as const, icon: '🌅' },
  { variant: 'evening' as const, icon: '🌆' },
];

const QUICK_FIELD_ICONS: Record<TimeField, string> = {
  commute_start: '🏠',
  commute_end: '🏢',
  work_start: '▶️',
  work_end: '⏹',
  commute_home_start: '🚗',
  commute_home_end: '🏡',
};

const QUICK_FIELD_COLOR: Record<TimeField, 'morning' | 'evening'> = {
  commute_start: 'morning',
  commute_end: 'morning',
  work_start: 'morning',
  work_end: 'morning',
  commute_home_start: 'evening',
  commute_home_end: 'evening',
};

function NotesArea() {
  const { todayEntry, saveNotes } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const value = draft ?? (todayEntry?.notes ?? '');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleBlur = () => {
    if (draft !== null) {
      saveNotes(draft);
      setDraft(null);
    }
  };

  return (
    <div className="home-notes">
      <div className="home-notes-label">Notes</div>
      <textarea
        ref={ref}
        className="home-notes-input"
        placeholder="Anything worth noting about today…"
        value={value}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        rows={1}
      />
    </div>
  );
}

export default function HomePage() {
  const { todayEntry, logField, loading, error } = useApp();
  const today = todayISO();

  const quickFields = TIME_FIELD_GROUPS.flatMap(g => g.fields);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Today</h1>
        <p className="page-subtitle home-date">{formatDate(today)}</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : (
        <>
          <div className="home-cards">
            {TIME_FIELD_GROUPS.map((group, i) => (
              <TimeCard
                key={group.label}
                entry={todayEntry}
                date={today}
                variant={GROUP_META[i].variant}
                icon={GROUP_META[i].icon}
                title={group.label}
                fields={group.fields}
              />
            ))}
          </div>

          <NotesArea />

          <div className="home-quick-log">
            <div className="home-quick-log-title">Quick Log</div>
            <div className="quick-log-grid">
              {quickFields.map((field) => {
                const logged = !!todayEntry?.[field];
                return (
                  <button
                    key={field}
                    className={`quick-log-btn ${QUICK_FIELD_COLOR[field]}${logged ? ' logged' : ''}`}
                    onClick={() => !logged && logField(field)}
                    title={logged ? 'Already logged' : `Log ${TIME_FIELD_LABELS[field]}`}
                  >
                    <span className="quick-log-btn-icon">{QUICK_FIELD_ICONS[field]}</span>
                    <span className="quick-log-btn-label">{TIME_FIELD_LABELS[field]}</span>
                    <span className={`quick-log-btn-status${logged ? ' logged' : ''}`}>✓ Logged</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
