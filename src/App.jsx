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

const STATUS_CACHE_KEY = 'gan_today_status'

function getCachedStatus(employeeId) {
  try {
    const cached = JSON.parse(localStorage.getItem(STATUS_CACHE_KEY) || 'null')
    if (cached?.employeeId === employeeId) return cached.status || null
  } catch {}
  return null
}

function cacheStatus(employeeId, status) {
  try {
    localStorage.setItem(
      STATUS_CACHE_KEY,
      JSON.stringify({ employeeId, status }),
    )
  } catch {}
}

export default function App() {
  const saved = getSession()
  const cachedStatus = saved?.employeeId
    ? getCachedStatus(saved.employeeId)
    : null

  const [session, setSession] = useState(saved)
  const [screen, setScreen] = useState(saved ? 'home' : 'welcome')
  const [status, setStatus] = useState(cachedStatus)
  const [statusLoading, setStatusLoading] = useState(Boolean(saved && !cachedStatus))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const statusRequestRef = useRef(0)

  useEffect(() => {
    if (session) {
      refreshStatus(session)
    } else {
      setStatusLoading(false)
    }
  }, [session])

  async function refreshStatus(current = session) {
    if (!current?.employeeId) {
      setStatusLoading(false)
      return
    }

    const requestId = ++statusRequestRef.current

    if (!status) {
      setStatusLoading(true)
    }

    const maxAttempts = 3

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await api('getTodayStatus', {
          session: current.session,
          employeeId: current.employeeId,
        })

        if (requestId !== statusRequestRef.current) return

        const nextStatus = result.status || null
        setStatus(nextStatus)
        cacheStatus(current.employeeId, nextStatus)
        setError('')
        setStatusLoading(false)
        return
      } catch {
        if (requestId !== statusRequestRef.current) return

        if (attempt < maxAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, attempt * 1200),
          )
        }
      }
    }

    if (requestId === statusRequestRef.current) {
      if (!status) {
        setError('לא ניתן לטעון את מצב הנוכחות')
      }
      setStatusLoading(false)
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

      const nextStatus = result.status || null
      setStatus(nextStatus)
      cacheStatus(next.employeeId, nextStatus)
      setStatusLoading(false)
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

    statusRequestRef.current += 1
    setLoading(true)
    setStatusLoading(false)
    setError('')

    try {
      const result = await api('startWork', {
        session: session.session,
        employeeId: session.employeeId,
      })

      const fallbackStart = new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date())

      const nextStatus = {
        ...(result.status || {}),
        start: result.status?.start || fallbackStart,
        end: result.status?.end || '',
      }

      setStatus(nextStatus)
      cacheStatus(session.employeeId, nextStatus)
      setScreen('home')
    } catch (requestError) {
      setError(
        requestError.message === 'ALREADY_STARTED'
          ? 'כבר התחלת עבודה היום'
          : 'לא ניתן להתחיל את העבודה',
      )

      if (requestError.message === 'ALREADY_STARTED') {
        refreshStatus(session)
      }
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

      const nextStatus = result.status || null
      setStatus(nextStatus)
      cacheStatus(session.employeeId, nextStatus)
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
    setStatusLoading(false)
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
        statusLoading={statusLoading}
        loading={loading}
        error={error}
        onStart={startWork}
        onEnd={endWork}
        onHistory={() => setScreen('history')}
        onAbsence={() => setScreen('leave')}
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
