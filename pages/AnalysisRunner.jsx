import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Play, RotateCcw, ArrowRight, SlidersHorizontal, ChevronDown } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SampleSubNav from '../components/analysis/SampleSubNav'
import StageCard from '../components/analysis/StageCard'
import ParamControl from '../components/analysis/ParamControl'
import CopyJson from '../components/analysis/CopyJson'
import { ErrorState, Notice, Skeleton } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import {
  getSample, runPreprocess, runTaxonomy, runUnknownClustering, runBiodiversity,
} from '../api/endpoints'
import { readError } from '../api/client'

/**
 * The analysis runner. Four POSTs, executed in order, each one showing its real
 * response before the next begins. Every parameter below is a real request field.
 */

const STAGES = [
  { key: 'preprocess', title: 'Preprocess reads', description: 'Parses the uploaded FASTA/FASTQ with Biopython, validates nucleotides, then filters on length and Phred quality.' },
  { key: 'taxonomy', title: 'Assign taxonomy', description: 'Aligns every passing read against the local reference barcode database and assigns a lineage above the identity cutoff.' },
  { key: 'clustering', title: 'Cluster unknown reads', description: 'Groups reads that matched nothing into candidate clusters using 4-mer frequency profiles.' },
  { key: 'biodiversity', title: 'Measure biodiversity', description: 'Computes species richness, Shannon index and Simpson index across identified taxa and unknown clusters.' },
]

const INITIAL_STATUS = { preprocess: 'idle', taxonomy: 'idle', clustering: 'idle', biodiversity: 'idle' }

