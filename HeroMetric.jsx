import Helix from '../brand/Helix'

/**
 * The payoff block. One number at display size, the helix visible behind it,
 * and a row of supporting figures. Used at the top of a results-style page so
 * the reader's eye lands on the finding before anything else.
 */
export default function HeroMetric({ eyebrow, value, symbol, formula, supporting = [], children }) {
  return (
    <section className="relative bg-paper rounded-[20px] shadow-card overflow-hidden mb-4">
      {/* The signature, finally at a size where it reads */}
      <div className="absolute right-[-20px] top-4 w-[380px] h-[130px] pointer-events-none hidden sm:block">
  <Helix width={380} height={130} orientation="horizontal" opacity={0.45} />
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
          <div>
            <p className="eyebrow text-muted">{eyebrow}</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-mono font-medium text-ink tabular-nums leading-[0.9] tracking-[-0.04em] text-[56px] sm:text-[76px] lg:text-[88px]">
                {value}
              </span>
              {symbol && <span className="font-mono text-[20px] sm:text-[24px] text-teal">{symbol}</span>}
            </div>
            {formula && <p className="mt-4 font-mono text-[12px] text-muted">{formula}</p>}
          </div>

          {supporting.length > 0 && (
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              {supporting.map((item) => (
                <div key={item.label}>
                  <p className="eyebrow text-muted">{item.label}</p>
                  <p className={`mt-1.5 font-mono text-[30px] leading-none tabular-nums tracking-[-0.02em] ${
                    item.accent ? 'text-teal' : 'text-ink'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {children && <div className="relative mt-7 pt-6 border-t border-hair">{children}</div>}
      </div>
    </section>
  )
}

/** Single stacked bar with an inline legend. Replaces a donut plus a separate legend card. */
export function CompositionStrip({ segments, total }) {
  return (
    <>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
        {segments.map((s) => (
          <div key={s.name} style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.name}: ${s.value}`} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5">
        {segments.map((s) => (
          <span key={s.name} className="flex items-center gap-2 text-[13px] text-ink">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className={s.italic ? 'italic' : ''}>{s.name}</span>
            <span className="font-mono text-[12px] text-muted tabular-nums">
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </>
  )
}
