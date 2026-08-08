import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Play, HelpCircle, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import StatTile from '../components/ui/StatTile'
import SampleSubNav from '../components/analysis/SampleSubNav'
import SequenceViewer from '../components/analysis/SequenceViewer'
import CopyJson from '../components/analysis/CopyJson'
import { ErrorState, EmptyState, Skeleton, Notice } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { getUnknown, getResults } from '../api/endpoints'
import { CHART, tooltipStyle, axisProps } from '../lib/charts'

/**
 * Unknown clusters. GET /analysis/{id}/unknown for the clusters themselves,
 * plus GET /analysis/{id}/results only to know the total read count so each
 * cluster's share can be shown. Both are real endpoints.
 */
export default function UnknownClusters() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi(() => getUnknown(id), [id])
  const { data: results } = useApi(() => getResults(id), [id])

  const totalReads = results?.preprocessing_summary?.total_passed_sequences || 0
  const clusters = data?.clusters || []

  const chartData = useMemo(
    () => clusters.map((c) => ({ name: c.cluster_tag.replace('UNKNOWN_CLUSTER_', 'C'), size: c.cluster_size })),
    [clusters],
  )

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

  const unknownShare = totalReads ? ((data.total_unknown_sequences / totalReads) * 100).toFixed(1) : null

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Unknown clusters"
        description="Reads that matched nothing in the reference database, grouped by 4-mer sequence profile."
        actions={<CopyJson data={data} />}
      />

      <SampleSubNav sampleId={id} />

      {data.total_unknown_sequences === 0 && clusters.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No unclassified reads for this sample"
          description="Either every read matched the reference database, or the clustering stage has not run yet."
          action={<Link to={`/analyze/${id}`}><Button icon={Play}>Open analysis runner</Button></Link>}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatTile label="Unclassified reads" value={data.total_unknown_sequences} icon={HelpCircle}
              hint="Below the identity cutoff" />
            <StatTile label="Clusters formed" value={data.total_unknown_clusters} tone="accent" />
            <StatTile label="Share of reads" value={unknownShare ?? '—'} unit={unknownShare ? '%' : ''}
              hint="Of reads that passed QC" />
          </section>

          <div className="mb-6">
            <Notice tone="warning" icon={Info}>
              <strong className="font-semibold">These are candidates, not discoveries.</strong> The backend
              labels every cluster "potential unknown taxa / unclassified sequence cluster". A read lands
              here because it did not match the small local reference database — which is a gap in the
              reference set at least as often as it is a novel organism.
            </Notice>
          </div>

          {chartData.length > 1 && (
            <Card className="mb-6">
              <CardHeader title="Cluster sizes" description="Reads grouped into each candidate cluster." />
              <CardBody>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                      <CartesianGrid stroke={CHART.grid} vertical={false} />
                      <XAxis dataKey="name" {...axisProps} />
                      <YAxis allowDecimals={false} {...axisProps} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217,154,78,0.08)' }}
                        formatter={(v) => [`${v} reads`, 'Cluster size']} />
                      <Bar dataKey="size" fill={CHART.unknown} radius={[5, 5, 0, 0]} barSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="space-y-4">
            {clusters.map((cluster) => {
              const share = totalReads ? ((cluster.cluster_size / totalReads) * 100).toFixed(1) : null
              return (
                <Card key={cluster.cluster_tag}>
                  <CardHeader
                    icon={HelpCircle}
                    title={cluster.cluster_tag}
                    description={cluster.note || cluster.label}
                    action={
                      <div className="flex items-center gap-2">
                        <Badge tone="warning">{cluster.cluster_size} reads</Badge>
                        {share && <Badge tone="neutral">{share}% of sample</Badge>}
                      </div>
                    }
                  />
                  <CardBody>
                    <p className="eyebrow text-muted mb-2.5">Representative sequence</p>
                    <SequenceViewer
                      sequence={cluster.representative_sequence}
                      label={`${cluster.representative_sequence?.length || 0} bp · longest read in cluster`}
                    />
                  </CardBody>
                </Card>
              )
            })}
          </div>

          {data.unknown_sequence_ids?.length > 0 && (
            <Card className="mt-6">
              <CardHeader title="Unclassified sequence IDs"
                description={`${data.unknown_sequence_ids.length} reads, for cross-referencing against the CSV export.`} />
              <CardBody>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {data.unknown_sequence_ids.map((sid) => (
                    <span key={sid} className="font-mono text-[11px] px-2 py-1 rounded-md bg-mist text-muted border border-hair">
                      {sid.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </>
  )
}
