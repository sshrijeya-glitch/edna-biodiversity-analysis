import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Printer, Play, ShieldAlert, Activity, Droplets, ListChecks, BookOpen, Info, ArrowLeft,
} from 'lucide-react'
import PageHeader, { SectionLabel } from '../components/ui/PageHeader'
import HeroMetric, { CompositionStrip } from '../components/ui/HeroMetric'
import { FindingPanel } from '../components/ui/StatTile'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { ErrorState, EmptyState, Skeleton, Notice } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { getResults, getSpecies } from '../api/endpoints'
import { seriesColor } from '../lib/charts'
import { formatDate } from '../lib/format'
import {
  lookupConservation, INDICATOR_TAXA, assessParameters, assessCommunity,
  buildRecommendations, buildWarnings, evenness, SEVERITY_TONE,
} from '../lib/ecology'

/**
 * Ecosystem condition report.
 *
 * Assembled entirely in the browser from two real endpoints. Each block is
 * labelled with where its content came from — measured, interpreted from a
 * published threshold, or looked up in a static table shipped with this app.
 * The backend has no conservation, pollution or ecosystem-health data.
 */
export default function EcosystemReport() {
  const { id } = useParams()
  const { data: results, loading, error, reload } = useApi(() => getResults(id), [id])
  const { data: speciesData } = useApi(() => getSpecies(id), [id])

  const assessment = useMemo(() => {
    if (!results) return null
    const bio = results.biodiversity_metrics
    const tax = results.taxonomy_summary
    const totalReads = results.preprocessing_summary?.total_passed_sequences || 0
    if (!bio || !Object.keys(bio).length) return null

    const speciesRows = speciesData?.identified_species || []
    const readsBySpecies = speciesRows.reduce((acc, r) => {
      acc[r.species] = (acc[r.species] || 0) + 1
      return acc
    }, {})

    const conservationHits = Object.keys(tax.identified_species || {}).map((species) => {
      const entry = lookupConservation(species)
      return {
        species,
        reads: tax.identified_species[species],
        found: Boolean(entry),
        ...(entry || { status: '—', label: 'Not in reference table', severity: 'none', note: 'This species is not covered by the static status table shipped with the frontend. Check the IUCN Red List directly.' }),
      }
    })

    const indicatorHits = Object.keys(tax.identified_species || {})
      .filter((s) => INDICATOR_TAXA[s])
      .map((s) => ({ species: s, reads: readsBySpecies[s] || tax.identified_species[s], ...INDICATOR_TAXA[s] }))

    const parameterFindings = assessParameters(results.sample?.environmental_metadata)
    const findings = assessCommunity({ biodiversity: bio, taxonomy: tax, totalReads })

    return {
      bio, tax, totalReads, findings, parameterFindings, indicatorHits, conservationHits,
      warnings: buildWarnings({ indicatorHits, conservationHits, parameterFindings }),
      recommendations: buildRecommendations({ findings, parameterFindings, indicatorHits, conservationHits }),
      evenness: evenness(bio.shannon_index, bio.species_richness),
    }
  }, [results, speciesData])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-2/3 max-w-lg" />
        <Skeleton className="h-56 w-full rounded-[20px]" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (!assessment) {
    return (
      <>
        <PageHeader eyebrow="Report" title="Ecosystem condition report" />
        <EmptyState
          icon={Play}
          title="No analysis to report on"
          description="This report is assembled from stored biodiversity results. Run the pipeline for this sample first."
          action={<Link to={`/analyze/${id}`}><Button icon={Play}>Run analysis</Button></Link>}
        />
      </>
    )
  }

  const { bio, tax, totalReads, findings, parameterFindings, indicatorHits, conservationHits, warnings, recommendations } = assessment
  const sample = results.sample

  const segments = Object.entries(bio.taxa_abundance || {})
    .map(([name, v], i) => ({
      name, value: v.count, color: seriesColor(name, i),
      italic: !name.startsWith('UNKNOWN_CLUSTER_') && name !== 'Unclassified_Other',
    }))
    .sort((a, b) => b.value - a.value)

  const unknownShare = tax.total_analyzed ? (tax.unknown_count / tax.total_analyzed) * 100 : 0
  const headline =
    unknownShare >= 50 ? `Most reads in this sample matched nothing known`
    : unknownShare >= 25 ? `A quarter of reads could not be classified`
    : `Most reads matched the reference database`

  return (
    <>
      <Link to={`/results/${id}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-teal mb-5 print:hidden">
        <ArrowLeft size={14} /> Back to results
      </Link>

      <PageHeader
        eyebrow={`Ecosystem report · ${formatDate(new Date())}`}
        title={sample.name}
        description={`${sample.sample_type} sample from ${sample.location}, collected ${formatDate(sample.collection_date)}. ${totalReads} reads passed quality control.`}
        actions={
          <Button icon={Printer} variant="secondary" onClick={() => window.print()} className="print:hidden">
            Print / save PDF
          </Button>
        }
      />

      {/* --- Scope statement, first thing a reader sees --- */}
      <div className="mb-6">
        <Notice tone="warning" icon={Info}>
          <strong className="font-semibold">How to read this report.</strong> Community figures are
          measured from your sequencing results. Conservation statuses come from a small static table
          shipped with this application, not a live IUCN query. Environmental judgements apply published
          general ranges to readings you entered by hand. Nothing here is a validated ecological
          survey of the site.
        </Notice>
      </div>

      {/* --- Headline finding --- */}
      <HeroMetric
        eyebrow="Shannon diversity"
        value={bio.shannon_index}
        symbol="H′"
        formula={`H′ = −Σ pᵢ ln(pᵢ) · maximum for S=${bio.species_richness} is ${Math.log(bio.species_richness).toFixed(4)}`}
        supporting={[
          { label: 'Richness', value: bio.species_richness },
          { label: 'Simpson', value: bio.simpson_index },
          { label: 'Evenness', value: assessment.evenness ? `${(assessment.evenness * 100).toFixed(0)}%` : '—', accent: true },
        ]}
      >
        <CompositionStrip segments={segments} total={totalReads} />
      </HeroMetric>

      {/* --- Community condition --- */}
      <div className="mb-4">
        <FindingPanel eyebrow="Measured · community structure" headline={headline}>
          <div className="grid lg:grid-cols-2 gap-x-10 gap-y-4">
            <div>
              <Bar label="Classified against reference" value={tax.known_taxa_count} total={tax.total_analyzed} color="#2FA98F" />
              <Bar label="Unclassified" value={tax.unknown_count} total={tax.total_analyzed} color="#D99A4E" />
            </div>
            <p className="text-[13px] text-muted leading-relaxed">
              Reads were compared against the local reference barcode database. With a reference set
              this small, an unclassified read is far more likely to mean the database lacks that
              organism than that the organism is new to science.
            </p>
          </div>

          {findings.length > 0 && (
            <ul className="mt-6 pt-5 border-t border-hair space-y-4">
              {findings.map((f) => (
                <li key={f.id} className="flex gap-3.5">
                  <Badge tone={SEVERITY_TONE[f.severity]} className="mt-0.5 shrink-0">
                    {f.severity === 'none' ? 'OK' : f.severity}
                  </Badge>
                  <div>
                    <p className="text-[14px] font-medium text-ink">{f.title}</p>
                    <p className="mt-1 text-[13px] text-muted leading-relaxed">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </FindingPanel>
      </div>

      {/* --- Conservation status --- */}
      <SectionLabel eyebrow="Reference lookup" title="Conservation status of detected species" />
      <div className="bg-paper rounded-2xl shadow-card overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-hair">
          <p className="text-[13px] text-muted leading-relaxed">
            Statuses come from a static table covering the taxa in the backend's demo reference
            database. Verify every listing at{' '}
            <a href="https://www.iucnredlist.org" target="_blank" rel="noreferrer"
              className="text-teal underline underline-offset-2">iucnredlist.org</a>{' '}
            before quoting it — assessments are revised, and global listings often differ from
            regional ones.
          </p>
        </div>
        {conservationHits.length === 0 ? (
          <p className="px-6 py-8 text-[13px] text-muted text-center">
            No species were identified above the identity cutoff.
          </p>
        ) : (
          <ul className="divide-y divide-hair">
            {conservationHits.map((c) => (
              <li key={c.species} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] italic font-medium text-ink">{c.species}</p>
                  <p className="mt-1 text-[12.5px] text-muted leading-relaxed">{c.note}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[12px] text-muted tabular-nums">{c.reads} reads</span>
                  <Badge tone={c.found ? SEVERITY_TONE[c.severity] : 'neutral'}>
                    {c.found ? `${c.status} · ${c.label}` : 'Not in table'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Indicator organisms --- */}
      {indicatorHits.length > 0 && (
        <>
          <SectionLabel eyebrow="Reference lookup" title="Indicator organisms detected" />
          <div className="space-y-3 mb-4">
            {indicatorHits.map((hit) => (
              <div key={hit.species} className="bg-paper rounded-2xl shadow-card p-6">
                <div className="flex items-start gap-4">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber/[0.12] text-[#96652A] shrink-0">
                    <Activity size={16} strokeWidth={1.9} />
                  </span>
                  <div>
                    <p className="text-[15px] italic font-medium text-ink">{hit.species}</p>
                    <p className="mt-1.5 text-[13.5px] text-ink leading-relaxed">{hit.meaning}</p>
                    <p className="mt-2.5 text-[13px] text-muted leading-relaxed">{hit.caution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- Environmental readings --- */}
      <SectionLabel eyebrow="Interpreted · published ranges" title="Environmental readings" />
      <div className="bg-paper rounded-2xl shadow-card overflow-hidden mb-4">
        {parameterFindings.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Droplets size={20} className="mx-auto text-muted/50 mb-3" />
            <p className="text-[13px] text-muted max-w-md mx-auto leading-relaxed">
              No recognised environmental parameters were recorded for this sample. Add readings such
              as pH, dissolved oxygen or temperature when creating a sample to include a water
              quality section here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hair">
            {parameterFindings.map((p) => (
              <li key={p.key} className="px-6 py-4">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <span className="text-[14px] font-medium text-ink">{p.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[18px] text-ink tabular-nums">{p.value}{p.unit}</span>
                    <Badge tone={p.withinRange ? 'positive' : 'warning'}>
                      {p.withinRange ? 'In range' : 'Out of range'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-muted leading-relaxed">{p.description}</p>
                <p className="mt-1.5 font-mono text-[11.5px] text-muted/80">
                  Typical range {p.range} · verify against CPCB or the applicable national standard
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Warnings --- */}
      <SectionLabel eyebrow="Triggered conditions" title="Warnings" />
      <div className="mb-4">
        {warnings.length === 0 ? (
          <div className="bg-paper rounded-2xl shadow-card px-6 py-8 text-center">
            <ShieldAlert size={20} className="mx-auto text-kelp mb-3" />
            <p className="text-[14px] font-medium text-ink">No conditions triggered a warning</p>
            <p className="mt-1.5 text-[13px] text-muted">
              No indicator organisms, threatened listings or out-of-range readings in this sample.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((w, i) => (
              <div key={i} className="bg-paper rounded-2xl shadow-card ring-1 ring-amber/25 p-6">
                <div className="flex items-start gap-4">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-amber/[0.12] text-[#96652A] shrink-0">
                    <ShieldAlert size={16} strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink leading-snug">{w.title}</p>
                    <p className="mt-1.5 font-mono text-[11.5px] text-[#96652A]">Triggered by: {w.trigger}</p>
                    <p className="mt-2.5 text-[13px] text-muted leading-relaxed">{w.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Recommendations --- */}
      <SectionLabel eyebrow="Derived from the findings above" title="Recommended next steps" />
      <div className="bg-paper rounded-2xl shadow-card overflow-hidden mb-4">
        <ol className="divide-y divide-hair">
          {recommendations.map((r, i) => (
            <li key={r.action} className="px-6 py-5 flex gap-5">
              <span className="font-mono text-[13px] text-muted tabular-nums pt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-[15px] font-medium text-ink">{r.action}</p>
                  <Badge tone={r.priority === 'high' ? 'warning' : r.priority === 'medium' ? 'info' : 'neutral'}>
                    {r.priority} priority
                  </Badge>
                </div>
                <p className="mt-2 text-[13px] text-muted leading-relaxed">{r.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* --- Provenance --- */}
      <div className="bg-paper rounded-2xl shadow-card p-6">
        <div className="flex items-start gap-4">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-teal/[0.10] text-teal shrink-0">
            <BookOpen size={16} strokeWidth={1.9} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink">Where these numbers came from</p>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <Provenance term="Diversity indices, read counts, taxonomy">
                Computed by the backend and read from GET /analysis/{'{id}'}/results.
              </Provenance>
              <Provenance term="Evenness, dominance, unclassified share">
                Calculated in the browser from those stored figures. Thresholds used to phrase each
                finding are presentation conventions, not standards.
              </Provenance>
              <Provenance term="Conservation status">
                Static table in the frontend covering the demo reference taxa. Not a live IUCN query.
              </Provenance>
              <Provenance term="Environmental interpretation">
                Published general ranges for freshwater aquatic life applied to readings entered
                manually when the sample was created.
              </Provenance>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3 print:hidden">
        <Link to="/reports">
          <Button variant="secondary" icon={ListChecks} className="w-full">Backend PDF and CSV</Button>
        </Link>
        <Button icon={Printer} onClick={() => window.print()}>Print this report</Button>
      </div>
    </>
  )
}

function Bar({ label, value, total, color }) {
  const pct = total ? (value / total) * 100 : 0
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline text-[13px] text-ink mb-2">
        <span>{label}</span>
        <span className="font-mono text-[12.5px] tabular-nums text-muted">
          {value} · {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-hair overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function Provenance({ term, children }) {
  return (
    <div className="sm:flex sm:gap-4">
      <dt className="text-ink font-medium sm:w-[42%] shrink-0">{term}</dt>
      <dd className="text-muted leading-relaxed">{children}</dd>
    </div>
  )
}
