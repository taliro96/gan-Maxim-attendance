import { useState } from 'react'
import BrandHeader from './BrandHeader'

export default function LeaveRequest({ session, onBack, onMenu, onSave }) {
  const [kind, setKind] = useState('חופשה')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (saving) return

    setSaving(true)

    try {
      if (!fromDate || !toDate) {
        setSaving(false)
        return
      }

      if (toDate < fromDate) {
        setSaving(false)
        return
      }

      await onSave({
        type: kind,
        from: fromDate,
        to: toDate,
        note,
      })
    } catch {
      setSaving(false)
    }
  }

  return (
    <main className="screen app-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="page-content leave-page">
        <h1 className="page-title">הזנת היעדרות</h1>

        <form onSubmit={submit} className="leave-form">
          <label>מתאריך</label>
          <div className="field-shell">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              required
            />
            <span>▣</span>
          </div>

          <label>עד תאריך</label>
          <div className="field-shell">
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              required
            />
            <span>▣</span>
          </div>

          <label>סוג היעדרות</label>
          <div className="field-shell select-shell">
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
            >
              <option value="חופשה">חופשה</option>
              <option value="מחלה">מחלה</option>
            </select>
          </div>

          <label>הערות (לא חובה)</label>
          <textarea
            placeholder="אם צריך, הוסיפי הערה"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <button className="pink-button" type="submit" disabled={saving}>
            {saving ? 'שומרת...' : 'שמירת היעדרות'}
          </button>
        </form>
      </section>
    </main>
  )
}
