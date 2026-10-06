const API_URL =
  'https://script.google.com/macros/s/AKfycbxKZdDeYw-TjNvy1Lm10qN_QLvDQ1j4WD9jilffU4UWiSiVJguA3mfdPIENBAOVBKpt/exec'

export function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callback = `ganApi_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`

    const script = document.createElement('script')
    const query = new URLSearchParams({
      action,
      ...params,
      callback,
    })

    const cleanup = () => {
      clearTimeout(timer)
      delete window[callback]
      script.remove()
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('TIMEOUT'))
    }, 15000)

    window[callback] = (data) => {
      cleanup()

      if (data?.ok) {
        resolve(data)
      } else {
        reject(new Error(data?.error || 'API_ERROR'))
      }
    }

    script.onerror = () => {
      cleanup()
      reject(new Error('NETWORK'))
    }

    script.src = `${API_URL}?${query.toString()}`
    document.body.appendChild(script)
  })
}
