import { AlertTriangle, RefreshCw, Inbox, ServerCrash } from 'lucide-react'
import Button from './Button'

/** Skeleton block used while a request is in flight. */
export function Skeleton({ className = '' }) {
  return <div className={`bg-ink/[0.06] rounded-lg animate-pulseSoft ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-paper border border-hair rounded-2xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  )
}

export function TileSkeleton() {
  return (
    <div className="bg-paper border border-hair rounded-2xl p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

/**
 * Error state. Says what happened and what to do about it — never just "Oops".
 */
export function ErrorState({ message, onRetry, title = 'Could not load this data' }) {
  return (
    <div className="bg-paper border border-rust/20 rounded-2xl p-8 text-center">
      <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-rust/10 text-rust mb-3">
        <ServerCrash size={20} />
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] text-muted max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  )
}

/**
 * Empty state. An empty screen is an invitation to act, so it always carries the next action.
 */
export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="bg-paper border border-dashed border-hair rounded-2xl p-10 text-center">
      <span className="inline-grid place-items-center w-12 h-12 rounded-xl bg-teal/[0.08] text-teal mb-4">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 text-[13px] text-muted max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/** Inline warning strip, used for prototype caveats and blocking conditions. */
export function Notice({ children, tone = 'warning', icon: Icon = AlertTriangle }) {
  const tones = {
    warning: 'bg-amber/[0.08] border-amber/30 text-[#7A5320]',
    info: 'bg-teal/[0.06] border-teal/25 text-[#1F6B5B]',
  }
  return (
    <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${tones[tone]}`}>
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
