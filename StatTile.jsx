/**
 * Secondary metric. Deliberately quieter than HeroMetric — these support the
 * headline number rather than competing with it.
 */
export default function StatTile({ label, value, unit, hint, icon: Icon, tone = 'default' }) {
  const accent = tone === 'accent' ? 'text-teal' : 'text-ink'
  return (
    <div className="bg-paper rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted">{label}</span>
        {Icon && <Icon size={15} className="text-muted/50" />}
      </div>
      <div className="mt-3.5 flex items-baseline gap-1.5">
        <span className={`font-mono text-[32px] leading-none font-medium tabular-nums tracking-[-0.02em] ${accent}`}>
          {value}
        </span>
        {unit && <span className="font-mono text-[13px] text-muted">{unit}</span>}
      </div>
      {hint && <p className="mt-3 text-[12px] text-muted leading-snug">{hint}</p>}
    </div>
  )
}

/** A finding: plain-language headline with the evidence underneath. */
export function FindingPanel({ headline, children, tone = 'neutral', eyebrow }) {
  const border = {
    neutral: 'bg-paper',
    warning: 'bg-paper ring-1 ring-amber/25',
    danger: 'bg-paper ring-1 ring-rust/25',
  }[tone]
  return (
    <div className={`${border} rounded-2xl shadow-card p-6`}>
      {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
      <h3 className="mt-2 text-[18px] sm:text-[20px] font-semibold text-ink leading-snug tracking-[-0.02em]">
        {headline}
      </h3>
      <div className="mt-5">{children}</div>
    </div>
  )
}

/** Labelled progress bar used to show evidence under a finding headline. */
export function EvidenceBar({ label, value, total, color = '#2FA98F' }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline text-[13px] text-ink mb-2">
        <span>{label}</span>
        <span className="font-mono text-[12.5px] tabular-nums text-muted">
          {value} <span className="text-hair">·</span> {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-hair overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
