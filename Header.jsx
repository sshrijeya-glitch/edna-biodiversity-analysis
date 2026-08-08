import { Menu, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import BackendStatus from './BackendStatus'
import Button from '../ui/Button'

/**
 * Top bar. Deliberately thin: the page header inside the content area carries
 * the title, so this row only holds context switching and system status.
 */
export default function Header({ onOpenMenu, breadcrumb }) {
  return (
    <header className="sticky top-0 z-20 h-[68px] bg-mist/85 backdrop-blur-md border-b border-hair">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMenu}
            className="lg:hidden grid place-items-center w-9 h-9 rounded-lg border border-hair bg-paper text-ink"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          {breadcrumb && (
            <nav className="hidden sm:flex items-center gap-2 min-w-0" aria-label="Breadcrumb">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2 min-w-0">
                  {i > 0 && <span className="text-hair">/</span>}
                  {crumb.to ? (
                    <Link to={crumb.to} className="text-[13px] text-muted hover:text-teal truncate">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[13px] text-ink font-medium truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <BackendStatus />
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:block"
          >
            <Button variant="secondary" size="sm" className="gap-1.5">
              API docs <ArrowUpRight size={13} />
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
