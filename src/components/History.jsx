import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import BrandHeader from './BrandHeader'

const PAGE_SIZE = 8

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return text
}

function monthLabel(value) {
  if (!value) return 'כל החודשים'
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function getItemDate(item) {
  return item.source === 'absence' ? item.from : item.date
}

function absenceIcon(type) {
  if (type === 'מחלה') return '♟'
  if (type === 'חופשה') return '☀'
  return '•'
}

function itemMonth(item) {
  const date = getItemDate(item)
  return date ? String(date).slice(0, 7) : ''
}

export default function History({ session, onBack, onMenu }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [month, setMonth] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function loadHistory() {
    setLoading(true)
    setError('')

    try {
      const result = await api('getHistory', {
        session: session.session,
        employeeId: session.employeeId,
      })
      setItems(result.history || [])
    } catch {
      setError('לא ניתן לטעון את ההיסטוריה')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [session.session, session.employeeId])

  const filteredItems = useMemo(() => {
    return [...items]
      .filter(item => {
        if (filter === 'attendance') return item.source !== 'absence'
        if (filter === 'absence') return item.source === 'absence'
        return true
      })
      .filter(item => !month || itemMonth(item) === month)
      .sort((a, b) => String(getItemDate(b)).localeCompare(String(getItemDate(a))))
  }, [items, filter, month])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const visibleItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  useEffect(() => {
    setPage(1)
  }, [filter, month])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function openEdit(item) {
    setSaveError('')
    setEditing({
      ...item,
      date: item.date || '',
      start: item.start || '',
      end: item.end || '',
      from: item.from || '',
      to: item.to || '',
      absenceType: item.absenceType || 'חופשה',
      note: item.note || '',
    })
  }

  async function saveEdit(event) {
    event.preventDefault()
    if (!editing || saving) return

    setSaving(true)
    setSaveError('')

    try {
      await api('updateHistory', {
        session: session.session,
        employeeId: session.employeeId,
        recordId: editing.id,
        source: editing.source,
        date: editing.date,
        start: editing.start,
        end: editing.end,
        from: editing.from,
        to: editing.to,
        type: editing.absenceType,
        note: editing.note,
      })

      setEditing(null)
      await loadHistory()
    } catch {
      setSaveError('לא ניתן לשמור את השינויים')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="screen app-screen history-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="page-content history-content">
        <h1 className="page-title">היסטוריה</h1>

        <section className="history-filters" aria-label="סינון היסטוריה">
          <div className="history-filter-label">סוג רשומה</div>
          <div className="history-filter-buttons">
            {[
              ['all', 'הכול'],
              ['attendance', 'נוכחות'],
              ['absence', 'היעדרות'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`history-filter-button ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="history-month-field">
            <span>בחירת חודש</span>
            <div className="history-month-input">
              <input
                type="month"
                value={month}
                onChange={event => setMonth(event.target.value)}
                aria-label="בחירת חודש"
              />
              {month && (
                <button type="button" onClick={() => setMonth('')} aria-label="ניקוי חודש">
                  ×
                </button>
              )}
            </div>
            <small>{monthLabel(month)}</small>
          </label>
        </section>

        {loading && <div className="history-state">טוענת...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="history-empty-card">
            <div className="history-empty-icon">⌕</div>
            <strong>אין רשומות להצגה</strong>
            <span>נסי לבחור חודש או סוג רשומה אחר.</span>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <>
            <div className="history-results-title">
              <span>{filteredItems.length} רשומות</span>
              {month && <span>{monthLabel(month)}</span>}
            </div>

            <div className="history-list">
              {visibleItems.map((item, index) => {
                const key = item.id || `${item.source}-${index}`

                if (item.source === 'absence') {
                  return (
                    <article className="history-card absence-card" key={key}>
                      <div className="history-card-main">
                        <div className="history-card-date">
                          {formatDate(item.from)}
                          {item.to && item.to !== item.from && ` – ${formatDate(item.to)}`}
                        </div>
                        <div className="history-badge absence-badge">
                          <span>{absenceIcon(item.absenceType)}</span>
                          {item.absenceType || 'היעדרות'}
                        </div>
                        {item.from && item.to && item.from !== item.to && (
                          <div className="history-secondary">{daysBetween(item.from, item.to)} ימים</div>
                        )}
                      </div>
                      <button
                        className="history-edit-button"
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label="עריכת רשומת היעדרות"
                      >
                        ✎
                      </button>
                    </article>
                  )
                }

                return (
                  <article className="history-card attendance-card" key={key}>
                    <div className="history-card-main">
                      <div className="history-card-topline">
                        <div className="history-card-date">{formatDate(item.date)}</div>
                        <div className="history-badge attendance-badge">נוכחות</div>
                      </div>
                      <div className="history-attendance-times">
                        <span>{item.start || '—'}</span>
                        <b>–</b>
                        <span>{item.end || '—'}</span>
                      </div>
                      <div className="history-total">{item.total || '—'} <small>שעות</small></div>
                    </div>
                    <button
                      className="history-edit-button"
                      type="button"
                      onClick={() => openEdit(item)}
                      aria-label="עריכת רשומת נוכחות"
                    >
                      ✎
                    </button>
                  </article>
                )
              })}
            </div>

            {totalPages > 1 && (
              <nav className="history-pagination" aria-label="עמודי היסטוריה">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(value => value - 1)}
                >
                  ‹ הקודם
                </button>
                <span>עמוד {page} מתוך {totalPages}</span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(value => value + 1)}
                >
                  הבא ›
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {editing && (
        <div className="history-modal-backdrop" role="presentation">
          <div className="history-modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="history-modal-close"
              onClick={() => !saving && setEditing(null)}
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="history-modal-handle" />
            <h2>{editing.source === 'absence' ? 'עריכת רשומת היעדרות' : 'עריכת רשומת נוכחות'}</h2>

            <form onSubmit={saveEdit}>
              {editing.source === 'absence' ? (
                <>
                  <div className="history-form-grid">
                    <label>
                      מתאריך
                      <input
                        type="date"
                        value={editing.from}
                        onChange={event => setEditing({ ...editing, from: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      עד תאריך
                      <input
                        type="date"
                        value={editing.to}
                        onChange={event => setEditing({ ...editing, to: event.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <label className="history-form-full">
                    סוג היעדרות
                    <select
                      value={editing.absenceType}
                      onChange={event => setEditing({ ...editing, absenceType: event.target.value })}
                    >
                      <option value="חופשה">חופשה</option>
                      <option value="מחלה">מחלה</option>
                      <option value="היעדרות">היעדרות</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="history-form-full">
                    תאריך
                    <input
                      type="date"
                      value={editing.date}
                      onChange={event => setEditing({ ...editing, date: event.target.value })}
                      required
                    />
                  </label>

                  <div className="history-form-grid">
                    <label>
                      שעת התחלה
                      <input
                        type="time"
                        value={editing.start}
                        onChange={event => setEditing({ ...editing, start: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      שעת סיום
                      <input
                        type="time"
                        value={editing.end}
                        onChange={event => setEditing({ ...editing, end: event.target.value })}
                        required
                      />
                    </label>
                  </div>
                </>
              )}

              <label className="history-form-full">
                הערה <span>(אופציונלי)</span>
                <textarea
                  value={editing.note}
                  onChange={event => setEditing({ ...editing, note: event.target.value })}
                  placeholder="אם צריך, הוסיפי הערה"
                />
              </label>

              {saveError && <div className="history-save-error">{saveError}</div>}

              <div className="history-modal-actions">
                <button
                  type="button"
                  className="history-cancel-button"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  ביטול
                </button>
                <button type="submit" className="history-save-button" disabled={saving}>
                  {saving ? 'שומרת...' : 'שמירת שינויים'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function daysBetween(from, to) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  const days = Math.round((end - start) / 86400000) + 1
  return days > 0 ? days : 1
}
