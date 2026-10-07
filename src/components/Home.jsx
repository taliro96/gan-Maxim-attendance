import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import BrandHeader from './BrandHeader'

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function pad(value) {
  return String(value).padStart(2, '0')
}

function dateKey(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function formatDate(value) {
  if (!value) return '—'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value)
}

function monthTitle(date) {
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function dayTitle(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function daysInclusive(from, to) {
  if (!from || !to) return []
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []

  const result = []
  const cursor = new Date(start)
  while (cursor <= end) {
    result.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`)
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function minutesFromTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesFromTotal(value) {
  const match = String(value || '').match(/^(\d+):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes)) return '00:00'
  const safe = Math.max(0, Math.round(minutes))
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`
}

function buildCalendar(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < firstDay; i += 1) {
    const day = new Date(year, monthIndex, -firstDay + i + 1)
    cells.push({
      key: dateKey(day.getFullYear(), day.getMonth(), day.getDate()),
      day: day.getDate(),
      outside: true,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: dateKey(year, monthIndex, day),
      day,
      outside: false,
    })
  }

  const trailing = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= trailing; i += 1) {
    const day = new Date(year, monthIndex + 1, i)
    cells.push({
      key: dateKey(day.getFullYear(), day.getMonth(), day.getDate()),
      day: day.getDate(),
      outside: true,
    })
  }

  return cells
}

function getRecordsByDay(items) {
  const map = new Map()

  const add = (key, item) => {
    if (!key) return
    const current = map.get(key) || []
    current.push(item)
    map.set(key, current)
  }

  for (const item of items) {
    if (item.source === 'absence') {
      for (const key of daysInclusive(item.from, item.to || item.from)) add(key, item)
    } else if (item.date) {
      add(String(item.date), item)
    }
  }

  return map
}

function getStatusForDay(records) {
  if (!records?.length) return 'none'
  if (records.some(item => item.source === 'absence' && item.absenceType === 'מחלה')) return 'sick'
  if (records.some(item => item.source === 'absence')) return 'vacation'
  return 'attendance'
}

function countAbsenceDays(items, type, year, monthIndex) {
  const wanted = new Set()
  for (const item of items) {
    if (item.source !== 'absence' || item.absenceType !== type) continue
    for (const key of daysInclusive(item.from, item.to || item.from)) {
      const [y, m] = key.split('-').map(Number)
      if (y === year && m === monthIndex + 1) wanted.add(key)
    }
  }
  return wanted.size
}

export default function Home({
  session,
  status,
  statusLoading,
  loading,
  error,
  successMessage,
  onCloseSuccess,
  onStart,
  onEnd,
  onHistory,
  onAbsence,
  onMenu,
}) {
  const now = new Date()
  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [selectedDay, setSelectedDay] = useState(null)

  async function loadHistory() {
    if (!session?.session) return
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const result = await api('getHistory', {
        session: session.session,
        employeeId: session.employeeId,
      })
      setHistory(Array.isArray(result.history) ? result.history : [])
    } catch (requestError) {
      setHistoryError(
        requestError.message === 'SESSION_EXPIRED'
          ? 'החיבור פג. התחברי מחדש.'
          : 'לא ניתן לטעון את נתוני הלוח',
      )
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [session?.session, session?.employeeId])

  useEffect(() => {
    if (successMessage) loadHistory()
  }, [successMessage])

  useEffect(() => {
    if (status?.start || status?.end) loadHistory()
  }, [status?.start, status?.end])

  const year = monthDate.getFullYear()
  const monthIndex = monthDate.getMonth()
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate())

  const recordsByDay = useMemo(() => getRecordsByDay(history), [history])
  const cells = useMemo(() => buildCalendar(year, monthIndex), [year, monthIndex])

  const monthAttendance = useMemo(() => {
    const keys = new Set()
    let totalMinutes = 0

    for (const item of history) {
      if (item.source !== 'attendance' || !item.date) continue
      if (String(item.date).slice(0, 7) !== `${year}-${pad(monthIndex + 1)}`) continue
      keys.add(item.date)
      const direct = minutesFromTime(item.start) != null && minutesFromTime(item.end) != null
        ? minutesFromTime(item.end) - minutesFromTime(item.start)
        : minutesFromTotal(item.total)
      if (Number.isFinite(direct) && direct >= 0) totalMinutes += direct
    }

    return { days: keys.size, totalMinutes }
  }, [history, year, monthIndex])

  const vacationDays = useMemo(
    () => countAbsenceDays(history, 'חופשה', year, monthIndex),
    [history, year, monthIndex],
  )
  const sickDays = useMemo(
    () => countAbsenceDays(history, 'מחלה', year, monthIndex),
    [history, year, monthIndex],
  )

  const selectedRecords = selectedDay ? recordsByDay.get(selectedDay) || [] : []
  const working = Boolean(status?.start && !status?.end)

  function moveMonth(offset) {
    setMonthDate(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
    setSelectedDay(null)
  }

  return (
    <main className="screen app-screen home-calendar-screen">
      <BrandHeader onMenu={onMenu} hideBack />

      <section className="home-calendar-content">
        <div className="home-calendar-greeting">
          <h1>שלום, {session?.name || ''} 👋</h1>
          <p>הנוכחות שלך במקום אחד</p>
        </div>

        <section className={`home-work-status ${working ? '' : 'not-working'}`}>
          <div className="work-status-row">
            <div className="work-start-info">
              <div className="work-clock-icon">◷</div>
              <div>
                <span>{working ? 'התחלת עבודה' : 'שעת התחלה'}</span>
                <strong>{statusLoading ? '…' : status?.start || 'טרם התחלת'}</strong>
              </div>
            </div>

            {working ? (
              <button
                type="button"
                className="stop-work-button"
                onClick={onEnd}
                disabled={loading}
              >
                <span className="stop-square" />
                {loading ? 'מסיים…' : 'סיום עבודה'}
              </button>
            ) : (
              <button
                type="button"
                className="start-work-button"
                onClick={onStart}
                disabled={loading || statusLoading}
              >
                {loading ? 'מתחילה…' : 'התחל עבודה'}
              </button>
            )}
          </div>
        </section>

        {error && <div className="error">{error}</div>}

        {successMessage && (
          <button type="button" className="home-success-message" onClick={onCloseSuccess}>
            {successMessage}
          </button>
        )}

        <div className="home-quick-actions">
          <button type="button" className="quick-action absence" onClick={onAbsence}>
            <span className="quick-action-icon">📅</span>
            <strong>הזנת היעדרות</strong>
            <b>‹</b>
          </button>
          <button type="button" className="quick-action manual" onClick={onHistory}>
            <span className="quick-action-icon">▣</span>
            <strong>היסטוריית דיווחים</strong>
            <b>‹</b>
          </button>
        </div>

        <div className="monthly-summary-line">
          <span><strong>{monthAttendance.days}</strong> ימי עבודה</span>
          <i />
          <span><strong>{formatMinutes(monthAttendance.totalMinutes)}</strong> שעות</span>
          <i />
          <span><strong>{vacationDays}</strong> חופשה</span>
          <i />
          <span><strong>{sickDays}</strong> מחלה</span>
        </div>

        <div className="calendar-month-header">
          <button type="button" className="calendar-arrow" onClick={() => moveMonth(-1)} aria-label="חודש קודם">‹</button>
          <h2>{monthTitle(monthDate)}</h2>
          <button type="button" className="calendar-arrow" onClick={() => moveMonth(1)} aria-label="חודש הבא">›</button>
        </div>

        <section className="attendance-calendar" aria-label="לוח נוכחות חודשי">
          <div className="calendar-weekdays">
            {WEEKDAYS.map(day => <div key={day}>{day}</div>)}
          </div>

          <div className="calendar-grid">
            {cells.map(cell => {
              const records = recordsByDay.get(cell.key) || []
              const kind = getStatusForDay(records)
              const isToday = cell.key === todayKey
              const isSelected = cell.key === selectedDay

              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`calendar-day ${cell.outside ? 'outside' : ''} ${kind} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDay(cell.key)}
                  aria-label={`${cell.day} ${records.length ? 'יש דיווח' : 'אין דיווח'}`}
                >
                  <span className="calendar-day-number">{cell.day}</span>
                  {kind === 'attendance' && <span className="calendar-day-dot attendance" />}
                  {kind === 'none' && !cell.outside && <span className="calendar-day-dot none" />}
                  {kind === 'vacation' && <span className="calendar-day-symbol vacation">♥</span>}
                  {kind === 'sick' && <span className="calendar-day-symbol sick">✚</span>}
                </button>
              )
            })}
          </div>

          <div className="calendar-legend">
            <span><i className="legend-dot attendance" /> נוכחות</span>
            <span><i className="legend-dot vacation" /> חופשה</span>
            <span><i className="legend-dot sick" /> מחלה</span>
            <span><i className="legend-dot none" /> ללא דיווח</span>
          </div>

          {historyLoading && <div className="calendar-loading">טוענת את נתוני ההיסטוריה…</div>}
          {!historyLoading && historyError && <div className="calendar-loading">{historyError}</div>}
        </section>
      </section>

      {selectedDay && (
        <div className="calendar-day-backdrop" onClick={() => setSelectedDay(null)}>
          <section className="calendar-day-modal" onClick={event => event.stopPropagation()}>
            <div className="calendar-modal-handle" />
            <button type="button" className="calendar-day-close" onClick={() => setSelectedDay(null)} aria-label="סגירה">×</button>
            <h2>{dayTitle(selectedDay)}</h2>

            {selectedRecords.length === 0 ? (
              <div className="calendar-empty-day">
                <span>○</span>
                <strong>אין דיווח ליום הזה</strong>
              </div>
            ) : (
              selectedRecords.map((item, index) => {
                if (item.source === 'absence') {
                  return (
                    <article className="calendar-detail-card absence-detail" key={`${item.id || 'absence'}-${index}`}>
                      <div className="detail-title"><span>{item.absenceType === 'מחלה' ? '✚' : '♥'}</span><strong>{item.absenceType || 'היעדרות'}</strong></div>
                      <div className="detail-row"><span>תקופה</span><strong>{formatDate(item.from)}{item.to && item.to !== item.from ? ` – ${formatDate(item.to)}` : ''}</strong></div>
                      {item.note && <div className="detail-note">{item.note}</div>}
                    </article>
                  )
                }

                return (
                  <article className="calendar-detail-card attendance-detail" key={`${item.id || 'attendance'}-${index}`}>
                    <div className="detail-title"><span>◷</span><strong>נוכחות</strong></div>
                    <div className="detail-row"><span>שעת התחלה</span><strong>{item.start || '—'}</strong></div>
                    <div className="detail-row"><span>שעת סיום</span><strong>{item.end || '—'}</strong></div>
                    <div className="detail-row"><span>סה״כ</span><strong>{item.total || '—'}</strong></div>
                    {item.note && <div className="detail-note">{item.note}</div>}
                  </article>
                )
              })
            )}
          </section>
        </div>
      )}
    </main>
  )
}
