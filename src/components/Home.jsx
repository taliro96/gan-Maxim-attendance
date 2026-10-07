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
  onCloseSuccess,
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

  const successModalStyles = `
    .success-modal-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(34,62,49,.28);backdrop-filter:blur(3px)}
    .success-modal{width:min(390px,100%);padding:30px 24px 24px;text-align:center;direction:rtl;background:linear-gradient(180deg,#fff 0%,#f6fcf8 100%);border:1px solid #cdebd9;border-radius:28px;box-shadow:0 24px 70px rgba(39,91,65,.24);animation:success-modal-in 180ms ease-out}
    .success-modal-check{width:72px;height:72px;margin:0 auto 17px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#dff5e8;border:7px solid #edf9f1;color:#238052;font-size:38px;font-weight:900;line-height:1;box-shadow:0 8px 22px rgba(48,130,82,.16)}
    .success-modal-title{color:#236f4a;font-size:23px;font-weight:900;line-height:1.25}
    .success-modal-text{margin-top:9px;color:#668074;font-size:15px;font-weight:600;line-height:1.55}
    .success-modal-button{width:100%;margin-top:23px;border:0;border-radius:15px;padding:13px 18px;background:#3a9a68;color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(58,154,104,.22)}
    .success-modal-button:active{transform:translateY(1px)}
    @keyframes success-modal-in{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  `

  return (
    <main className="screen app-screen">
      <style>{successModalStyles}</style>
      <BrandHeader onBack={null} onMenu={onMenu} hideBack />

      {successMessage && (
        <div
          className="success-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="absence-success-title"
          onClick={onCloseSuccess}
        >
          <div
            className="success-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="success-modal-check" aria-hidden="true">
              ✓
            </div>

            <div className="success-modal-title" id="absence-success-title">
              ההזנה נשמרה בהצלחה
            </div>

            <div className="success-modal-text">
              ההיעדרות נשמרה במערכת בהצלחה.
            </div>

            <button
              type="button"
              className="success-modal-button"
              onClick={onCloseSuccess}
              autoFocus
            >
              אישור
            </button>
          </div>
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
