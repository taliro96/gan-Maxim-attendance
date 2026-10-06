import { useState } from 'react'
import BrandHeader from './BrandHeader'

export default function LeaveRequest({ session, onBack, onMenu, onSave }) {
  const [kind, setKind] = useState('חופשה')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event) {
    event.preventDefault()
    await onSave({
      type: kind,
      from: date,
      to: date,
      note,
    })
    setSent(true)
  }

  return (
    <main className="screen app-screen">
      <BrandHeader onBack={onBack} onMenu={onMenu} />

      <section className="page-content leave-page">
        <h1 className="page-title">הזנת היעדרות</h1>

        <form onSubmit={submit} className="leave-form">
          <label>תאריך</label>
          <div className="field-shell">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
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

          <button className="pink-button" type="submit">
            {sent ? 'ההיעדרות נשמרה ✓' : 'שמירת היעדרות'}
          </button>
        </form>
      </section>
    </main>
  )
}
