const TONES = {
  neutral: 'bg-ink/5 text-muted border-hair',
  info: 'bg-teal/10 text-teal border-teal/20',
  positive: 'bg-kelp/[0.12] text-[#1F7A63] border-kelp/30',
  warning: 'bg-amber/[0.12] text-[#96652A] border-amber/30',
  danger: 'bg-rust/10 text-rust border-rust/20',
  demo: 'bg-amber/[0.12] text-[#96652A] border-amber/40',
}

export default function Badge({ children, tone = 'neutral', icon: Icon, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border
        font-mono text-[11px] uppercase tracking-[0.1em] whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  )
}
