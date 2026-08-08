import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie,
} from 'recharts'
import { Play } from 'lucide-react'
import PageHeader, { SectionLabel } from '../components/ui/PageHeader'
import HeroMetric, { CompositionStrip } from '../components/ui/HeroMetric'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import SampleSubNav from '../components/analysis/SampleSubNav'
import CopyJson from '../components/analysis/CopyJson'
import { ErrorState, EmptyState, Skeleton, Notice } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { getResults } from '../api/endpoints'
import { CHART, seriesColor, tooltipStyle, axisProps } from '../charts'

/**
 * Biodiversity analytics. Reads GET /analysis/{id}/results and reshapes
 * biodiversity_metrics.taxa_abundance — every value plotted is a stored figure.
 */
export default function Biodiversity() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi(() => getResults(id), [id])

  const bio = data?.biodiversity_metrics
  const hasBiodiversity = bio && Object.keys(bio).length > 0

  const abundance = useMemo(() => {
    if (!hasBiodiversity) return []
    return Object.entries(bio.taxa_abundance || {})
      .map(([name, v]) => ({
        name,
        count: v.count,
        percentage: v.percentage ?? Number(((v.relative_abundance || 0) * 100).toFixed(2)),
        relative: v.relative_abundance,
      }))
      .sort((a, b) => b.count - a.count)
  }, [bio, hasBiodiversity])

  // Rank-abundance: taxa ordered by descending read count. Pure reshape of the data above.
  const rankAbundance = useMemo(
    () => abundance.map((t, i) => ({ rank: i + 1, name: t.name, percentage: t.percentage })),
    [abundance],
  )

  const composition = useMemo(() => {
    if (!hasBiodiversity) return []
    const known = abundance.filter((t) => !t.name.startsWith('UNKNOWN_CLUSTER_') && t.name !== 'Unclassified_Other')
    const clusters = abundance.filter((t) => t.name.startsWith('UNKNOWN_CLUSTER_'))
    const other = abundance.filter((t) => t.name === 'Unclassified_Other')
    const sum = (list) => list.reduce((acc, t) => acc + t.count, 0)
    return [
      { name: 'Identified taxa', value: sum(known), color: CHART.known },
      { name: 'Unknown clusters', value: sum(clusters), color: CHART.unknown },
      { name: 'Unclassified other', value: sum(other), color: CHART.other },
    ].filter((d) => d.value > 0)
  }, [abundance, hasBiodiversity])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }
  if (error) return <ErrorState message={error} onRetry={reload} />

  if (!hasBiodiversity) {
    return (
      <>
        <PageHeader eyebrow="Analysis" title="Biodiversity" />
        <SampleSubNav sampleId={id} />
        <EmptyState
          icon={Play}
          title="No biodiversity metrics stored for this sample"
          description="The biodiversity stage runs last in the pipeline. Run the analysis to compute richness, Shannon and Simpson."
          action={<Link to={`/analyze/${id}`}><Button icon={Play}>Run analysis</Button></Link>}
        />
      </>
    )
  }

  // Maximum possible Shannon for this richness — the reference line for evenness.
  const maxShannon = Math.log(bio.species_richness || 1)
  const evenness = maxShannon > 0 ? bio.shannon_index / maxShannon : 0

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Biodiversity"
        description="Diversity indices and relative abundance across identified taxa and unknown clusters."
        actions={<CopyJson data={bio} />}
      />

      <SampleSubNav sampleId={id} />

      <HeroMetric
        eyebrow="Shannon diversity"
        value={bio.shannon_index}
        symbol="&#8242;"
        formula={`H\u2032 = \u2212\u03A3 p\u1D62 ln(p\u1D62) \u00b7 maximum for S=${bio.species_richness} is ${maxShannon.toFixed(4)}`}
        supporting={[
          { label: 'Richness (S)', value: bio.species_richness },
          { label: 'Simpson (1\u2212D)', value: bio.simpson_index },
          { label: 'Evenness', value: `${(evenness * 100).toFixed(0)}%`, accent: true },
        ]}
      >
        <CompositionStrip segments={abundance.map((t, i) => ({
          name: t.name, value: t.count, color: seriesColor(t.name, i),
          italic: !t.name.startsWith('UNKNOWN_CLUSTER_') && t.name !== 'Unclassified_Other',
        }))} total={abundance.reduce((a, t) => a + t.count, 0)} />
      </HeroMetric>

      <div className="bg-paper rounded-2xl shadow-card p-6 mb-4">
        <p className="eyebrow text-muted">Evenness</p>
        <h3 className="mt-2 text-[18px] sm:text-[20px] font-semibold text-ink tracking-[-0.02em] leading-snug">
          {evenness >= 0.8 ? 'Reads are spread evenly across taxa'
            : evenness >= 0.5 ? 'Some taxa carry noticeably more reads than others'
            : 'A small number of taxa dominate this sample'}
        </h3>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1 h-2.5 rounded-full bg-hair overflow-hidden">
            <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min(100, evenness * 100)}%` }} />
          </div>
          <span className="font-mono text-[18px] text-ink tabular-nums">{(evenness * 100).toFixed(1)}%</span>
        </div>
        <p className="mt-4 text-[13px] text-muted leading-relaxed">
          Pielou&apos;s evenness J = H&#8242; / ln(S) = {bio.shannon_index} / {maxShannon.toFixed(4)}.
          {'\u0020'}A value near 100% means reads are distributed evenly; a low value means a few taxa
          account for most of the sample.
        </p>
      </div>

      <section className="grid lg:grid-cols-5 gap-6 mb-6">
        {/* --- Relative abundance --- */}
        <Card className="lg:col-span-3">
          <CardHeader title="Relative abundance" description="Share of passing reads assigned to each taxon or cluster." />
          <CardBody>
            <div style={{ height: Math.max(280, abundance.length * 38) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={abundance} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke={CHART.grid} />
                  <XAxis type="number" unit="%" {...axisProps} />
                  <YAxis type="category" dataKey="name" width={168} {...axisProps}
                    tick={{ ...axisProps.tick, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(47,169,143,0.06)' }}
                    formatter={(value, _n, entry) => [`${value}% · ${entry.payload.count} reads`, 'Abundance']} />
                  <Bar dataKey="percentage" radius={[0, 5, 5, 0]} barSize={15}>
                    {abundance.map((entry, i) => (
                      <Cell key={entry.name} fill={seriesColor(entry.name, i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-hair flex flex-wrap gap-x-5 gap-y-2">
              <Legend color={CHART.known} label="Identified taxon" />
              <Legend color={CHART.unknown} label="Unknown cluster" />
              <Legend color={CHART.other} label="Unclassified other" />
            </div>
          </CardBody>
        </Card>

        {/* --- Community composition --- */}
        <Card className="lg:col-span-2">
          <CardHeader title="Community composition" description="How reads divide between known and unknown." />
          <CardBody>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composition} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}
                    paddingAngle={2} strokeWidth={0}>
                    {composition.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} reads`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {composition.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <Legend color={entry.color} label={entry.name} />
                  <span className="font-mono text-[12.5px] text-muted tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* --- Rank abundance --- */}
      {rankAbundance.length > 2 && (
        <Card className="mb-6">
          <CardHeader title="Rank–abundance curve"
            description="Taxa ordered from most to least abundant. A steep drop indicates a community dominated by few taxa." />
          <CardBody>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rankAbundance} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="rank" {...axisProps} label={{ value: 'Abundance rank', position: 'insideBottom', offset: -2, fill: CHART.axis, fontSize: 11 }} />
                  <YAxis unit="%" {...axisProps} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v, _n, entry) => [`${v}%`, entry.payload.name]} />
                  <Line type="monotone" dataKey="percentage" stroke={CHART.known} strokeWidth={2}
                    dot={{ r: 3, fill: CHART.known }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      <Notice tone="warning">
        These indices describe the reads in this sample as matched against the local demo
        reference database. They are not an ecological survey of the sampling site, and
        richness includes unknown clusters, which are candidates rather than confirmed taxa.
      </Notice>
    </>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-2 text-[12.5px] text-ink">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
      {label}
    </span>
  )
}
