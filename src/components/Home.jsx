import { useEffect, useState } from 'react'
import BrandHeader from './BrandHeader'
import { Calendar, Clock, Play } from './Icons'

function formatDate() {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function currentTime() {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function elapsedFrom(start) {
  if (!start) return '00:00'

  const parts = String(start).split(':').map(Number)
  if (parts.length !== 2 || parts.some(Number.isNaN)) return '00:00'

  const now = new Date()
  const started = new Date(now)
  started.setHours(parts[0], parts[1], 0, 0)

  let minutes = Math.floor((now.getTime() - started.getTime()) / 60000)
  if (minutes < 0) minutes += 24 * 60

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export default function Home({
  session,
  status,
  statusLoading,
  loading,
  error,
  successMessage,
  onStart,
  onEnd,
  onHistory,
  onAbsence,
  onMenu,
}) {
  const working = Boolean(status?.start && !status?.end)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!working) return undefined

    const timer = setInterval(() => {
      setTick(value => value + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [working, status?.start])

  void tick

  const elapsed = working ? elapsedFrom(status.start) : '00:00'
  const checkingStatus = Boolean(statusLoading)

  return (
    <main className="screen app-screen">
      <BrandHeader onBack={null} onMenu={onMenu} hideBack />

      {successMessage && (
        <div
          className="absence-success-popup"
          role="status"
          aria-live="polite"
        >
          <span className="absence-success-icon">✓</span>
          <span>ההיעדרות נשמרה בהצלחה</span>
        </div>
      )}

      <section className="home-content">
        <h1 className="greeting">
          שלום, {session.name} 👋
        </h1>

        <div className="date-text">
          {formatDate()}
        </div>

        {working ? (
          <div className="work-summary">
            <div className="work-summary-item">
              <span>שעת התחלה</span>
              <strong>{status.start}</strong>
            </div>

            <div className="work-summary-item">
              <span>זמן עבודה עד כה</span>
              <strong>{elapsed}</strong>
            </div>
          </div>
        ) : (
          <div className="home-time">
            {currentTime()}
          </div>
        )}

        {error && !checkingStatus && (
          <div className="form-error">
            {error}
          </div>
        )}

        {checkingStatus ? (
          <button className="start-work-button" disabled>
            <span>בודקת מצב נוכחות...</span>
          </button>
        ) : working ? (
          <button
            className="start-work-button finish-work-button"
            onClick={onEnd}
            disabled={loading}
          >
            <span className="circle-icon stop">■</span>
            <span>{loading ? 'מסיים...' : 'סיים עבודה'}</span>
          </button>
        ) : (
          <button
            className="start-work-button"
            onClick={onStart}
            disabled={loading || Boolean(status?.end)}
          >
            <Play />
            <span>{loading ? 'שומר...' : 'התחל עבודה'}</span>
          </button>
        )}

        <div className="feature-grid">
          <button className="feature-card" onClick={onHistory}>
            <Clock />
            <strong>היסטוריה שלי</strong>
          </button>

          <button className="feature-card" onClick={onAbsence}>
            <Calendar />
            <strong>הזנת היעדרות</strong>
          </button>
        </div>
      </section>
    </main>
  )
}
