import { useEffect, useRef, useState } from 'react'
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
  const statusRequestRef = useRef(0)

  useEffect(() => {
    if (session) refreshStatus(session)
  }, [session])

  async function refreshStatus(current = session) {
    if (!current?.employeeId) return
  
    const requestId = ++statusRequestRef.current
  
    try {
      const result = await api('getTodayStatus', {
        session: current.session,
        employeeId: current.employeeId,
      })
  
      // אם זו בקשה ישנה, לא נותנים לה לדרוס מידע חדש.
      if (requestId !== statusRequestRef.current) return
  
      setStatus(result.status || null)
      setError('')
    } catch {
      // גם שגיאה מבקשה ישנה לא צריכה לשנות את המסך.
      if (requestId !== statusRequestRef.current) return
  
      setError('לא ניתן לטעון את מצב הנוכחות')
    }
  }

  async function login(code) {
    setLoading(true)
    setError('')

    try {
      const result = await api('login', { pin: code })

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
    setError('')

    try {
      const result = await api('startWork', {
        session: session.session,
        employeeId: session.employeeId,
      })

      // The server has already saved the row successfully.
      // Update the screen immediately from the current local time,
      // instead of depending on the returned status object.
      const now = new Date()
      const start = new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(now)

      statusRequestRef.current += 1

      setStatus({
        ...(result.status || {}),
        start,
        end: '',
      })

      // Stay on the home screen. The home screen itself changes.
      setScreen('home')

      // Refresh from the server in the background.
      // refreshStatus(session)
    } catch (requestError) {
      setError(
        requestError.message === 'ALREADY_STARTED'
          ? 'כבר התחלת עבודה היום'
          : 'לא ניתן להתחיל את העבודה',
      )
    } finally {
      setLoading(false)
    }
  }

  async function endWork() {
    if (!session) return

    setLoading(true)
    setError('')

    try {
      const result = await api('endWork', {
        session: session.session,
        employeeId: session.employeeId,
      })

      setStatus(result.status || null)
      setScreen('thankYou')
    } catch (requestError) {
      setError(
        requestError.message === 'NO_OPEN_SHIFT'
          ? 'לא נמצאה התחלת עבודה פתוחה'
          : 'לא ניתן לסיים את העבודה',
      )
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
        loading={loading}
        error={error}
        onStart={startWork}
        onEnd={endWork}
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
