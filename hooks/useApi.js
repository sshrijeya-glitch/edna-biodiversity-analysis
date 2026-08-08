import { useCallback, useEffect, useState } from 'react'
import { readError } from '../api/client'

/**
 * Loads data on mount and returns { data, loading, error, reload }.
 * Deliberately small — no cache, no global store. Each page owns its own data.
 *
 *   const { data, loading, error, reload } = useApi(() => listSamples(), [])
 *
 * IMPORTANT: pass a deps array, exactly like useEffect. If the request
 * depends on a value (a sample id, say), put that value in deps.
 */
export function useApi(request, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(request, deps)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await run())
    } catch (err) {
      setError(readError(err))
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await run()
        if (active) setData(result)
      } catch (err) {
        if (active) setError(readError(err))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [run])

  return { data, loading, error, reload: load }
}
