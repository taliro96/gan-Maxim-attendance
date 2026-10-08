const API_URL =
  'https://script.google.com/macros/s/AKfycbxlivK0mTC1VcO22ZIJrLxwDFoEkxXvCnccDGs_q994fSJ_xyo2rSRT-zGXYLHKEEs1/exec'

export async function api(action, params = {}) {
  const query = new URLSearchParams({
    action,
    ...params,
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(`${API_URL}?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) throw new Error('NETWORK')

    const data = await response.json()

    if (data?.ok) return data

    throw new Error(data?.error || 'API_ERROR')
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('TIMEOUT')

    if ([
      'API_ERROR',
      'INVALID_PIN',
      'SESSION_EXPIRED',
      'ALREADY_STARTED',
      'NO_START',
      'NO_OPEN_SHIFT',
      'INVALID_MANUAL_DATA',
      'INVALID_TIME_RANGE',
      'INVALID_ABSENCE_DATA',
      'INVALID_HISTORY_UPDATE',
      'HISTORY_RECORD_NOT_FOUND',
      'INVALID_HISTORY_DELETE',
      'ABSENCES_SHEET_MISSING',
    ].includes(error?.message)) {
      throw error
    }

    throw new Error('NETWORK')
  } finally {
    clearTimeout(timer)
  }
}
