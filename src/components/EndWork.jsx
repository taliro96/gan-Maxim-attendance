import BrandHeader from './BrandHeader'
import { Stop } from './Icons'

export default function EndWork({ status, onHome, onMenu }) {
  return (
    <main className="screen app-screen centered-screen">
      <BrandHeader onBack={onHome} onMenu={onMenu} />

      <section className="state-content end-state">
        <div className="door-icon">⇥</div>
        <h1>סיום עבודה</h1>
        <p>לחצי לסיום יום העבודה</p>
        <button className="pink-button state-button">
          <Stop />
          סיום עבודה
        </button>
        <div className="state-note">שעת סיום תישמר במערכת</div>
      </section>
    </main>
  )
}
