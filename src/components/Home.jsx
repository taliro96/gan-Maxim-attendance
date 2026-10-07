import { useEffect, useMemo, useState } from 'react'
import BrandHeader from './BrandHeader'

const MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
]

const WEEK_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

function pad(value) {
  return String(value).padStart(2, '0')
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

function formatDateHebrew(date) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const previousMonthDays = new Date(year, month, 0).getDate()

  const days = []

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1, previousMonthDays - i)

    days.push({
      date,
      day: date.getDate(),
      currentMonth: false,
      key: toDateKey(date),
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)

    days.push({
      date,
      day,
      currentMonth: true,
      key: toDateKey(date),
    })
  }

  const remaining = 42 - days.length

  for (let day = 1; day <= remaining; day += 1) {
    const date = new Date(year, month + 1, day)

    days.push({
      date,
      day,
      currentMonth: false,
      key: toDateKey(date),
    })
  }

  return days
}

function getItemForDay(items, dateKey) {
  return items.find((item) => {
    if (item.source === 'absence') {
      return dateKey >= item.from && dateKey <= item.to
    }

    return item.date === dateKey
  })
}

function getDayType(item) {
  if (!item) return 'none'

  if (item.source === 'absence') {
    if (item.absenceType === 'מחלה') return 'sick'
    return 'vacation'
  }

  return 'attendance'
}

function getMonthSummary(items, year, month) {
  const prefix = `${year}-${pad(month + 1)}`

  const monthItems = items.filter((item) => {
    if (item.source === 'absence') {
      return item.from?.slice(0, 7) <= prefix &&
        item.to?.slice(0, 7) >= prefix
    }

    return item.date?.slice(0, 7) === prefix
  })

  const attendance = monthItems.filter(
    (item) => item.source !== 'absence',
  )

  const absences = monthItems.filter(
    (item) => item.source === 'absence',
  )

  const vacationDays = absences
    .filter((item) => item.absenceType === 'חופשה')
    .reduce((sum, item) => sum + countOverlapDays(item, year, month), 0)

  const sickDays = absences
    .filter((item) => item.absenceType === 'מחלה')
    .reduce((sum, item) => sum + countOverlapDays(item, year, month), 0)

  const totalMinutes = attendance.reduce((sum, item) => {
    if (item.totalMinutes) return sum + Number(item.totalMinutes)

    if (!item.start || !item.end) return sum

    const [startHour, startMinute] = item.start.split(':').map(Number)
    const [endHour, endMinute] = item.end.split(':').map(Number)

    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute

    return sum + Math.max(0, end - start)
  }, 0)

  return {
    workDays: attendance.length,
    vacationDays,
    sickDays,
    totalMinutes,
  }
}

function countOverlapDays(item, year, month) {
  if (!item.from) return 0

  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  const from = new Date(`${item.from}T00:00:00`)
  const to = new Date(`${item.to || item.from}T00:00:00`)

  const start = from > monthStart ? from : monthStart
  const end = to < monthEnd ? to : monthEnd

  if (end < start) return 0

  return Math.floor((end - start) / 86400000) + 1
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60

  return `${hours}:${pad(remaining)}`
}

