import BrandHeader from './BrandHeader'
import { Play } from './Icons'

export default function Working({ status, onEnd, onHome, onMenu }) {
  return (
    <main className="screen app-screen centered-screen">
      <BrandHeader onBack={onHome} onMenu={onMenu} />

      <section className="state-content">
        <div className="success-orb">
          <span>✓</span>
        </div>
        <h1 className="green-title">התחלת עבודה בהצלחה!</h1>
        <div className="state-time">{status?.start || '08:17'}</div>
        <div className="state-date">{new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</div>
        <button className="pink-button state-button" onClick={onEnd}>
          <Play />
          הפסקה
        </button>
        <button className="soft-blue-button" onClick={onHome}>חזרה למסך הבית</button>
      </section>
    </main>
  )
}
