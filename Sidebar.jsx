import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FlaskConical, PlusCircle, PlayCircle, BarChart3,
  Fish, Waves, HelpCircle, FileText, Stethoscope, X,
} from 'lucide-react'
import Logo from '../brand/Logo'
import Helix from '../brand/Helix'
import { shortId } from '../../lib/format'

/**
 * Reads the active sample id out of the URL. Analysis routes are shaped
 * /analyze/:id, /results/:id, /species/:id, /biodiversity/:id, /unknown/:id
 * so the sidebar can stay in context without any global state.
 */
export function useActiveSampleId() {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/(analyze|results|species|biodiversity|unknown|report|samples)\/([^/]+)/)
  if (!match) return null
  if (match[2] === 'new') return null
  return match[2]
}

const WORKSPACE = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/samples', label: 'Samples', icon: FlaskConical },
  { to: '/samples/new', label: 'New sample', icon: PlusCircle },
  { to: '/reports', label: 'Reports', icon: FileText },
]

const ANALYSIS = [
  { path: 'analyze', label: 'Run analysis', icon: PlayCircle },
  { path: 'results', label: 'Results', icon: BarChart3 },
  { path: 'species', label: 'Species', icon: Fish },
  { path: 'biodiversity', label: 'Biodiversity', icon: Waves },
  { path: 'unknown', label: 'Unknown clusters', icon: HelpCircle },
  { path: 'report', label: 'Ecosystem report', icon: Stethoscope },
]

function Item({ to, label, icon: Icon, onNavigate, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] transition-colors ${
          isActive
            ? 'bg-teal/[0.12] text-white font-medium'
            : 'text-seafoam/65 hover:text-white hover:bg-white/[0.04]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-teal transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <Icon size={16} strokeWidth={1.9} className="shrink-0" />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const sampleId = useActiveSampleId()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-abyss/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-[264px] bg-abyss flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute inset-y-0 right-0 pointer-events-none overflow-hidden w-24">
<Helix width={88} height={1100} opacity={0.3} className="animate-drift" />        </div>

        <div className="relative flex items-center justify-between px-5 h-[68px] border-b border-white/[0.06]">
          <Logo tone="dark" />
          <button onClick={onClose} className="lg:hidden text-seafoam/70 hover:text-white" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <div>
            <p className="eyebrow text-seafoam/40 px-3 mb-2">Workspace</p>
            <div className="space-y-0.5">
              {WORKSPACE.map((item) => (
                <Item key={item.to} {...item} onNavigate={onClose} end={item.to === '/samples'} />
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow text-seafoam/40 px-3 mb-2">Analysis</p>
            {sampleId ? (
              <>
                <div className="px-3 pb-2">
                  <span className="font-mono text-[11px] text-teal">#{shortId(sampleId)}</span>
                </div>
                <div className="space-y-0.5">
                  {ANALYSIS.map((item) => (
                    <Item
                      key={item.path}
                      to={`/${item.path}/${sampleId}`}
                      label={item.label}
                      icon={item.icon}
                      onNavigate={onClose}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="px-3 text-[12.5px] text-seafoam/40 leading-relaxed">
                Open a sample to reach preprocessing, taxonomy and biodiversity.
              </p>
            )}
          </div>
        </nav>

        <div className="relative px-5 py-4 border-t border-white/[0.06]">
          <p className="eyebrow text-seafoam/35">SIH25042 · Prototype</p>
          <p className="mt-1.5 text-[11.5px] text-seafoam/45 leading-relaxed">
            Results come from a local demo reference database.
          </p>
        </div>
      </aside>
    </>
  )
}