export default function Home({
  session,
  status,
  loading,
  error,
  onStart,
  onEnd,
  onManual,
  onAbsence,
  onHistory,
  onLogout,
}) {
  const working = Boolean(status?.start && !status?.end)

  return (
    <main className="app-shell">
      <header className="topbar">
        <img
          className="small-logo"
          src="./logo.png"
          alt=""
        />

        <div>
          <div className="brand">גן מקסים</div>
          <div className="welcome">
            שלום, {session.name}
          </div>
        </div>

        <button
          className="menu-button"
          onClick={onLogout}
        >
          יציאה
        </button>
      </header>

      <section className="content">
        <div className="status-card">
          <div>
            <div className="section-label">היום</div>

            <h2>
              {working
                ? 'את בעבודה'
                : status?.end
                  ? 'יום העבודה הסתיים'
                  : 'טרם התחלת עבודה'}
            </h2>
          </div>

          <div
            className={`status-dot ${
              working ? 'active' : ''
            }`}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="time-card">
          <div>
            <span>כניסה</span>
            <strong>{status?.start || '—'}</strong>
          </div>

          <div>
            <span>יציאה</span>
            <strong>{status?.end || '—'}</strong>
          </div>

          <div>
            <span>סה״כ</span>
            <strong>{status?.total || '—'}</strong>
          </div>
        </div>

        <div className="main-actions">
          {!working && !status?.end && (
            <button
              className="primary-button big"
              disabled={loading}
              onClick={onStart}
            >
              התחלת עבודה
            </button>
          )}

          {working && (
            <button
              className="secondary-button big"
              disabled={loading}
              onClick={onEnd}
            >
              סיום עבודה
            </button>
          )}
        </div>

        <div className="quick-grid">
          <button onClick={onManual}>
            <span>🕒</span>
            <b>דיווח שעות ידני</b>
          </button>

          <button onClick={onAbsence}>
            <span>📅</span>
            <b>דיווח היעדרות</b>
          </button>

          <button onClick={onHistory}>
            <span>📋</span>
            <b>היסטוריה</b>
          </button>
        </div>
      </section>
    </main>
  )
}