export default function Home({
  session,
  status,
  history = [],
  currentTime,
  successMessage,
  onStart,
  onStop,
  onAbsence,
  onManualHours,
  onMenu,
}) {
  const now = new Date()

  const [viewDate, setViewDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  )

  const [selectedDate, setSelectedDate] = useState(null)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)

  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!status?.start || status?.end) return undefined

    const timer = setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [status?.start, status?.end])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const days = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  )

  const summary = useMemo(
    () => getMonthSummary(history, year, month),
    [history, year, month],
  )

  const todayKey = toDateKey(now)

  const selectedItem = selectedDate
    ? getItemForDay(history, selectedDate)
    : null

  const selectedDayObject = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : null

  const isWorking = Boolean(status?.start && !status?.end)

  async function handleStart() {
    if (starting || isWorking) return

    setStarting(true)

    try {
      await onStart()
    } finally {
      setStarting(false)
    }
  }

  async function handleStop() {
    if (stopping || !isWorking) return

    setStopping(true)

    try {
      await onStop()
    } finally {
      setStopping(false)
    }
  }

  function previousMonth() {
    setSelectedDate(null)
    setViewDate(
      new Date(year, month - 1, 1),
    )
  }

  function nextMonth() {
    setSelectedDate(null)
    setViewDate(
      new Date(year, month + 1, 1),
    )
  }

  return (
    <main className="screen app-screen home-calendar-screen">
      <BrandHeader
        onMenu={onMenu}
        hideBack
      />

      <section className="home-calendar-content">

        {/* Greeting */}

        <div className="home-calendar-greeting">
          <h1>
            שלום, {session?.name || 'עובדת'} 👋
          </h1>

          <p>
            {formatDateHebrew(now)}
          </p>
        </div>

        {/* Month navigation */}

        <div className="calendar-month-header">
          <button
            type="button"
            className="calendar-arrow"
            onClick={previousMonth}
            aria-label="חודש קודם"
          >
            ‹
          </button>

          <h2>
            {MONTH_NAMES[month]} {year}
          </h2>

          <button
            type="button"
            className="calendar-arrow"
            onClick={nextMonth}
            aria-label="חודש הבא"
          >
            ›
          </button>
        </div>

        {/* Work status */}

        <section
          className={`home-work-status ${
            isWorking ? 'working' : ''
          }`}
        >
          {isWorking ? (
            <>
              <div className="work-status-heading">
                <span className="working-dot" />
                <strong>את עובדת עכשיו</strong>
              </div>

              <div className="work-start-text">
                התחלת ב־{formatTime(status.start)}
              </div>

              <div className="live-work-time">
                {formatLiveWorkTime(status.start, tick)}
              </div>

              <div className="live-work-label">
                שעות עבודה
              </div>

              <button
                type="button"
                className="stop-work-button"
                disabled={stopping}
                onClick={handleStop}
              >
                <span className="stop-square" />
                {stopping ? 'מסיימת...' : 'סיום עבודה'}
              </button>
            </>
          ) : (
            <>
              <div className="work-status-heading">
                <span className="clock-status-icon">◷</span>
                <strong>עדיין לא התחלת עבודה</strong>
              </div>

              <div className="work-start-text">
                השעה עכשיו {currentTime || '--:--'}
              </div>

              <button
                type="button"
                className="start-work-button"
                disabled={starting}
                onClick={handleStart}
              >
                <span className="circle-icon">▶</span>
                {starting ? 'מתחילה...' : 'התחל עבודה'}
              </button>
            </>
          )}
        </section>

        {/* Quick actions */}

        <div className="home-quick-actions">
          <button
            type="button"
            className="quick-action absence"
            onClick={onAbsence}
          >
            <span>☂</span>
            <strong>הזנת היעדרות</strong>
            <b>＋</b>
          </button>

          <button
            type="button"
            className="quick-action manual"
            onClick={onManualHours}
          >
            <span>▤</span>
            <strong>הזנת שעות ידנית</strong>
            <b>＋</b>
          </button>
        </div>

        {/* Monthly summary */}

        <section className="monthly-summary">
          <div className="summary-item">
            <span className="summary-icon green">▣</span>
            <strong>{summary.workDays}</strong>
            <small>ימי עבודה</small>
          </div>

          <div className="summary-item">
            <span className="summary-icon blue">◷</span>
            <strong>{formatMinutes(summary.totalMinutes)}</strong>
            <small>שעות עבודה</small>
          </div>

          <div className="summary-item">
            <span className="summary-icon pink">☂</span>
            <strong>{summary.vacationDays}</strong>
            <small>חופשה</small>
          </div>

          <div className="summary-item">
            <span className="summary-icon purple">♧</span>
            <strong>{summary.sickDays}</strong>
            <small>מחלה</small>
          </div>
        </section>

        {/* Calendar */}

        <section className="attendance-calendar">

          <div className="calendar-weekdays">
            {WEEK_DAYS.map((day) => (
              <div key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((day) => {
              const item = getItemForDay(history, day.key)
              const type = getDayType(item)
              const isToday = day.key === todayKey
              const isSelected = day.key === selectedDate

              return (
                <button
                  key={day.key}
                  type="button"
                  className={[
                    'calendar-day',
                    !day.currentMonth ? 'outside' : '',
                    isToday ? 'today' : '',
                    isSelected ? 'selected' : '',
                    type,
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (day.currentMonth) {
                      setSelectedDate(day.key)
                    }
                  }}
                >
                  <span className="calendar-day-number">
                    {day.day}
                  </span>

                  {type !== 'none' && (
                    <span className={`calendar-day-dot ${type}`}>
                      {type === 'vacation' && '☂'}
                      {type === 'sick' && '♧'}
                      {type === 'attendance' && ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i className="legend-dot attendance" />
              נוכחות
            </span>

            <span>
              <i className="legend-dot vacation" />
              חופשה
            </span>

            <span>
              <i className="legend-dot sick" />
              מחלה
            </span>

            <span>
              <i className="legend-dot none" />
              ללא דיווח
            </span>
          </div>
        </section>

        {successMessage && (
          <div className="home-success-message">
            {successMessage}
          </div>
        )}
      </section>

      {/* Day details */}

      {selectedDate && (
        <div
          className="calendar-day-backdrop"
          onClick={() => setSelectedDate(null)}
        >
          <section
            className="calendar-day-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="calendar-day-close"
              onClick={() => setSelectedDate(null)}
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="calendar-modal-handle" />

            <h2>
              {selectedDayObject &&
                new Intl.DateTimeFormat('he-IL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(selectedDayObject)}
            </h2>

            <p className="calendar-modal-weekday">
              {selectedDayObject &&
                new Intl.DateTimeFormat('he-IL', {
                  weekday: 'long',
                }).format(selectedDayObject)}
            </p>

            {!selectedItem && (
              <div className="calendar-empty-day">
                <span>○</span>
                <strong>אין דיווח ביום זה</strong>
              </div>
            )}

            {selectedItem?.source !== 'absence' && selectedItem && (
              <>
                <div className="calendar-attendance-summary">
                  <div className="calendar-attendance-icon">
                    ▣
                  </div>

                  <div>
                    <strong>נוכחות</strong>

                    <div>
                      {formatTime(selectedItem.start)}
                      {' – '}
                      {formatTime(selectedItem.end)}
                    </div>

                    <small>
                      {selectedItem.total || '—'} שעות
                    </small>
                  </div>
                </div>

                <div className="calendar-detail-list">
                  <div>
                    <span>◷</span>
                    <span>כניסה</span>
                    <strong>
                      {formatTime(selectedItem.start) || '—'}
                    </strong>
                  </div>

                  <div>
                    <span>◷</span>
                    <span>יציאה</span>
                    <strong>
                      {formatTime(selectedItem.end) || '—'}
                    </strong>
                  </div>

                  <div>
                    <span>◴</span>
                    <span>סה״כ שעות</span>
                    <strong>
                      {selectedItem.total || '—'}
                    </strong>
                  </div>
                </div>

                <div className="calendar-modal-note">
                  <span>▤</span>

                  <div>
                    <strong>הערה</strong>
                    <p>
                      {selectedItem.note || 'אין הערה'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="calendar-edit-button"
                  onClick={() => {
                    setSelectedDate(null)
                    // ניתן לחבר כאן לעריכה בהמשך
                  }}
                >
                  ✎ עריכת רשומה
                </button>
              </>
            )}

            {selectedItem?.source === 'absence' && (
              <>
                <div className="calendar-absence-summary">
                  <div className="calendar-absence-icon">
                    {selectedItem.absenceType === 'מחלה'
                      ? '♧'
                      : '☂'}
                  </div>

                  <div>
                    <strong>
                      {selectedItem.absenceType || 'היעדרות'}
                    </strong>

                    <span>
                      יום שלם
                    </span>
                  </div>
                </div>

                <div className="calendar-modal-note">
                  <span>▤</span>

                  <div>
                    <strong>הערה</strong>
                    <p>
                      {selectedItem.note || 'אין הערה'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="calendar-edit-button"
                  onClick={() => {
                    setSelectedDate(null)
                  }}
                >
                  ✎ עריכת רשומה
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function formatLiveWorkTime(start, tick) {
  void tick

  if (!start) return '00:00'

  const [hours, minutes] = String(start)
    .split(':')
    .map(Number)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '00:00'
  }

  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)

  const now = new Date()
  let diff = Math.floor(
    (now.getTime() - startDate.getTime()) / 60000,
  )

  if (diff < 0) diff += 24 * 60

  const elapsedHours = Math.floor(diff / 60)
  const elapsedMinutes = diff % 60

  return `${pad(elapsedHours)}:${pad(elapsedMinutes)}`
}
