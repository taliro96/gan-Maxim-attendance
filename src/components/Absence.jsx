import { useState } from 'react'

export default function Absence({
  onBack,
  onSave,
}) {
  const [type, setType] = useState('מחלה')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event) {
    event.preventDefault()

    await onSave({
      type,
      from,
      to,
      note,
    })

    setSaved(true)
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <button onClick={onBack}>חזרה</button>
        <h1>דיווח היעדרות</h1>
      </header>

      <section className="content form-card">
        {saved ? (
          <div className="success">
            הדיווח נשמר בהצלחה ✓
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              סוג היעדרות
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
              >
                <option>מחלה</option>
                <option>חופשה</option>
                <option>אחר</option>
              </select>
            </label>

            <label>
              מתאריך
              <input
                type="date"
                required
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
              />
            </label>

            <label>
              עד תאריך
              <input
                type="date"
                required
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
              />
            </label>

            <label>
              הערה
              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
              />
            </label>

            <button
              className="primary-button big"
              type="submit"
            >
              שמירה
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
