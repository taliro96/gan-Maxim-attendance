import BrandHeader from './BrandHeader'
import { Calendar, Clock, Cup, FileIcon, Play } from './Icons'

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

export default function Home({
  session,
  status,
  onStart,
  onHistory,
  onAbsence,
  onProfile,
  onBreak,
  onMenu,
}) {
  const working = Boolean(status?.start && !status?.end)

  return (
    <main className="screen app-screen">
      <BrandHeader onBack={() => {}} onMenu={onMenu} />

      <section className="home-content">
        <h1 className="greeting">שלום, {session.name} 👋</h1>
        <div className="date-text">{formatDate()}</div>
        <div className="home-time">{status?.start || currentTime()}</div>

        <button className="start-work-button" onClick={onStart} disabled={working}>
          <Play />
          <span>{working ? 'עבודה בתהליך' : 'התחל עבודה'}</span>
        </button>

        <div className="feature-grid">
          <button className="feature-card" onClick={onHistory}>
            <Clock />
            <strong>היסטוריה שלי</strong>
          </button>

          <button className="feature-card" onClick={onBreak}>
            <Cup />
            <strong>הפסקה</strong>
          </button>

          <button className="feature-card" onClick={onAbsence}>
            <Calendar />
            <strong>בקשת חופש</strong>
          </button>

          <button className="feature-card" onClick={onProfile}>
            <FileIcon />
            <strong>הפרופיל שלי</strong>
          </button>
        </div>
      </section>
    </main>
  )
}
