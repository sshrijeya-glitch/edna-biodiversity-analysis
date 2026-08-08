import { Link } from 'react-router-dom'
import { FlaskConical, Droplets, Mountain, Layers, Plus, ArrowRight, Beaker } from 'lucide-react'
import PageHeader, { SectionLabel } from '../components/ui/PageHeader'
import StatTile from '../components/ui/StatTile'
import Button from '../components/ui/Button'
import SampleCard from '../components/samples/SampleCard'
import { EmptyState, ErrorState, TileSkeleton, CardSkeleton, Notice } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { listSamples } from '../api/endpoints'
import { isSeededDemoSample } from '../lib/format'

/**
 * Dashboard. Every number here is counted from the real GET /samples response —
 * there is no aggregate statistics endpoint in the backend, so nothing is estimated.
 */
export default function Dashboard() {
  const { data: samples, loading, error, reload } = useApi(() => listSamples(), [])

  const counts = (samples || []).reduce(
    (acc, s) => {
      acc.total += 1
      const key = (s.sample_type || '').toLowerCase()
      if (key === 'water') acc.water += 1
      else if (key === 'soil') acc.soil += 1
      else if (key === 'sediment') acc.sediment += 1
      else acc.other += 1
      return acc
    },
    { total: 0, water: 0, soil: 0, sediment: 0, other: 0 },
  )

  const demoSample = (samples || []).find(isSeededDemoSample)
  const recent = (samples || []).slice(0, 6)

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Sample overview"
        description="Environmental DNA samples registered in this workspace, with the stage each one has reached in the analysis pipeline."
        actions={
          <Link to="/samples/new">
            <Button icon={Plus}>New sample</Button>
          </Link>
        }
      />

      {/* --- Counters --- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <TileSkeleton key={i} />)
        ) : error ? null : (
          <>
            <StatTile label="Samples" value={counts.total} icon={FlaskConical} tone="accent"
              hint="Registered in this workspace" />
            <StatTile label="Water" value={counts.water} icon={Droplets} />
            <StatTile label="Soil" value={counts.soil} icon={Mountain} />
            <StatTile label="Sediment" value={counts.sediment} icon={Layers} />
          </>
        )}
      </section>

      {/* --- Seeded demo pointer: real data, honestly labelled --- */}
      {demoSample && (
        <div className="mb-8">
          <Notice tone="info" icon={Beaker}>
            <strong className="font-semibold">A demo sample is already loaded.</strong>{' '}
            The backend seeds <span className="font-mono text-[12px]">{demoSample.name}</span> with a
            FASTA file attached, so you can run the full pipeline without uploading anything.{' '}
            <Link to={`/analyze/${demoSample.id}`} className="underline underline-offset-2 font-medium">
              Run it now
            </Link>
            .
          </Notice>
        </div>
      )}

      {/* --- Recent samples --- */}
      <section>
        <SectionLabel eyebrow="Recent" title="Latest samples" action={
          (samples || []).length > 6 ? (
            <Link to="/samples" className="flex items-center gap-1.5 text-[13px] font-medium text-teal hover:gap-2.5 transition-all">
              View all {counts.total} <ArrowRight size={14} />
            </Link>
          ) : null
        } />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No samples yet"
            description="Register an environmental sample with its collection metadata, then upload the sequence file it produced."
            action={
              <Link to="/samples/new">
                <Button icon={Plus}>Create your first sample</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((sample) => (
              <SampleCard key={sample.id} sample={sample} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
