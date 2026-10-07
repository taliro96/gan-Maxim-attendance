import { useEffect, useState } from 'react'
import { api } from '../api'
import BrandHeader from './BrandHeader'

export default function History({ session, onBack, onMenu }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    api('getHistory', {
      session: session.session,
      employeeId: session.employeeId,
    })
      .then((result) => {
        if (cancelled) return
        setItems(result.history || [])
      })
      .catch(() => {
        if (cancelled) return
        setError('לא ניתן לטעון את ההיסטוריה')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <main className="screen app-screen">
      <BrandHeader
        onBack={onBack}
        onMenu={onMenu}
      />

      <section className="page-content">
        <h1 className="page-title">היסטוריה</h1>

        {loading && (
          <div className="history-loading">
            טוענת...
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="history-loading">
            אין נתונים להצגה
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="history-list">
            {items.map((item, index) => (
              <div
                className="history-item"
                key={item.id || index}
              >
                <div className="history-day">
                  <strong>{item.date || '—'}</strong>
                  <span>
                    {item.reportType || 'נוכחות'}
                  </span>
                </div>

                <span className="history-status-dot" />

                <div className="history-times">
                  <span>{item.start || '—'}</span>
                  <span>{item.end || '—'}</span>
                </div>

                <div className="history-total">
                  {item.total || ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
