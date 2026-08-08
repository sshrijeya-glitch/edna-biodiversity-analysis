import { Link } from 'react-router-dom'

/** Wordmark. The mark is a compressed helix cross-section, not a generic leaf icon. */
export default function Logo({ to = '/dashboard', tone = 'dark', compact = false }) {
  const titleColor = tone === 'dark' ? 'text-white' : 'text-ink'
  const subColor = tone === 'dark' ? 'text-seafoam/60' : 'text-muted'

  return (
    <Link to={to} className="flex items-center gap-3 group" aria-label="EcoGenome AI home">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="30" height="30" rx="9" fill="#0E2E3E" />
        <path d="M9 6.5c0 5 12 6 12 11s-12 6-12 11" stroke="#4FC3A1" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M21 6.5c0 5-12 6-12 11s12 6 12 11" stroke="#7FD4C1" strokeWidth="1.7" strokeLinecap="round" strokeOpacity="0.7" />
        <line x1="10.5" y1="11" x2="19.5" y2="11" stroke="#7FD4C1" strokeWidth="1.1" strokeOpacity="0.5" />
        <line x1="10.5" y1="19" x2="19.5" y2="19" stroke="#7FD4C1" strokeWidth="1.1" strokeOpacity="0.5" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={`block font-display font-bold text-[17px] tracking-tight ${titleColor}`}>
            EcoGenome<span className="text-teal"> AI</span>
          </span>
          <span className={`block eyebrow mt-1 ${subColor}`}>eDNA Intelligence</span>
        </span>
      )}
    </Link>
  )
}
