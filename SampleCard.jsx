import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Droplets, Mountain, Layers, ArrowRight } from 'lucide-react'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/States'
import { getResults } from '../../api/endpoints'
import { shortId, formatDate, isSeededDemoSample, deriveStage, STAGE_LABEL, STAGE_TONE } from '../../lib/format'

const TYPE_ICON = { Water: Droplets, Soil: Mountain, Sediment: Layers }

/**
 * One sample. The pipeline stage is fetched per card from the real
 * GET /analysis/{id}/results endpoint — the backend's /samples list does not
 * carry status, so there is no way to know it without asking.
 */
export default function SampleCard({ sample }) {
  const [stage, setStage] = useState(null)
  const TypeIcon = TYPE_ICON[sample.sample_type] || Droplets
  const isDemo = isSeededDemoSample(sample)

  useEffect(() => {
    let active = true
    getResults(sample.id)
      .then((results) => active && setStage(deriveStage(results)))
      .catch(() => active && setStage('created'))
    return () => {
      active = false
    }
  }, [sample.id])

  const env = sample.environmental_metadata || {}
  const envKeys = Object.keys(env).filter((k) => typeof env[k] === 'number').slice(0, 3)

  return (
    <Link
      to={`/samples/${sample.id}`}
      className="group block bg-paper border border-hair rounded-2xl shadow-card hover:shadow-lift
        hover:border-teal/40 transition-all overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-hull text-seafoam shrink-0">
            <TypeIcon size={16} strokeWidth={1.9} />
          </span>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {isDemo && <Badge tone="demo">Seeded demo</Badge>}
            {stage ? (
              <Badge tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Badge>
            ) : (
              <Skeleton className="h-[22px] w-28" />
            )}
          </div>
        </div>

        <h3 className="mt-3.5 text-[15px] font-semibold text-ink leading-snug group-hover:text-teal transition-colors">
          {sample.name}
        </h3>

        <div className="mt-2.5 space-y-1.5">
          <p className="flex items-start gap-2 text-[12.5px] text-muted">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            <span className="line-clamp-1">{sample.location}</span>
          </p>
          <p className="flex items-center gap-2 text-[12.5px] text-muted">
            <Calendar size={13} className="shrink-0" />
            Collected {formatDate(sample.collection_date)}
          </p>
        </div>

        {envKeys.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {envKeys.map((key) => (
              <span key={key} className="font-mono text-[11px] text-muted">
                <span className="uppercase tracking-[0.08em] opacity-70">{key.replace(/_/g, ' ')}</span>{' '}
                <span className="text-ink">{env[key]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-mist/60 border-t border-hair flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted">#{shortId(sample.id)}</span>
        <span className="flex items-center gap-1 text-[12px] font-medium text-teal opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  )
}
