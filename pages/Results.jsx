import { Link, useParams } from 'react-router-dom'
import { Play, FileDown, ArrowRight, Fish, HelpCircle, Waves, Stethoscope } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

import PageHeader, { SectionLabel } from '../components/ui/PageHeader'
import HeroMetric, { CompositionStrip } from '../components/ui/HeroMetric'
import { FindingPanel, EvidenceBar } from '../components/ui/StatTile'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SampleSubNav from '../components/analysis/SampleSubNav'
import CopyJson from '../components/analysis/CopyJson'
import { ErrorState, EmptyState, Skeleton } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { getResults } from '../api/endpoints'
import { CHART, seriesColor, tooltipStyle, axisProps } from '../charts'
import { formatDate, isSeededDemoSample } from '../format'

/**
 * Combined results view. One call: GET /analysis/{id}/results.
 * Every figure below is a field of that response — nothing is recomputed.
 */
export default function Results() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi(() => getResults(id), [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-56 w-full rounded-[20px]" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={reload} />

  const { sample, preprocessing_summary: pre, taxonomy_summary: tax, unknown_clusters: clusters, biodiversity_metrics: bio } = data
  const hasBiodiversity = bio && Object.keys(bio).length > 0
  const hasTaxonomy = (tax?.total_analyzed || 0) > 0

  const totalReads = pre?.total_passed_sequences || 0

  const segments = Object.entries(bio?.taxa_abundance || {})
    .map(([name, v], i) => ({
      name, value: v.count, color: seriesColor(name, i),
      italic: !name.startsWith('UNKNOWN_CLUSTER_') && name !== 'Unclassified_Other',
    }))
    .sort((a, b) => b.value - a.value)

  const unknownShare = tax?.total_analyzed ? (tax.unknown_count / tax.total_analyzed) * 100 : 0
  const classificationHeadline =
    unknownShare >= 50 ? 'Half or more of all reads matched nothing known'
    : unknownShare >= 25 ? 'A quarter of reads could not be classified'
    : unknownShare > 0 ? 'Most reads matched the reference database'
    : 'Every read matched the reference database'

  const topSpecies = Object.entries(tax?.identified_species || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title={sample.name}
        description={`${sample.sample_type} sample collected at ${sample.location} on ${formatDate(sample.collection_date)}.`}
        actions={
          <div className="flex gap-2">
            <Link to={`/analyze/${id}`}>
              <Button variant="secondary" icon={Play}>Re-run</Button>
            </Link>
            <Link to={`/report/${id}`}>
              <Button icon={FileDown}>Ecosystem report</Button>
            </Link>
          </div>
        }
      />

      <SampleSubNav sampleId={id} />

      {isSeededDemoSample(sample) && (
        <div className="mb-6">
          <Badge tone="demo">Seeded demo sample — data shipped with the backend</Badge>
        </div>
      )}

      {!hasTaxonomy ? (
        <EmptyState
          icon={Play}
          title="This sample has not been analysed yet"
          description="Run the pipeline to produce taxonomy assignments, unknown clusters and biodiversity metrics."
          action={<Link to={`/analyze/${id}`}><Button icon={Play}>Run analysis</Button></Link>}
        />
      ) : (
        <>
          <HeroMetric
            eyebrow="Shannon diversity"
            value={hasBiodiversity ? bio.shannon_index : '—'}
            symbol="H\u2032"
            formula={hasBiodiversity
              ? `H\u2032 = \u2212\u03A3 p\u1D62 ln(p\u1D62) \u00b7 maximum for S=${bio.species_richness} is ${Math.log(bio.species_richness).toFixed(4)}`
              : 'Run the biodiversity stage to compute this'}
            supporting={[
              { label: 'Richness', value: hasBiodiversity ? bio.species_richness : '—' },
              { label: 'Simpson', value: hasBiodiversity ? bio.simpson_index : '—' },
              { label: 'Reads passed', value: pre?.total_passed_sequences ?? 0, accent: true },
            ]}
          >
            {segments.length > 0 && <CompositionStrip segments={segments} total={totalReads} />}
          </HeroMetric>

          <div className="grid lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-3">
              <FindingPanel eyebrow="Read classification" headline={classificationHeadline}>
                <EvidenceBar label="Classified against reference" value={tax.known_taxa_count}
                  total={tax.total_analyzed} color={CHART.known} />
                <EvidenceBar label="Unclassified" value={tax.unknown_count}
                  total={tax.total_analyzed} color={CHART.unknown} />
                <p className="mt-5 text-[13px] text-muted leading-relaxed">
                  Compared at a {'\u2265'}85% identity cutoff against the local reference barcode
                  database. Average read length {pre?.avg_length ?? 0} bp, average GC content{' '}
                  {pre?.avg_gc_content ?? 0}%.
                </p>
              </FindingPanel>
            </div>
            <div className="lg:col-span-2">
              <Link to={`/unknown/${id}`}
                className="group block h-full bg-hull rounded-2xl p-6 shadow-card hover:bg-trench transition-colors">
                <p className="eyebrow text-seafoam/60">Unknown</p>
                <p className="mt-3 font-mono text-[46px] leading-none text-white tracking-[-0.03em] tabular-nums">
                  {clusters?.length || 0}
                </p>
                <p className="mt-2.5 text-[13px] text-seafoam/75 leading-relaxed">
                  candidate {clusters?.length === 1 ? 'cluster' : 'clusters'} from {tax.unknown_count} unclassified reads
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-white group-hover:gap-2.5 transition-all">
                  Inspect clusters <ArrowRight size={14} />
                </span>
              </Link>
            </div>
          </div>

          <SectionLabel eyebrow="Most abundant" title="Identified taxa by read count" action={
            <Link to={`/species/${id}`}>
              <Button variant="ghost" size="sm">All species <ArrowRight size={13} /></Button>
            </Link>
          } />
          <Card className="mb-4">
            <CardBody>
              {topSpecies.length === 0 ? (
                <p className="text-[13px] text-muted py-8 text-center">
                  No reads matched the reference database at this identity cutoff.
                </p>
              ) : (
                <div style={{ height: Math.max(200, topSpecies.length * 38) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSpecies} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                      <CartesianGrid horizontal={false} stroke={CHART.grid} />
                      <XAxis type="number" {...axisProps} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={150} {...axisProps}
                        tick={{ ...axisProps.tick, fontStyle: 'italic', fontFamily: '"Instrument Sans", sans-serif', fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(47,169,143,0.06)' }} />
                      <Bar dataKey="count" fill={CHART.known} radius={[0, 5, 5, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          {/* --- Follow-on screens --- */}
          <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <NavCard to={`/species/${id}`} icon={Fish} title="Species explorer"
              value={Object.keys(tax.identified_species || {}).length} label="identified taxa" />
            <NavCard to={`/unknown/${id}`} icon={HelpCircle} title="Unknown clusters"
              value={clusters?.length || 0} label="candidate clusters" tone="amber" />
            <NavCard to={`/biodiversity/${id}`} icon={Waves} title="Biodiversity"
              value={hasBiodiversity ? bio.species_richness : '—'} label="total richness" />
            <NavCard to={`/report/${id}`} icon={Stethoscope} title="Ecosystem report"
              value={<span className="text-[20px]">Open</span>} label="condition, warnings, next steps" />
          </section>
        </>
      )}
    </>
  )
}

function NavCard({ to, icon: Icon, title, value, label, tone }) {
  return (
    <Link to={to} className="group bg-paper border border-hair rounded-2xl shadow-card p-5
      hover:shadow-lift hover:border-teal/40 transition-all">
      <div className="flex items-center justify-between">
        <span className={`grid place-items-center w-9 h-9 rounded-xl ${
          tone === 'amber' ? 'bg-amber/[0.12] text-[#96652A]' : 'bg-teal/[0.10] text-teal'}`}>
          <Icon size={16} strokeWidth={1.9} />
        </span>
        <ArrowRight size={15} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="mt-4 font-mono text-[24px] text-ink tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-[13px] font-medium text-ink">{title}</p>
      <p className="text-[12px] text-muted">{label}</p>
    </Link>
  )
}
