/**
 * Page title block. Type scale carries the hierarchy: a small monospace eyebrow,
 * a large title, and quiet body text underneath.
 */
export default function PageHeader({ eyebrow, title, description, actions, children, size = 'lg' }) {
  const titleSize = size === 'lg'
    ? 'text-[34px] sm:text-[44px] lg:text-[48px]'
    : 'text-[26px] sm:text-[32px]'

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow text-teal mb-3">{eyebrow}</p>}
          <h1 className={`${titleSize} font-bold text-ink leading-[1.02] tracking-[-0.035em] max-w-[18ch]`}>
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-[14px] text-muted max-w-2xl leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** Section divider used between major blocks on a page. */
export function SectionLabel({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && <p className="eyebrow text-teal mb-1.5">{eyebrow}</p>}
        <h2 className="text-[20px] font-semibold text-ink tracking-[-0.02em]">{title}</h2>
      </div>
      {action}
    </div>
  )
}
