import { Check, Loader2, AlertCircle, Circle } from 'lucide-react'

const STATUS_ICON = {
  idle: { Icon: Circle, cls: 'text-hair' },
  running: { Icon: Loader2, cls: 'text-teal animate-spin' },
  done: { Icon: Check, cls: 'text-white' },
  failed: { Icon: AlertCircle, cls: 'text-rust' },
}

/**
 * One pipeline stage. The connector line between markers fills in as stages
 * complete, so the sequence itself is visible rather than implied.
 */
export default function StageCard({ index, total, title, description, status, error, children }) {
  const { Icon, cls } = STATUS_ICON[status]

  return (
    <div className="flex gap-4">
      {/* Rail */}
      <div className="flex flex-col items-center shrink-0">
        <span
          className={`grid place-items-center w-9 h-9 rounded-xl border transition-colors ${
            status === 'done'
              ? 'bg-teal border-teal'
              : status === 'failed'
              ? 'bg-rust/[0.08] border-rust/40'
              : status === 'running'
              ? 'bg-paper border-teal'
              : 'bg-paper border-hair'
          }`}
        >
          <Icon size={15} className={cls} strokeWidth={2.2} />
        </span>
        {index < total - 1 && (
          <span className={`w-px flex-1 mt-2 ${status === 'done' ? 'bg-teal/40' : 'bg-hair'}`} />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[20px] text-hair tabular-nums leading-none">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-[17px] font-semibold text-ink tracking-[-0.02em]">{title}</h3>
            </div>
            <p className="mt-1 text-[13px] text-muted leading-relaxed max-w-xl">{description}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rust/25 bg-rust/[0.04] px-4 py-3">
            <p className="text-[13px] text-rust">{error}</p>
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}
