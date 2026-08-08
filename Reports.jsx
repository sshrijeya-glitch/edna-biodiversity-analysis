import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, FileSpreadsheet, Download, FlaskConical, Play, Check } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { ErrorState, EmptyState, CardSkeleton, Notice } from '../components/ui/States'
import { inputClass } from '../components/ui/Field'
import { useApi } from '../hooks/useApi'
import { listSamples, downloadPdfReport, downloadCsvReport, saveBlob } from '../api/endpoints'
import { readError } from '../api/client'
import { shortId, formatDate, isSeededDemoSample } from '../lib/format'

/**
 * Report generation. Two real endpoints:
 *   POST /reports/{id}/pdf  → streams a PDF, so it must be fetched as a blob
 *   GET  /reports/{id}/csv  → streams a CSV
 * Both regenerate the file server-side on every request.
 */
export default function Reports() {
  const { data: samples, loading, error, reload } = useApi(() => listSamples(), [])
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState(searchParams.get('sample') || null)
  const [busy, setBusy] = useState(null) // 'pdf' | 'csv'
  const [downloadError, setDownloadError] = useState(null)
  const [lastDownload, setLastDownload] = useState(null)

  const sample = (samples || []).find((s) => s.id === selected)

  const download = async (kind) => {
    if (!sample) return
    setBusy(kind)
    setDownloadError(null)
    try {
      const blob = kind === 'pdf' ? await downloadPdfReport(sample.id) : await downloadCsvReport(sample.id)
      const filename = `sample_${shortId(sample.id)}_report.${kind}`
      saveBlob(blob, filename)
      setLastDownload(filename)
      setTimeout(() => setLastDownload(null), 4000)
    } catch (err) {
      // A blob-typed error response has to be read back as text before it is legible.
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          setDownloadError(parsed.detail || 'The report could not be generated.')
        } catch {
          setDownloadError('The report could not be generated. Run the analysis for this sample first.')
        }
      } else {
        setDownloadError(readError(err))
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Reports"
        description="Generate a PDF summary or export per-read results as CSV. Both are built server-side from the stored analysis."
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (samples || []).length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No samples to report on"
          description="Register a sample and run the analysis pipeline, then come back to export the results."
          action={<Link to="/samples/new"><Button>Create a sample</Button></Link>}
        />
      ) : (
        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* --- Sample picker --- */}
          <Card className="lg:col-span-2">
            <CardHeader title="Choose a sample" description={`${samples.length} available.`} />
            <CardBody className="space-y-2 max-h-[520px] overflow-y-auto">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s.id); setDownloadError(null) }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    selected === s.id
                      ? 'border-teal bg-teal/[0.04]'
                      : 'border-hair hover:border-teal/40 hover:bg-mist/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[13.5px] font-medium text-ink leading-snug">{s.name}</span>
                    {selected === s.id && <Check size={15} className="text-teal shrink-0 mt-0.5" />}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-muted">#{shortId(s.id)}</span>
                    <span className="text-[11.5px] text-muted">· {s.sample_type}</span>
                    <span className="text-[11.5px] text-muted">· {formatDate(s.collection_date)}</span>
                    {isSeededDemoSample(s) && <Badge tone="demo">Demo</Badge>}
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>

          {/* --- Export --- */}
          <div className="lg:col-span-3 space-y-6">
            {!sample ? (
              <EmptyState
                icon={FileText}
                title="Select a sample to export"
                description="Choose one from the list to generate its PDF summary or CSV export."
              />
            ) : (
              <>
                <Card>
                  <CardHeader title={sample.name} description={`${sample.sample_type} · ${sample.location}`} />
                  <CardBody className="space-y-4">
                    {downloadError && (
                      <div className="rounded-xl border border-rust/25 bg-rust/[0.04] px-4 py-3">
                        <p className="text-[13px] text-rust">{downloadError}</p>
                      </div>
                    )}
                    {lastDownload && (
                      <div className="rounded-xl border border-kelp/30 bg-kelp/[0.06] px-4 py-3 flex items-center gap-2">
                        <Check size={15} className="text-[#1F7A63]" />
                        <p className="text-[13px] text-[#1F7A63]">
                          Downloaded <span className="font-mono text-[12px]">{lastDownload}</span>
                        </p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <ExportOption
                        icon={FileText}
                        title="PDF summary"
                        contents={[
                          'Sample metadata and environmental readings',
                          'Biodiversity indices',
                          'Identified taxonomy table',
                          'Unknown cluster listing',
                        ]}
                        action={
                          <Button icon={Download} loading={busy === 'pdf'} onClick={() => download('pdf')} className="w-full">
                            {busy === 'pdf' ? 'Generating' : 'Download PDF'}
                          </Button>
                        }
                      />
                      <ExportOption
                        icon={FileSpreadsheet}
                        title="CSV export"
                        contents={[
                          'One row per classified read',
                          'Sequence header, length, GC content',
                          'Full lineage per read',
                          'Percentage identity',
                        ]}
                        action={
                          <Button variant="secondary" icon={Download} loading={busy === 'csv'}
                            onClick={() => download('csv')} className="w-full">
                            {busy === 'csv' ? 'Generating' : 'Download CSV'}
                          </Button>
                        }
                      />
                    </div>
                  </CardBody>
                </Card>

                <Notice tone="info" icon={Play}>
                  Reports are built from stored analysis results. If this sample has not been
                  analysed yet, generation will fail —{' '}
                  <Link to={`/analyze/${sample.id}`} className="underline underline-offset-2 font-medium">
                    run the pipeline first
                  </Link>
                  .
                </Notice>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ExportOption({ icon: Icon, title, contents, action }) {
  return (
    <div className="rounded-xl border border-hair p-4 flex flex-col">
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-teal/[0.10] text-teal">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <h4 className="mt-3.5 text-[14px] font-semibold text-ink">{title}</h4>
      <ul className="mt-2.5 space-y-1.5 flex-1">
        {contents.map((line) => (
          <li key={line} className="flex gap-2 text-[12.5px] text-muted leading-snug">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-teal/50 shrink-0" />
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-4">{action}</div>
    </div>
  )
}
