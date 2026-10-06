import { useEffect, useState } from 'react'
import { api } from './api'
import { clearSession, getSession, saveSession } from './utils/storage'

import Login from './components/Login'
import Home from './components/Home'
import History from './components/History'
import ManualHours from './components/ManualHours'
import Absence from './components/Absence'

export default function App() {
  const [session, setSession] = useState(getSession())
  const [screen, setScreen] = useState('home')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function refreshStatus(currentSession = session) {
    if (!currentSession?.employeeId) {
      return
    }

    try {
      const result = await api('getTodayStatus', {
        session: currentSession.session,
        employeeId: currentSession.employeeId,
      })

      setStatus(result.status || null)
    } catch {
      setError('לא ניתן לטעון את מצב הנוכחות')
    }
  }

  useEffect(() => {
    if (session) {
      refreshStatus(session)
    }
  }, [session])

  async function handleLogin(pin) {
    setLoading(true)
    setError('')

    try {
      const result = await api('login', { pin })

      const nextSession = {
        session: result.session,
        employeeId: result.employeeId,
        name: result.name,
        language: result.language,
      }

      saveSession(nextSession)
      setSession(nextSession)
      setStatus(result.status || null)
      setScreen('home')
    } catch (error) {
      setError(
        error.message === 'NETWORK' || error.message === 'TIMEOUT'
          ? 'לא ניתן להתחבר לשרת'
          : 'קוד PIN שגוי',
      )

      throw error
    } finally {
      setLoading(false)
    }
  }

  async function runAction(action, params = {}) {
    setLoading(true)
    setError('')

    try {
      const result = await api(action, {
        session: session.session,
        employeeId: session.employeeId,
        ...params,
      })

      await refreshStatus(session)
      return result
    } catch (error) {
      setError('לא ניתן לבצע את הפעולה')
      throw error
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearSession()
    setSession(null)
    setStatus(null)
    setScreen('home')
  }

  if (!session) {
    return (
      <Login
        onLogin={handleLogin}
        loading={loading}
        error={error}
      />
    )
  }

  if (screen === 'history') {
    return (
      <History
        session={session}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'manual') {
    return (
      <ManualHours
        session={session}
        onBack={() => setScreen('home')}
        onSave={(data) => runAction('saveManual', data)}
      />
    )
  }

  if (screen === 'absence') {
    return (
      <Absence
        session={session}
        onBack={() => setScreen('home')}
        onSave={(data) => runAction('saveAbsence', data)}
      />
    )
  }

  return (
    <Home
      session={session}
      status={status}
      loading={loading}
      error={error}
      onStart={() => runAction('startWork')}
      onEnd={() => runAction('endWork')}
      onManual={() => setScreen('manual')}
      onAbsence={() => setScreen('absence')}
      onHistory={() => setScreen('history')}
      onLogout={logout}
    />
  )
}
