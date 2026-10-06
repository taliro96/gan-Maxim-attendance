import { useState } from 'react'

export default function ManualHours({
  onBack,
  onSave,
}) {
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event) {
    event.preventDefault()

    await onSave({
      date,
      start,
      end,
      note,
    })

    setSaved(true)
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <button onClick={onBack}>חזרה</button>
        <h1>דיווח שעות ידני</h1>
      </header>

      <section className="content form-card">
        {saved ? (
          <div className="success">
            הדיווח נשמר בהצלחה ✓
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              תאריך
              <input
                type="date"
                required
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </label>

            <label>
              שעת כניסה
              <input
                type="time"
                required
                value={start}
                onChange={(event) =>
                  setStart(event.target.value)
                }
              />
            </label>

            <label>
              שעת יציאה
              <input
                type="time"
                required
                value={end}
                onChange={(event) =>
                  setEnd(event.target.value)
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
