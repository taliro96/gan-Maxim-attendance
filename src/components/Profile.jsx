import BrandHeader from './BrandHeader'
import { Person } from './Icons'

export default function Profile({ session, onBack, onMenu, onLogout }) {
  return (
    <main className="screen app-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="page-content profile-page">
        <h1 className="page-title">הפרופיל שלי</h1>

        <div className="profile-card">
          <div className="profile-avatar"><Person /></div>
          <div>
            <strong>{session.name}</strong>
            <span>050-1234567</span>
          </div>
        </div>

        <div className="settings-list">
          <button><span>♧</span> התראות <b>›</b></button>
          <button><span>♧</span> שינוי קוד אימות <b>›</b></button>
          <button><span>ⓘ</span> אודות המערכת <b>›</b></button>
        </div>

        <button className="logout-button" onClick={onLogout}>⇥ התנתקות</button>
      </section>
    </main>
  )
}
