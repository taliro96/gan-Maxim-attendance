import BrandHeader from './BrandHeader'
import { Clock } from './Icons'

export default function ThankYou({ status, onHome, onMenu }) {
  return (
    <main className="screen app-screen centered-screen">
      <BrandHeader onBack={onHome} onMenu={onMenu} />

      <section className="thank-content">
        <img className="thank-logo" src="./logo.png" alt="גן מקסים" />
        <h1>תודה על היום!</h1>
        <p>נפגש מחר 🌸</p>

        <div className="end-summary">
          <Clock />
          <div>
            <span>סיום עבודה:</span>
            <strong>{status?.end || '16:02'}</strong>
            <small>{new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</small>
          </div>
        </div>

        <button className="soft-blue-button" onClick={onHome}>חזרה למסך הבית</button>
      </section>
    </main>
  )
}
