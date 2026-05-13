import { useMemo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TIME_FIELD_LABELS, TIME_FIELD_GROUPS } from '../types';
import type { TimeEntry, TimeField } from '../types';
import { formatTime, durationMinutes, formatDuration, getMonthYear, formatMonthYear, isoToTimeInput, timeInputToISO, todayISO, yesterdayISO } from '../utils/time';
import './RecordsPage.css';

const PAGE_SIZE = 30;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const COMMUTE_FIELDS: { field: TimeField; label: string }[] = [
  { field: 'commute_start', label: 'Leave home' },
  { field: 'commute_end', label: 'Arrive work' },
  { field: 'commute_home_start', label: 'Leave work' },
  { field: 'commute_home_end', label: 'Arrive home' },
];

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const { saveRetroEntry } = useApp();
  const [date, setDate] = useState(yesterdayISO());
  const [times, setTimes] = useState<Record<TimeField, string>>({
    commute_start: '',
    commute_end: '',
    work_start: '',
    work_end: '',
    commute_home_start: '',
    commute_home_end: '',
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const setTime = (field: TimeField, val: string) =>
    setTimes(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    const fields: Partial<Pick<TimeEntry, TimeField | 'notes'>> = {};
    for (const { field } of COMMUTE_FIELDS) {
      if (times[field]) fields[field] = timeInputToISO(date, times[field]);
    }
    if (notes.trim()) fields.notes = notes.trim();
    await saveRetroEntry(date, fields);
    onClose();
  };

  const maxDate = yesterdayISO();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Entry</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            max={maxDate}
            onChange={e => setDate(e.target.value)}
          />

          <div className="modal-section-title">🌅 Morning Commute</div>
          {COMMUTE_FIELDS.slice(0, 2).map(({ field, label }) => (
            <div key={field} className="modal-field-row">
              <label>{label}</label>
              <input
                type="time"
                className="input"
                value={times[field]}
                onChange={e => setTime(field, e.target.value)}
              />
            </div>
          ))}

          <div className="modal-section-title">🌆 Evening Commute</div>
          {COMMUTE_FIELDS.slice(2).map(({ field, label }) => (
            <div key={field} className="modal-field-row">
              <label>{label}</label>
              <input
                type="time"
                className="input"
                value={times[field]}
                onChange={e => setTime(field, e.target.value)}
              />
            </div>
          ))}

          <label className="modal-label">Notes</label>
          <textarea
            className="input"
            rows={1}
            value={notes}
            placeholder="Optional note…"
            onChange={e => {
              setNotes(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            style={{ overflow: 'hidden', resize: 'none' }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordRow({ entry }: { entry: TimeEntry }) {
  const { updateField, clearField, deleteEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TimeField | null>(null);
  const [editVal, setEditVal] = useState('');
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notesValue = notesDraft ?? (entry.notes ?? '');

  const saveNotes = async () => {
    if (notesDraft === null) return;
    await updateField(entry.id, 'notes', notesDraft.trim() || null);
    setNotesDraft(null);
  };

  const startEdit = (field: TimeField) => {
    setEditing(field);
    setEditVal(isoToTimeInput(entry[field]));
  };

  const commitEdit = async () => {
    if (!editing) return;
    if (editVal) {
      await updateField(entry.id, editing, timeInputToISO(entry.date, editVal));
    }
    setEditing(null);
  };

  const date = new Date(entry.date + 'T12:00:00');
  const weekday = date.toLocaleDateString([], { weekday: 'short' });
  const dateLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const commuteMorDur = formatDuration(durationMinutes(entry.commute_start, entry.commute_end));
  const commuteEveDur = formatDuration(durationMinutes(entry.commute_home_start, entry.commute_home_end));

  return (
    <div className="record-row">
      <div className="record-row-header" onClick={() => setOpen(o => !o)}>
        <div className="record-date">
          <span className="record-weekday">{weekday} </span>
          {dateLabel}
        </div>
        <div className="record-chips">
          {(entry.commute_start || entry.commute_end) && (
            <span className="record-chip commute">🌅 {commuteMorDur}</span>
          )}
          {(entry.commute_home_start || entry.commute_home_end) && (
            <span className="record-chip evening">🌆 {commuteEveDur}</span>
          )}
          {entry.notes && (
            <span className="record-chip notes">📝</span>
          )}
        </div>
        <span className={`record-row-expand${open ? ' open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="record-detail">
          <div className="record-detail-grid">
            {TIME_FIELD_GROUPS.map(group => (
              <div key={group.label} className="record-detail-group">
                <div className="record-detail-group-title">{group.label}</div>
                {group.fields.map(field => {
                  const val = entry[field];
                  const isEditing = editing === field;
                  return (
                    <div key={field} className="record-field-row">
                      <span className="record-field-label">{TIME_FIELD_LABELS[field]}</span>
                      <div className={`record-field-val${val ? '' : ' empty'}`}>
                        {isEditing ? (
                          <>
                            <input
                              type="time"
                              className="record-edit-input"
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                              autoFocus
                            />
                            <button className="btn-icon" onClick={() => setEditing(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <span>{val ? formatTime(val) : '—'}</span>
                            <button className="btn-icon" style={{ fontSize: '12px' }} onClick={() => startEdit(field)}>✏️</button>
                            {val && <button className="btn-icon" style={{ fontSize: '12px' }} onClick={() => clearField(entry.id, field)}>🗑</button>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="record-notes">
            <div className="record-notes-label">Notes</div>
            <textarea
              className="record-notes-input"
              placeholder="Add a note…"
              value={notesValue}
              rows={1}
              ref={useCallback((el: HTMLTextAreaElement | null) => {
                if (!el) return;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }, [notesValue])}
              onChange={e => {
                setNotesDraft(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onBlur={saveNotes}
            />
          </div>

          <div className="record-detail-actions">
            {confirmDelete ? (
              <>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Delete this entry?</span>
                <button className="btn btn-danger btn-sm" onClick={() => deleteEntry(entry.id)}>Yes, delete</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete entry</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecordsPage() {
  const { entries, loading } = useApp();
  const today = todayISO();

  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [page, setPage] = useState(1);
  const [addEntryOpen, setAddEntryOpen] = useState(false);

  const pastEntries = useMemo(() =>
    entries.filter(e => e.date !== today),
    [entries, today]
  );

  const years = useMemo(() => {
    const s = new Set(pastEntries.map(e => e.date.slice(0, 4)));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [pastEntries]);

  const filtered = useMemo(() => {
    return pastEntries.filter(e => {
      if (filterYear && !e.date.startsWith(filterYear)) return false;
      if (filterMonth && e.date.slice(5, 7) !== filterMonth.padStart(2, '0')) return false;
      return true;
    });
  }, [pastEntries, filterYear, filterMonth]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of filtered) {
      const key = getMonthYear(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedGroups = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    let count = 0;
    const result: [string, TimeEntry[]][] = [];
    for (const [key, rows] of grouped) {
      if (count >= end) break;
      const slice = rows.slice(Math.max(0, start - count), end - count);
      if (slice.length) result.push([key, slice]);
      count += rows.length;
    }
    return result;
  }, [grouped, page]);

  const reset = () => { setFilterYear(''); setFilterMonth(''); setPage(1); };

  if (loading) return <div className="page"><div className="empty-state"><div className="loading-spinner" /></div></div>;

  return (
    <div className="page">
      {addEntryOpen && <AddEntryModal onClose={() => setAddEntryOpen(false)} />}
      <div className="page-header records-page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="page-subtitle">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setAddEntryOpen(true)}>
          + Add entry
        </button>
      </div>

      <div className="records-filters">
        <select className="input" value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1); }}>
          <option value="">All years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1); }}>
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </select>
        {(filterYear || filterMonth) && (
          <button className="btn btn-ghost btn-sm records-filter-reset" onClick={reset}>Clear filters</button>
        )}
      </div>

      {pagedGroups.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          <span>No records found</span>
        </div>
      ) : (
        <>
          {pagedGroups.map(([monthKey, rows]) => (
            <div key={monthKey} className="month-section">
              <div className="month-section-header">
                <h2 className="month-section-title">{formatMonthYear(monthKey + '-01')}</h2>
                <span className="month-section-count">{rows.length} day{rows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="records-list">
                {rows.map(entry => <RecordRow key={entry.id} entry={entry} />)}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-page" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`pagination-page${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="pagination-page" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
