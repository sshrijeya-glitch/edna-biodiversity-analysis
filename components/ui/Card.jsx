/** Rounded surface with a restrained shadow. The default container for anything on a light page. */
export default function Card({ children, className = '', as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-paper border border-hair rounded-2xl shadow-card ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, description, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-hair">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="mt-0.5 grid place-items-center w-8 h-8 rounded-lg bg-teal/10 text-teal shrink-0">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink truncate">{title}</h3>
          {description && <p className="text-[13px] text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}
