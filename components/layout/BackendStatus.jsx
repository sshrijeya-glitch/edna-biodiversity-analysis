import { useEffect, useState } from 'react'
import { getHealth } from '../../api/endpoints'

/**
 * Live backend indicator driven by the real GET /health endpoint.
 * Three states: checking, online (database_connected true), offline.
 */
export default function BackendStatus({ tone = 'light' }) {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const data = await getHealth()
        if (active) setState(data.database_connected ? 'online' : 'degraded')
      } catch {
        if (active) setState('offline')
      }
    }
    check()
    const timer = setInterval(check, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const config = {
    checking: { dot: 'bg-muted', label: 'Checking API' },
    online: { dot: 'bg-kelp', label: 'API online' },
    degraded: { dot: 'bg-amber', label: 'Database unreachable' },
    offline: { dot: 'bg-rust', label: 'API offline' },
  }[state]

  const base =
    tone === 'dark'
      ? 'border-white/[0.12] text-seafoam/80 bg-white/[0.04]'
      : 'border-hair text-muted bg-paper'

  return (
    <span className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border ${base}`}>
      <span className="relative flex w-1.5 h-1.5">
        <span className={`absolute inline-flex w-full h-full rounded-full ${config.dot} ${state === 'online' ? 'animate-pulseSoft' : ''}`} />
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.1em]">{config.label}</span>
    </span>
  )
}
