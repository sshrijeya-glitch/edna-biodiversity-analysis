import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-teal text-white hover:bg-[#268D77] shadow-card',
  secondary: 'bg-paper text-ink border border-hair hover:border-teal/50 hover:text-teal',
  ghost: 'text-muted hover:text-ink hover:bg-ink/5',
  dark: 'bg-hull text-white hover:bg-trench',
  danger: 'bg-rust text-white hover:bg-[#9C3E34]',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className = '',
  disabled,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}
