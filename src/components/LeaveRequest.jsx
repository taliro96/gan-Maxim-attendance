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
        <h1 className="page-title">בקשת חופש</h1>

        <div className="segmented-control">
          <button className={kind === 'חופשה' ? 'active' : ''} onClick={() => setKind('חופשה')}>חופשה רגילה</button>
          <button className={kind === 'יום חופש' ? 'active' : ''} onClick={() => setKind('יום חופש')}>יום חופש</button>
        </div>

        <form onSubmit={submit} className="leave-form">
          <label>תאריך</label>
          <div className="field-shell">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            <span>▣</span>
          </div>

          <label>סוג</label>
          <div className="field-shell select-shell">
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option>חופשה</option>
              <option>יום חופש</option>
              <option>מחלה</option>
            </select>
          </div>

          <label>הערות (לא חובה)</label>
          <textarea
            placeholder="למשל: אירוע משפחתי"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <button className="pink-button" type="submit">{sent ? 'הבקשה נשלחה ✓' : 'שליחת בקשה'}</button>
        </form>
      </section>
    </main>
  )
}
