import BrandHeader from './BrandHeader'
import { Play, Stop } from './Icons'

export default function Break({ onBack, onMenu, onEndBreak }) {
  return (
    <main className="screen app-screen centered-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="break-content">
        <div className="break-cup">☕</div>
        <h1>הפסקה</h1>
        <p>לחצי כדי להתחיל הפסקה</p>

        <button className="pink-button break-action" onClick={onEndBreak}>
          <Play />
          התחל הפסקה
        </button>

        <button className="disabled-button" disabled>
          <Stop />
          סיום הפסקה
        </button>
      </section>
    </main>
  )
}
