import { useEffect, useState } from 'react'
import { api } from './api'
import { clearSession, getSession, saveSession } from './utils/storage'

import Welcome from './components/Welcome'
import Home from './components/Home'
import Working from './components/Working'
import Break from './components/Break'
import EndWork from './components/EndWork'
import History from './components/History'
import LeaveRequest from './components/LeaveRequest'
import Profile from './components/Profile'
import ThankYou from './components/ThankYou'

export default function App() {
  const saved = getSession()
  const [session, setSession] = useState(saved)
  const [screen, setScreen] = useState(saved ? 'home' : 'welcome')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) refreshStatus(session)
  }, [session])

  async function refreshStatus(current = session) {
    if (!current?.employeeId) return

    try {
      const result = await api('getTodayStatus', {
        session: current.session,
        employeeId: current.employeeId,
      })
      setStatus(result.status || null)
    } catch {
      setError('לא ניתן לטעון את מצב הנוכחות')
    }
  }

  async function login(code) {
    setLoading(true)
    setError('')

    try {
      const result = await api('login', {
        pin: code,
      })

      const next = {
        session: result.session,
        employeeId: result.employeeId,
        name: result.name,
        language: result.language,
      }

      saveSession(next)
      setSession(next)
      setStatus(result.status || null)
      setScreen('home')
    } catch (requestError) {
      setError(
        requestError.message === 'NETWORK' ||
          requestError.message === 'TIMEOUT'
          ? 'לא ניתן להתחבר לשרת'
          : 'קוד אישי שגוי',
      )
    } finally {
      setLoading(false)
    }
  }

  async function startWork() {
    if (!session) return
    setLoading(true)
    try {
      const result = await api('startWork', {
        session: session.session,
        employeeId: session.employeeId,
      })
      setStatus(result.status || null)
      setScreen('working')
    } catch {
      setError('לא ניתן להתחיל את העבודה')
    } finally {
      setLoading(false)
    }
  }

  async function endWork() {
    if (!session) return
    setLoading(true)
    try {
      const result = await api('endWork', {
        session: session.session,
        employeeId: session.employeeId,
      })
      setStatus(result.status || null)
      setScreen('thankYou')
    } catch {
      setError('לא ניתן לסיים את העבודה')
    } finally {
      setLoading(false)
    }
  }

  async function saveAbsence(data) {
    if (!session) return
    await api('saveAbsence', {
      session: session.session,
      employeeId: session.employeeId,
      ...data,
    })
  }

  function logout() {
    clearSession()
    setSession(null)
    setStatus(null)
    setScreen('welcome')
  }

  function openMenu() {
    setScreen('profile')
  }

  if (screen === 'welcome' || !session) {
    return (
      <Welcome
        onLogin={login}
        loading={loading}
        error={error}
      />
    )
  }

  if (screen === 'home') {
    return (
      <Home
        session={session}
        status={status}
        onStart={startWork}
        onHistory={() => setScreen('history')}
        onAbsence={() => setScreen('leave')}
        onProfile={() => setScreen('profile')}
        onBreak={() => setScreen('break')}
        onMenu={openMenu}
      />
    )
  }

  if (screen === 'working') {
    return (
      <Working
        status={status}
        onEnd={endWork}
        onHome={() => setScreen('home')}
        onMenu={openMenu}
      />
    )
  }

  if (screen === 'break') {
    return (
      <Break
        onBack={() => setScreen('home')}
        onMenu={openMenu}
        onEndBreak={() => setScreen('home')}
      />
    )
  }

  if (screen === 'end') {
    return (
      <EndWork
        status={status}
        onHome={() => setScreen('home')}
        onMenu={openMenu}
      />
    )
  }

  if (screen === 'history') {
    return (
      <History
        session={session}
        onBack={() => setScreen('home')}
        onMenu={openMenu}
      />
    )
  }

  if (screen === 'leave') {
    return (
      <LeaveRequest
        session={session}
        onBack={() => setScreen('home')}
        onMenu={openMenu}
        onSave={saveAbsence}
      />
    )
  }

  if (screen === 'profile') {
    return (
      <Profile
        session={session}
        onBack={() => setScreen('home')}
        onMenu={openMenu}
        onLogout={logout}
      />
    )
  }

  return (
    <ThankYou
      status={status}
      onHome={() => setScreen('home')}
      onMenu={openMenu}
    />
  )
}
