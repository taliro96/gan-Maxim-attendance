import { useRef, useState } from 'react'

export default function Welcome({ onLogin, loading, error }) {
  const [code, setCode] = useState('')
  const inputRef = useRef(null)

  function handleChange(event) {
    const next = event.target.value
      .replace(/\D/g, '')
      .slice(0, 4)

    setCode(next)
  }

  function submit(event) {
    event.preventDefault()

    if (code.length === 4 && !loading) {
      onLogin(code)
    }
  }

  return (
    <main className="screen welcome-screen">
      <section className="welcome-content">
        <img
          className="welcome-logo"
          src="./logo.png"
          alt="גן מקסים"
        />

        <h1>ברוכה הבאה</h1>
        <p>נוכחות צוות הגן</p>

        <form
          className="personal-code-form"
          onSubmit={submit}
        >
          <div className="personal-code-title">
            קוד אישי
          </div>

          <div className="personal-code-help">
            הזיני את הקוד האישי שלך
          </div>

          <div
            className="personal-code-row"
            onClick={() => inputRef.current?.focus()}
            aria-label="קוד אישי"
          >
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`personal-code-box ${
                  index < code.length ? 'filled' : ''
                }`}
              >
                {code[index] ? '•' : ''}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            className="personal-code-hidden"
            value={code}
            onChange={handleChange}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            aria-label="קוד אישי"
          />

          <div className="langs">
            <button
              type="button"
              className="active"
            >
              עברית 🇮🇱
            </button>

            <button type="button">
              Русский 🇷🇺
            </button>
          </div>

          <button
            className="pink-button"
            type="submit"
            disabled={code.length !== 4 || loading}
          >
            {loading ? 'מתחברת...' : 'אישור'}
          </button>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
        </form>
      </section>
    </main>
  )
}
