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
          <div className="empty">
            טוענת...
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            אין נתונים להצגה
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="history-list">
            {items.map((item, index) => (
              <div
                className="history-row"
                key={item.id || index}
              >
                <div>
                  <b>{item.date || '—'}</b>
                  <span>
                    {item.reportType || 'נוכחות'}
                  </span>
                </div>

                <div>
                  <b>
                    {item.start || '—'} – {item.end || '—'}
                  </b>

                  {item.total && (
                    <span>{item.total}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
