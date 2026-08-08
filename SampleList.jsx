import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FlaskConical, SlidersHorizontal } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SampleCard from '../components/samples/SampleCard'
import { EmptyState, ErrorState, CardSkeleton } from '../components/ui/States'
import { inputClass, selectClass } from '../components/ui/Field'
import { useApi } from '../hooks/useApi'
import { listSamples } from '../api/endpoints'

/**
 * Full sample list. The backend returns every sample in one response with no
 * pagination or query parameters, so search and filtering happen in the browser.
 */
export default function SampleList() {
  const { data: samples, loading, error, reload } = useApi(() => listSamples(), [])
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')

  const types = useMemo(
    () => Array.from(new Set((samples || []).map((s) => s.sample_type).filter(Boolean))),
    [samples],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (samples || []).filter((s) => {
      const matchesType = type === 'all' || s.sample_type === type
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      return matchesType && matchesQuery
    })
  }, [samples, query, type])

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Samples"
        description="Every environmental sample registered in this workspace."
        actions={
          <Link to="/samples/new">
            <Button icon={Plus}>New sample</Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, location or ID"
            className={`${inputClass} pl-9`}
            aria-label="Search samples"
          />
        </div>
        <div className="relative sm:w-56">
          <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${selectClass} pl-9`}
            aria-label="Filter by sample type"
          >
            <option value="all">All sample types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        (samples || []).length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No samples yet"
            description="Register an environmental sample with its collection metadata to begin."
            action={<Link to="/samples/new"><Button icon={Plus}>Create your first sample</Button></Link>}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No samples match those filters"
            description="Try a different search term, or clear the sample type filter."
            action={
              <Button variant="secondary" onClick={() => { setQuery(''); setType('all') }}>
                Clear filters
              </Button>
            }
          />
        )
      ) : (
        <>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted mb-4">
            {filtered.length} {filtered.length === 1 ? 'sample' : 'samples'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
