import { useEffect, useState } from 'react'
import { api } from '../api'

export default function History({ session, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('getHistory', {
      session: session.session,
      employeeId: session.employeeId,
    })
      .then((result) => {
        setItems(result.history || [])
      })
      .catch(() => {
        setError('לא ניתן לטעון את ההיסטוריה')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [session])

  return (
    <main className="app-shell">
      <header className="page-header">
        <button onClick={onBack}>חזרה</button>
        <h1>היסטוריה</h1>
      </header>

      <section className="content">
        {loading && (
          <div className="empty">טוענת...</div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            אין נתונים להצגה
          </div>
        )}

        <div className="history-list">
          {items.map((item, index) => (
            <div
              className="history-row"
              key={item.id || index}
            >
              <div>
                <b>{item.date}</b>
                <span>
                  {item.reportType || 'נוכחות'}
                </span>
              </div>

              <div>
                <b>
                  {item.start || '—'} – {item.end || '—'}
                </b>
                <span>{item.total || ''}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
