import { useState } from 'react';
import type { TimeEntry, TimeField } from '../types';
import { TIME_FIELD_LABELS } from '../types';
import { formatTime, durationMinutes, formatDuration, isoToTimeInput, timeInputToISO } from '../utils/time';
import { useApp } from '../context/AppContext';
import './TimeCard.css';

interface TimeCardProps {
  entry: TimeEntry | null;
  date: string;
  variant: 'morning' | 'work' | 'evening';
  icon: string;
  title: string;
  fields: TimeField[];
}

export default function TimeCard({ entry, date, variant, icon, title, fields }: TimeCardProps) {
  const { logField, clearField, updateField } = useApp();
  const [editing, setEditing] = useState<TimeField | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: TimeField) => {
    setEditing(field);
    setEditValue(isoToTimeInput(entry?.[field] ?? null));
  };

  const commitEdit = async () => {
    if (!editing || !entry) return;
    if (editValue) {
      await updateField(entry.id, editing, timeInputToISO(date, editValue));
    }
    setEditing(null);
  };

  const duration = fields.length === 2
    ? formatDuration(durationMinutes(entry?.[fields[0]] ?? null, entry?.[fields[1]] ?? null))
    : null;

  return (
    <div className={`time-card ${variant}`}>
      <div className="time-card-header">
        <div className="time-card-icon">{icon}</div>
        <div>
          <div className="time-card-title">{title}</div>
          {duration && duration !== '--' && (
            <span className="duration-badge">{duration}</span>
          )}
        </div>
      </div>

      <div className="time-fields">
        {fields.map((field) => {
          const value = entry?.[field] ?? null;
          const isEditing = editing === field;

          return (
            <div key={field} className="time-field">
              <span className="time-field-label">{TIME_FIELD_LABELS[field]}</span>
              <div className="time-field-value">
                {isEditing ? (
                  <>
                    <input
                      type="time"
                      className="time-edit-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                      autoFocus
                    />
                    <button className="btn-icon" onClick={() => setEditing(null)} title="Cancel">✕</button>
                  </>
                ) : (
                  <>
                    <span className={`time-display${value ? '' : ' empty'}`}>
                      {value ? formatTime(value) : '--:--'}
                    </span>
                    <div className="time-field-actions">
                      {value && (
                        <>
                          <button className="btn-icon" onClick={() => startEdit(field)} title="Edit">✏️</button>
                          <button className="btn-icon" onClick={() => entry && clearField(entry.id, field)} title="Clear">🗑</button>
                        </>
                      )}
                      {!value && (
                        <button className={`log-btn`} onClick={() => logField(field)}>
                          Log Now
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
