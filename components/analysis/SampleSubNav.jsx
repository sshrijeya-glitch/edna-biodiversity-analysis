import { NavLink } from 'react-router-dom'
import { PlayCircle, BarChart3, Fish, Waves, HelpCircle, Stethoscope } from 'lucide-react'

const TABS = [
  { path: 'analyze', label: 'Run', icon: PlayCircle },
  { path: 'results', label: 'Results', icon: BarChart3 },
  { path: 'species', label: 'Species', icon: Fish },
  { path: 'biodiversity', label: 'Biodiversity', icon: Waves },
  { path: 'unknown', label: 'Unknown', icon: HelpCircle },
  { path: 'report', label: 'Report', icon: Stethoscope },
]

/** Horizontal tabs shared by every analysis screen, so the sample stays in context. */
export default function SampleSubNav({ sampleId }) {
  return (
    <div className="flex gap-1 p-1 bg-paper border border-hair rounded-xl overflow-x-auto mb-6">
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={`/${tab.path}/${sampleId}`}
          className={({ isActive }) =>
            `flex items-center gap-2 px-3.5 h-9 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
              isActive ? 'bg-hull text-white' : 'text-muted hover:text-ink hover:bg-mist'
            }`
          }
        >
          <tab.icon size={14} strokeWidth={1.9} />
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
