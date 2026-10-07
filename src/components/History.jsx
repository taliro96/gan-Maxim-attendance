import { useEffect, useState } from 'react'
import { api } from '../api'
import BrandHeader from './BrandHeader'

function formatDate(value) {
  if (!value) return '—'

  const text = String(value)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`
  }

  return text
}

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
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <main className="screen app-screen history-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="page-content history-content">
        <h1 className="page-title">היסטוריה</h1>

        {loading && (
          <div className="history-loading">טוענת...</div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="history-loading">
            אין נתונים להצגה
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="history-table">
            <div className="history-table-header attendance-header">
              <div>תאריך</div>
              <div>שעת התחלה</div>
              <div>שעת סיום</div>
              <div>סה״כ</div>
            </div>

            <div className="history-table-header absence-header">
              <div>מתאריך</div>
              <div>עד תאריך</div>
              <div>סוג היעדרות</div>
            </div>

            <div className="history-table-body">
              {items.map((item, index) => {
                if (item.source === 'absence') {
                  return (
                    <div
                      className="history-absence-row"
                      key={item.id || index}
                    >
                      <div className="history-date-cell">
                        {formatDate(item.from)}
                      </div>

                      <div className="history-date-cell">
                        {formatDate(item.to)}
                      </div>

                      <div className="history-absence-type">
                        {item.absenceType || 'היעדרות'}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    className="history-table-row"
                    key={item.id || index}
                  >
                    <div className="history-date-cell">
                      {formatDate(item.date)}
                    </div>

                    <div className="history-time-cell">
                      {item.start || '—'}
                    </div>

                    <div className="history-time-cell">
                      {item.end || '—'}
                    </div>

                    <div className="history-total-cell">
                      {item.total || '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
