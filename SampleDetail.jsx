import { useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, UploadCloud, CheckCircle2, PlayCircle, MapPin, Calendar, Hash, Beaker,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import FileDropzone from '../components/upload/FileDropzone'
import { ErrorState, Notice, Skeleton } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { getSample, uploadSequenceFile } from '../api/endpoints'
import { readError } from '../api/client'
import { shortId, formatDate, formatDateTime, isSeededDemoSample } from '../lib/format'

/**
 * Sample detail + upload. The backend has no "list files for a sample" endpoint,
 * so this page shows the files uploaded during this session only, and says so.
 */
export default function SampleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const justCreated = searchParams.get('created') === '1'

  const { data: sample, loading, error, reload } = useApi(() => getSample(id), [id])

  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploaded, setUploaded] = useState([]) // files uploaded in this session

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    setProgress(0)
    try {
      const record = await uploadSequenceFile(id, file, setProgress)
      setUploaded((list) => [record, ...list])
      setFile(null)
    } catch (err) {
      setUploadError(readError(err))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={reload} title="Could not load this sample" />

  const env = sample.environmental_metadata || {}
  const envEntries = Object.entries(env)
  const isDemo = isSeededDemoSample(sample)

  return (
    <>
      <Link to="/samples" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-teal mb-5">
        <ArrowLeft size={14} /> Back to samples
      </Link>

      <PageHeader
        eyebrow={justCreated ? 'Step 2 of 2' : 'Sample'}
        title={sample.name}
        description="Attach the FASTA or FASTQ file produced by sequencing this sample, then run the analysis pipeline."
        actions={
          <Link to={`/analyze/${sample.id}`}>
            <Button icon={PlayCircle} variant={uploaded.length ? 'primary' : 'secondary'}>
              Run analysis
            </Button>
          </Link>
        }
      />

      {justCreated && (
        <div className="mb-6">
          <Notice tone="info" icon={CheckCircle2}>
            Sample saved. Upload its sequence file below — preprocessing needs at least one file.
          </Notice>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* --- Upload --- */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              icon={UploadCloud}
              title="Sequence file"
              description="One file per upload. Add more by uploading again."
            />
            <CardBody className="space-y-4">
              <FileDropzone
                file={file}
                onSelect={setFile}
                onClear={() => setFile(null)}
                disabled={uploading}
              />

              {uploading && (
                <div>
                  <div className="flex justify-between font-mono text-[11.5px] text-muted mb-1.5">
                    <span>Uploading</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-hair overflow-hidden">
                    <div className="h-full bg-teal transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="rounded-xl border border-rust/25 bg-rust/[0.04] px-4 py-3">
                  <p className="text-[13px] text-rust">{uploadError}</p>
                </div>
              )}

              {file && !uploading && (
                <div className="flex justify-end">
                  <Button onClick={handleUpload} icon={UploadCloud}>Upload file</Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Uploaded this session"
              description="The backend does not expose a per-sample file list, so only uploads made in this browser session appear here."
            />
            <CardBody>
              {uploaded.length === 0 ? (
                <p className="text-[13px] text-muted">
                  {isDemo
                    ? 'This seeded demo sample already has a FASTA file attached on the server. It will be picked up when you run the analysis.'
                    : 'Nothing uploaded yet in this session.'}
                </p>
              ) : (
                <ul className="divide-y divide-hair -my-2">
                  {uploaded.map((f) => (
                    <li key={f.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-ink truncate">{f.filename}</p>
                        <p className="font-mono text-[11.5px] text-muted mt-0.5">
                          {f.file_type} · {formatDateTime(f.upload_date)}
                        </p>
                      </div>
                      <Badge tone="positive">{f.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {uploaded.length > 0 && (
            <div className="flex justify-end">
              <Button size="lg" icon={PlayCircle} onClick={() => navigate(`/analyze/${sample.id}`)}>
                Continue to analysis
              </Button>
            </div>
          )}
        </div>

        {/* --- Metadata --- */}
        <Card className="lg:sticky lg:top-24">
          <CardHeader title="Sample metadata" />
          <CardBody className="space-y-4">
            {isDemo && <Badge tone="demo" icon={Beaker}>Seeded demo sample</Badge>}

            <dl className="space-y-3.5">
              <div className="flex gap-3">
                <Hash size={14} className="text-muted mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="eyebrow text-muted">Sample ID</dt>
                  <dd className="font-mono text-[12.5px] text-ink mt-1 break-all">{sample.id}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={14} className="text-muted mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <dt className="eyebrow text-muted">Collection site</dt>
                  <dd className="text-[13px] text-ink mt-1">{sample.location}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Calendar size={14} className="text-muted mt-0.5 shrink-0" />
                <div>
                  <dt className="eyebrow text-muted">Collected</dt>
                  <dd className="text-[13px] text-ink mt-1">{formatDate(sample.collection_date)}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Beaker size={14} className="text-muted mt-0.5 shrink-0" />
                <div>
                  <dt className="eyebrow text-muted">Sample type</dt>
                  <dd className="text-[13px] text-ink mt-1">{sample.sample_type}</dd>
                </div>
              </div>
            </dl>

            {envEntries.length > 0 && (
              <div className="pt-4 border-t border-hair">
                <p className="eyebrow text-muted mb-3">Environmental readings</p>
                <dl className="space-y-2">
                  {envEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3 font-mono text-[12px]">
                      <dt className="text-muted uppercase tracking-[0.06em]">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-ink text-right break-all">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <p className="pt-3 text-[11.5px] text-muted font-mono">#{shortId(sample.id)}</p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
