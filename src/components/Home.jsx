import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import BrandHeader from './BrandHeader'

const MONTHS = [
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

function dateKey(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
}

function parseDate(value) {
  if (!value) return null

  const text = String(value)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null
  }

  return new Date(`${text}T00:00:00`)
}

function formatHebrewDate(date) {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(value) {
  if (!value) return ''

  return String(value).slice(0, 5)
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = getDaysInMonth(year, month)

  const days = []

  // ימים מהחודש הקודם
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(
      year,
      month,
      -i,
    )

    days.push({
      date,
      day: date.getDate(),
      currentMonth: false,
      key: dateKey(date),
    })
  }

  // החודש הנוכחי
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)

    days.push({
      date,
      day,
      currentMonth: true,
      key: dateKey(date),
    })
  }

  // החודש הבא
  let nextDay = 1

  while (days.length < 42) {
    const date = new Date(
      year,
      month + 1,
      nextDay,
    )

    days.push({
      date,
      day: nextDay,
      currentMonth: false,
      key: dateKey(date),
    })

    nextDay += 1
  }

  return days
}

function getRecordForDay(history, key) {
  return history.find((item) => {
    if (item.source === 'absence') {
      if (!item.from) return false

      const from = item.from
      const to = item.to || item.from

      return key >= from && key <= to
    }

    return item.date === key
  })
}

function getRecordType(record) {
  if (!record) return 'none'

  if (record.source === 'absence') {
    return record.absenceType === 'מחלה'
      ? 'sick'
      : 'vacation'
  }

  return 'attendance'
}