export default function AnalysisRunner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: sample, loading, error, reload } = useApi(() => getSample(id), [id])

  // Defaults match app/config.py and the Pydantic Field defaults exactly.
  const [params, setParams] = useState({
    min_length: 50,
    max_length: 5000,
    min_quality: 20,
    similarity_threshold: 85,
    min_cluster_size: 1,
  })
  const [showParams, setShowParams] = useState(false)
  const [status, setStatus] = useState(INITIAL_STATUS)
  const [results, setResults] = useState({})
  const [errors, setErrors] = useState({})
  const [running, setRunning] = useState(false)

  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }))

  const runStage = async (key, fn) => {
    setStatus((s) => ({ ...s, [key]: 'running' }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    try {
      const data = await fn()
      setResults((r) => ({ ...r, [key]: data }))
      setStatus((s) => ({ ...s, [key]: 'done' }))
      return data
    } catch (err) {
      setErrors((e) => ({ ...e, [key]: readError(err) }))
      setStatus((s) => ({ ...s, [key]: 'failed' }))
      return null
    }
  }

  const runAll = async () => {
    setRunning(true)
    setStatus(INITIAL_STATUS)
    setResults({})
    setErrors({})

    const pre = await runStage('preprocess', () =>
      runPreprocess(id, {
        min_length: params.min_length,
        max_length: params.max_length,
        min_quality: params.min_quality,
      }),
    )
    if (!pre) return setRunning(false)

    if (pre.total_passed === 0) {
      setErrors((e) => ({
        ...e,
        taxonomy: 'No reads passed preprocessing, so there is nothing to classify. Loosen the length or quality filters and run again.',
      }))
      setStatus((s) => ({ ...s, taxonomy: 'failed' }))
      return setRunning(false)
    }

    const tax = await runStage('taxonomy', () =>
      runTaxonomy(id, { similarity_threshold: params.similarity_threshold }),
    )
    if (!tax) return setRunning(false)

    const clusters = await runStage('clustering', () =>
      runUnknownClustering(id, { min_cluster_size: params.min_cluster_size }),
    )
    if (!clusters) return setRunning(false)

    await runStage('biodiversity', () => runBiodiversity(id))
    setRunning(false)
  }

  const reset = () => {
    setStatus(INITIAL_STATUS)
    setResults({})
    setErrors({})
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={reload} title="Could not load this sample" />

  const complete = status.biodiversity === 'done'
  const started = Object.values(status).some((s) => s !== 'idle')

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title={sample.name}
        description="Runs the four backend stages in order. Each stage depends on the one before it."
        actions={
          <div className="flex gap-2">
            {started && !running && (
              <Button variant="secondary" icon={RotateCcw} onClick={reset}>Clear</Button>
            )}
            <Button icon={Play} onClick={runAll} loading={running}>
              {running ? 'Running' : started ? 'Run again' : 'Run analysis'}
            </Button>
          </div>
        }
      />

      <SampleSubNav sampleId={id} />

      {/* --- Parameters --- */}
      <Card className="mb-6">
        <button
          onClick={() => setShowParams((v) => !v)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-teal/[0.10] text-teal">
              <SlidersHorizontal size={15} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">Analysis parameters</h3>
              <p className="text-[12.5px] text-muted mt-0.5">
                Length {params.min_length}–{params.max_length} bp · Q≥{params.min_quality} · identity ≥{params.similarity_threshold}%
              </p>
            </div>
          </div>
          <ChevronDown size={17} className={`text-muted transition-transform ${showParams ? 'rotate-180' : ''}`} />
        </button>

        {showParams && (
          <CardBody className="border-t border-hair grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <ParamControl label="Minimum read length" value={params.min_length} onChange={(v) => setParam('min_length', v)}
              min={10} max={1000} step={10} unit=" bp" disabled={running} />
            <ParamControl label="Maximum read length" value={params.max_length} onChange={(v) => setParam('max_length', v)}
              min={100} max={50000} step={100} unit=" bp" disabled={running} />
            <ParamControl label="Minimum Phred quality" value={params.min_quality} onChange={(v) => setParam('min_quality', v)}
              min={0} max={40} step={1} unit=" Q" hint="FASTQ only" disabled={running} />
            <ParamControl label="Identity cutoff" value={params.similarity_threshold} onChange={(v) => setParam('similarity_threshold', v)}
              min={50} max={100} step={1} unit="%" hint="Known vs unknown" disabled={running} />
            <ParamControl label="Minimum cluster size" value={params.min_cluster_size} onChange={(v) => setParam('min_cluster_size', v)}
              min={1} max={20} step={1} unit=" reads" disabled={running} />
            <div className="flex items-end">
              <p className="text-[12px] text-muted leading-relaxed">
                Re-running replaces the stored results for this sample. The backend does not
                keep a history of previous runs.
              </p>
            </div>
          </CardBody>
        )}
      </Card>

      {/* --- Pipeline --- */}
      <Card>
        <CardHeader title="Pipeline" description="Live output from each backend call." />
        <CardBody>
          {STAGES.map((stage, i) => (
            <StageCard
              key={stage.key}
              index={i}
              total={STAGES.length}
              title={stage.title}
              description={stage.description}
              status={status[stage.key]}
              error={errors[stage.key]}
            >
              {results[stage.key] && (
                <StageResult stageKey={stage.key} data={results[stage.key]} />
              )}
            </StageCard>
          ))}

          {!started && (
            <div className="ml-[52px]">
              <Notice tone="info">
                Nothing has run yet. Press <strong className="font-semibold">Run analysis</strong> to
                execute all four stages against this sample's uploaded file.
              </Notice>
            </div>
          )}
        </CardBody>
      </Card>

      {complete && (
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <Link to={`/species/${id}`}>
            <Button variant="secondary" className="w-full">Explore species</Button>
          </Link>
          <Button size="lg" icon={ArrowRight} onClick={() => navigate(`/results/${id}`)}>
            View full results
          </Button>
        </div>
      )}
    </>
  )
}

/** Renders the real response of a completed stage. Nothing here is computed locally. */
function StageResult({ stageKey, data }) {
  const Row = ({ children }) => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
  )
  const Metric = ({ label, value, tone }) => (
    <div>
      <p className="eyebrow text-muted">{label}</p>
      <p className={`font-mono text-[19px] mt-1 tabular-nums ${tone || 'text-ink'}`}>{value}</p>
    </div>
  )

  return (
    <div className="rounded-xl border border-hair bg-mist/50 p-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <Badge tone="positive">Completed</Badge>
        <CopyJson data={data} />
      </div>

      {stageKey === 'preprocess' && (
        <>
          <Row>
            <Metric label="Parsed" value={data.total_parsed} />
            <Metric label="Passed" value={data.total_passed} tone="text-teal" />
            <Metric label="Rejected" value={data.total_rejected} tone={data.total_rejected ? 'text-rust' : ''} />
            <Metric label="Avg length" value={`${data.avg_length} bp`} />
            <Metric label="Avg GC" value={`${data.avg_gc_content}%`} />
          </Row>
          {data.total_rejected > 0 && (
            <div className="mt-4 pt-3 border-t border-hair flex flex-wrap gap-x-5 gap-y-1.5">
              {Object.entries(data.rejection_breakdown).map(([key, count]) =>
                count > 0 ? (
                  <span key={key} className="font-mono text-[11.5px] text-muted">
                    {key.replace('REJECTED_', '').replace('_', ' ').toLowerCase()}{' '}
                    <span className="text-ink">{count}</span>
                  </span>
                ) : null,
              )}
            </div>
          )}
        </>
      )}

      {stageKey === 'taxonomy' && (
        <>
          <Row>
            <Metric label="Analysed" value={data.total_analyzed} />
            <Metric label="Known taxa" value={data.known_taxa_count} tone="text-teal" />
            <Metric label="Unknown" value={data.unknown_count} tone="text-[#96652A]" />
            <Metric label="Cutoff used" value={`${data.similarity_threshold_used}%`} />
          </Row>
          {Object.keys(data.identified_taxa_summary || {}).length > 0 && (
            <div className="mt-4 pt-3 border-t border-hair flex flex-wrap gap-2">
              {Object.entries(data.identified_taxa_summary).map(([species, count]) => (
                <span key={species} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paper border border-hair">
                  <span className="text-[12px] italic text-ink">{species}</span>
                  <span className="font-mono text-[11px] text-muted">{count}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {stageKey === 'clustering' && (
        <>
          <Row>
            <Metric label="Unknown reads" value={data.total_unknown_sequences} />
            <Metric label="Clusters formed" value={data.total_clusters} tone="text-[#96652A]" />
          </Row>
          {data.clusters?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-hair flex flex-wrap gap-2">
              {data.clusters.map((c) => (
                <span key={c.cluster_tag} className="font-mono text-[11px] px-2 py-1 rounded-lg bg-amber/[0.10] text-[#96652A] border border-amber/25">
                  {c.cluster_tag} · {c.cluster_size}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {stageKey === 'biodiversity' && (
        <Row>
          <Metric label="Total reads" value={data.total_sequences} />
          <Metric label="Richness (S)" value={data.species_richness} tone="text-teal" />
          <Metric label="Shannon (H′)" value={data.shannon_index} tone="text-teal" />
          <Metric label="Simpson (1−D)" value={data.simpson_index} tone="text-teal" />
        </Row>
      )}
    </div>
  )
}
