import { useState } from 'react'

export default function Login({ onLogin, loading, error }) {
  const [pin, setPin] = useState('')

  function press(value) {
    if (loading) {
      return
    }

    if (value === 'clear') {
      setPin('')
      return
    }

    if (value === 'back') {
      setPin(pin.slice(0, -1))
      return
    }

    if (pin.length < 4) {
      setPin(pin + value)
    }
  }

  async function submit() {
    if (pin.length !== 4 || loading) {
      return
    }

    try {
      await onLogin(pin)
    } catch {
      // Error is displayed by the parent component.
    }
  }

  return (
    <main className="app-shell login-shell">
      <section className="login-card">
        <img
          className="logo"
          src="./logo.png"
          alt="לוגו הגן"
        />

        <h1>ברוכה הבאה</h1>
        <p className="subtitle">נוכחות צוות הגן</p>

        <div className="pin-dots" aria-label="קוד PIN">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={index < pin.length ? 'filled' : ''}
            />
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <button
              key={number}
              onClick={() => press(String(number))}
            >
              {number}
            </button>
          ))}

          <button
            className="soft"
            onClick={() => press('clear')}
          >
            נקה
          </button>

          <button onClick={() => press('0')}>0</button>

          <button
            className="soft"
            onClick={() => press('back')}
          >
            ⌫
          </button>
        </div>

        <div className="language-row">
          <button>עברית</button>
          <button>Русский</button>
        </div>

        <button
          className="primary-button login-button"
          disabled={pin.length !== 4 || loading}
          onClick={submit}
        >
          {loading ? 'מתחברת...' : 'אישור'}
        </button>
      </section>
    </main>
  )
}