function calculateTotalMinutes(item) {
  if (!item?.start || !item?.end) return 0

  const start = String(item.start)
    .split(':')
    .map(Number)

  const end = String(item.end)
    .split(':')
    .map(Number)

  if (
    start.length < 2 ||
    end.length < 2 ||
    start.some(Number.isNaN) ||
    end.some(Number.isNaN)
  ) {
    return 0
  }

  const startMinutes =
    start[0] * 60 + start[1]

  const endMinutes =
    end[0] * 60 + end[1]

  return Math.max(
    0,
    endMinutes - startMinutes,
  )
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}:${pad(minutes)}`
}

function countAbsenceDays(item, year, month) {
  if (!item?.from) return 0

  const monthStart = new Date(
    year,
    month,
    1,
  )

  const monthEnd = new Date(
    year,
    month + 1,
    0,
  )

  const from = parseDate(item.from)
  const to = parseDate(item.to || item.from)

  if (!from || !to) return 0

  const start =
    from > monthStart
      ? from
      : monthStart

  const end =
    to < monthEnd
      ? to
      : monthEnd

  if (end < start) return 0

  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        86400000,
    ) + 1
  )
}

function getMonthlySummary(history, year, month) {
  const monthPrefix =
    `${year}-${pad(month + 1)}`

  const attendance = history.filter(
    (item) =>
      item.source !== 'absence' &&
      String(item.date || '').startsWith(
        monthPrefix,
      ),
  )

  const absences = history.filter(
    (item) => {
      if (item.source !== 'absence') {
        return false
      }

      const from =
        String(item.from || '')

      const to =
        String(item.to || item.from || '')

      return (
        from.slice(0, 7) <= monthPrefix &&
        to.slice(0, 7) >= monthPrefix
      )
    },
  )

  const vacationDays =
    absences
      .filter(
        (item) =>
          item.absenceType === 'חופשה',
      )
      .reduce(
        (sum, item) =>
          sum +
          countAbsenceDays(
            item,
            year,
            month,
          ),
        0,
      )

  const sickDays =
    absences
      .filter(
        (item) =>
          item.absenceType === 'מחלה',
      )
      .reduce(
        (sum, item) =>
          sum +
          countAbsenceDays(
            item,
            year,
            month,
          ),
        0,
      )

  const totalMinutes =
    attendance.reduce(
      (sum, item) =>
        sum + calculateTotalMinutes(item),
      0,
    )

  return {
    workDays: attendance.length,
    totalMinutes,
    vacationDays,
    sickDays,
  }
}

export default function Home({
  session,
  status,
  currentTime,
  onStart,
  onStop,
  onAbsence,
  onManualHours,
  onMenu,
  successMessage,
}) {
  const now = new Date()

  const [viewDate, setViewDate] =
    useState(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ),
    )

  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] =
    useState(true)

  const [selectedDate, setSelectedDate] =
    useState(null)

  const [starting, setStarting] =
    useState(false)

  const [stopping, setStopping] =
    useState(false)

  async function loadHistory() {
    if (!session?.session) return

    try {
      setLoadingHistory(true)

      const result = await api(
        'getHistory',
        {
          session: session.session,
          employeeId: session.employeeId,
        },
      )

      setHistory(
        Array.isArray(result.history)
          ? result.history
          : [],
      )
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [session?.session])

  const year =
    viewDate.getFullYear()

  const month =
    viewDate.getMonth()

  const calendarDays = useMemo(
    () =>
      buildCalendar(
        year,
        month,
      ),
    [year, month],
  )

  const summary = useMemo(
    () =>
      getMonthlySummary(
        history,
        year,
        month,
      ),
    [history, year, month],
  )

  const todayKey = dateKey(now)

  const selectedRecord =
    selectedDate
      ? getRecordForDay(
          history,
          selectedDate,
        )
      : null

  const selectedDateObject =
    selectedDate
      ? parseDate(selectedDate)
      : null

  const isWorking =
    Boolean(
      status?.start &&
        !status?.end,
    )

  async function handleStart() {
    if (starting) return

    setStarting(true)

    try {
      await onStart()
      await loadHistory()
    } finally {
      setStarting(false)
    }
  }

  async function handleStop() {
    if (stopping) return

    setStopping(true)

    try {
      await onStop()
      await loadHistory()
    } finally {
      setStopping(false)
    }
  }

  function previousMonth() {
    setSelectedDate(null)

    setViewDate(
      new Date(
        year,
        month - 1,
        1,
      ),
    )
  }

  function nextMonth() {
    setSelectedDate(null)

    setViewDate(
      new Date(
        year,
        month + 1,
        1,
      ),
    )
  }

  return (
    <main className="screen app-screen home-calendar-screen">
      <BrandHeader
        hideBack
        onMenu={onMenu}
      />

      <section className="home-calendar-content">

        {/* Greeting */}

        <header className="home-calendar-greeting">
          <h1>
            שלום, {session?.name || ''}
            {' '}
            👋
          </h1>

          <p>
            {formatHebrewDate(now)}
          </p>
        </header>

        {/* Month */}

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
            {MONTHS[month]} {year}
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
            isWorking
              ? 'working'
              : 'not-working'
          }`}
        >
          {isWorking ? (
            <div className="work-status-row">
              <div className="work-start-info">
                <div className="work-clock-icon">
                  ◷
                </div>

                <div>
                  <span>
                    התחלת עבודה
                  </span>

                  <strong>
                    {formatTime(
                      status.start,
                    )}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="stop-work-button"
                disabled={stopping}
                onClick={handleStop}
              >
                <span className="stop-square" />
                {stopping
                  ? 'מסיימת...'
                  : 'סיום עבודה'}
              </button>
            </div>
          ) : (
            <div className="work-status-row">
              <div className="work-start-info">
                <div className="work-clock-icon">
                  ◷
                </div>

                <div>
                  <span>
                    השעה עכשיו
                  </span>

                  <strong>
                    {currentTime ||
                      '--:--'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="start-work-button"
                disabled={starting}
                onClick={handleStart}
              >
                {starting
                  ? 'מתחילה...'
                  : 'התחל עבודה'}
              </button>
            </div>
          )}
        </section>

        {/* Quick actions */}

        <div className="home-quick-actions">
          <button
            type="button"
            className="quick-action absence"
            onClick={onAbsence}
          >
            <span className="quick-action-icon">
              ☂
            </span>

            <strong>
              הזנת היעדרות
            </strong>

            <b>＋</b>
          </button>

          <button
            type="button"
            className="quick-action manual"
            onClick={onManualHours}
          >
            <span className="quick-action-icon">
              ▤
            </span>

            <strong>
              הזנת שעות ידנית
            </strong>

            <b>＋</b>
          </button>
        </div>

        {/* Monthly summary */}

        <div className="monthly-summary-line">
          <span>
            <strong>
              {summary.workDays}
            </strong>
            {' '}
            ימי עבודה
          </span>

          <i />

          <span>
            <strong>
              {formatMinutes(
                summary.totalMinutes,
              )}
            </strong>
            {' '}
            שעות עבודה
          </span>

          <i />

          <span>
            <strong>
              {summary.vacationDays}
            </strong>
            {' '}
            חופשה
          </span>

          <i />

          <span>
            <strong>
              {summary.sickDays}
            </strong>
            {' '}
            מחלה
          </span>
        </div>

        {/* Calendar */}

        <section className="attendance-calendar">

          <div className="calendar-weekdays">
            {WEEK_DAYS.map(
              (day) => (
                <div key={day}>
                  {day}
                </div>
              ),
            )}
          </div>

          <div className="calendar-grid">
            {calendarDays.map(
              (day) => {
                const record =
                  getRecordForDay(
                    history,
                    day.key,
                  )

                const type =
                  getRecordType(
                    record,
                  )

                const isToday =
                  day.key ===
                  todayKey

                const isSelected =
                  day.key ===
                  selectedDate

                return (
                  <button
                    key={day.key}
                    type="button"
                    className={[
                      'calendar-day',
                      !day.currentMonth
                        ? 'outside'
                        : '',
                      isToday
                        ? 'today'
                        : '',
                      isSelected
                        ? 'selected'
                        : '',
                      type,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      if (
                        day.currentMonth
                      ) {
                        setSelectedDate(
                          day.key,
                        )
                      }
                    }}
                  >
                    <span className="calendar-day-number">
                      {day.day}
                    </span>

                    {type ===
                      'attendance' && (
                      <span className="calendar-day-dot attendance" />
                    )}

                    {type ===
                      'vacation' && (
                      <span className="calendar-day-symbol vacation">
                        ☂
                      </span>
                    )}

                    {type ===
                      'sick' && (
                      <span className="calendar-day-symbol sick">
                        ♧
                      </span>
                    )}

                    {type ===
                      'none' &&
                      day.currentMonth &&
                      day.key < todayKey && (
                        <span className="calendar-day-dot none" />
                      )}
                  </button>
                )
              },
            )}
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

        {loadingHistory && (
          <div className="calendar-loading">
            טוענת נתוני חודש...
          </div>
        )}

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
          onClick={() =>
            setSelectedDate(null)
          }
        >
          <section
            className="calendar-day-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="calendar-day-close"
              onClick={() =>
                setSelectedDate(null)
              }
              aria-label="סגירה"
            >
              ×
            </button>

            <div className="calendar-modal-handle" />

            <h2>
              {selectedDateObject &&
                new Intl.DateTimeFormat(
                  'he-IL',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  },
                ).format(
                  selectedDateObject,
                )}
            </h2>

            {!selectedRecord && (
              <div className="calendar-empty-day">
                <span>○</span>
                <strong>
                  אין דיווח ביום זה
                </strong>
              </div>
            )}

            {selectedRecord &&
              selectedRecord.source !==
                'absence' && (
                <div className="calendar-detail-card attendance-detail">
                  <div className="detail-title">
                    <span>
                      ●
                    </span>

                    <strong>
                      נוכחות
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>
                      שעת התחלה
                    </span>

                    <strong>
                      {formatTime(
                        selectedRecord.start,
                      ) || '—'}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>
                      שעת סיום
                    </span>

                    <strong>
                      {formatTime(
                        selectedRecord.end,
                      ) || '—'}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>
                      סה״כ
                    </span>

                    <strong>
                      {selectedRecord.total ||
                        '—'}
                    </strong>
                  </div>

                  {selectedRecord.note && (
                    <div className="detail-note">
                      {selectedRecord.note}
                    </div>
                  )}
                </div>
              )}

            {selectedRecord &&
              selectedRecord.source ===
                'absence' && (
                <div className="calendar-detail-card absence-detail">
                  <div className="detail-title">
                    <span>
                      {selectedRecord.absenceType ===
                      'מחלה'
                        ? '♧'
                        : '☂'}
                    </span>

                    <strong>
                      {selectedRecord.absenceType ||
                        'היעדרות'}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>
                      מתאריך
                    </span>

                    <strong>
                      {selectedRecord.from
                        ? selectedRecord.from
                            .split('-')
                            .reverse()
                            .join('/')
                        : '—'}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>
                      עד תאריך
                    </span>

                    <strong>
                      {selectedRecord.to
                        ? selectedRecord.to
                            .split('-')
                            .reverse()
                            .join('/')
                        : '—'}
                    </strong>
                  </div>

                  {selectedRecord.note && (
                    <div className="detail-note">
                      {selectedRecord.note}
                    </div>
                  )}
                </div>
              )}
          </section>
        </div>
      )}
    </main>
  )
}
