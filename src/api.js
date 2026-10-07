const API_URL =
  'https://script.google.com/macros/s/AKfycbzutwnhnUaNxcd-bU1veZ9DbBpRwGS3JzcXTXFJOiD7AvsflhYcPEfAwLzruF3X7GZe/exec'

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
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('NETWORK')
    }

    const data = await response.json()

    if (data?.ok) {
      return data
    }

    throw new Error(data?.error || 'API_ERROR')
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('TIMEOUT')
    }

    if (
      error?.message === 'API_ERROR' ||
      error?.message === 'INVALID_PIN' ||
      error?.message === 'SESSION_EXPIRED' ||
      error?.message === 'ALREADY_STARTED' ||
      error?.message === 'NO_START' ||
      error?.message === 'NO_OPEN_SHIFT' ||
      error?.message === 'INVALID_MANUAL_DATA' ||
      error?.message === 'INVALID_TIME_RANGE' ||
      error?.message === 'INVALID_ABSENCE_DATA'
    ) {
      throw error
    }

    throw new Error('NETWORK')
  } finally {
    clearTimeout(timer)
  }
}
