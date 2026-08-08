import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Thermometer } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Field, { inputClass, selectClass } from '../components/ui/Field'
import { ErrorState } from '../components/ui/States'
import { createSample } from '../api/endpoints'
import { readError } from '../api/client'

// SampleCreate.sample_type is a free string; these are the three the backend documents.
const SAMPLE_TYPES = ['Water', 'Soil', 'Sediment']

// Suggested starting rows. The user can rename, remove or add any key —
// environmental_metadata is an open object in the backend schema.
const DEFAULT_ENV = [
  { key: 'temperature_c', value: '' },
  { key: 'ph', value: '' },
  { key: 'depth_m', value: '' },
]

export default function CreateSample() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    location: '',
    collection_date: new Date().toISOString().slice(0, 10),
    sample_type: 'Water',
  })
  const [env, setEnv] = useState(DEFAULT_ENV)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Give the sample a name you will recognise later.'
    if (!form.location.trim()) next.location = 'Record where the sample was collected.'
    if (!form.collection_date) next.collection_date = 'Select the collection date.'
    if (!form.sample_type.trim()) next.sample_type = 'Choose what was sampled.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  /** Builds environmental_metadata, dropping empty rows and converting numeric strings. */
  const buildMetadata = () => {
    const out = {}
    env.forEach(({ key, value }) => {
      const k = key.trim()
      if (!k || value === '') return
      const asNumber = Number(value)
      out[k] = value !== '' && !Number.isNaN(asNumber) ? asNumber : value
    })
    return out
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (!validate()) return
    setSaving(true)
    try {
      const created = await createSample({
        name: form.name.trim(),
        location: form.location.trim(),
        collection_date: form.collection_date,
        sample_type: form.sample_type.trim(),
        environmental_metadata: buildMetadata(),
      })
      // Straight into upload — a sample with no sequence file cannot be analysed.
      navigate(`/samples/${created.id}?created=1`)
    } catch (err) {
      setSubmitError(readError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Link to="/samples" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-teal mb-5">
        <ArrowLeft size={14} /> Back to samples
      </Link>

      <PageHeader
        eyebrow="Step 1 of 2"
        title="Register a sample"
        description="Record where and when the environmental sample was collected. You will attach its sequence file next."
      />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Collection details" description="Identifies the sample throughout the workspace." />
            <CardBody className="space-y-5">
              <Field label="Sample name" htmlFor="name" required error={errors.name}
                hint="Something specific, for example “Vembanad Lake surface water, station 3”.">
                <input id="name" className={inputClass} value={form.name}
                  onChange={(e) => set('name', e.target.value)} placeholder="Vembanad Lake surface water 01" />
              </Field>

              <Field label="Collection site" htmlFor="location" required error={errors.location}
                hint="Free text. Add coordinates if you have them — they are stored exactly as typed.">
                <input id="location" className={inputClass} value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Kumarakom, Kerala (9.6177° N, 76.4274° E)" />
              </Field>

              <div className="grid sm:grid-cols-2 gap-5">
                <Field label="Collection date" htmlFor="date" required error={errors.collection_date}>
                  <input id="date" type="date" className={inputClass} value={form.collection_date}
                    onChange={(e) => set('collection_date', e.target.value)} />
                </Field>
                <Field label="Sample type" htmlFor="type" required error={errors.sample_type}>
                  <select id="type" className={selectClass} value={form.sample_type}
                    onChange={(e) => set('sample_type', e.target.value)}>
                    {SAMPLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={Thermometer}
              title="Environmental readings"
              description="Optional. Stored alongside the sample and printed in the report."
              action={
                <Button variant="secondary" size="sm" icon={Plus}
                  onClick={() => setEnv((rows) => [...rows, { key: '', value: '' }])}>
                  Add reading
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {env.length === 0 && (
                <p className="text-[13px] text-muted">No readings recorded. Add one if you measured conditions on site.</p>
              )}
              {env.map((row, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    className={`${inputClass} font-mono text-[13px] flex-1`}
                    value={row.key}
                    placeholder="parameter_name"
                    aria-label={`Parameter name ${i + 1}`}
                    onChange={(e) =>
                      setEnv((rows) => rows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
                    }
                  />
                  <input
                    className={`${inputClass} font-mono text-[13px] w-32 sm:w-40`}
                    value={row.value}
                    placeholder="value"
                    aria-label={`Parameter value ${i + 1}`}
                    onChange={(e) =>
                      setEnv((rows) => rows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                    }
                  />
                  <button
                    onClick={() => setEnv((rows) => rows.filter((_, idx) => idx !== i))}
                    className="shrink-0 w-10 h-10 grid place-items-center rounded-xl text-muted hover:text-rust hover:bg-rust/5"
                    aria-label={`Remove reading ${i + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <p className="text-[12px] text-muted pt-1">
                Numeric values are stored as numbers, everything else as text.
              </p>
            </CardBody>
          </Card>

          {submitError && <ErrorState title="Could not save the sample" message={submitError} />}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link to="/samples" className="sm:w-auto">
              <Button variant="ghost" className="w-full">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} loading={saving} size="lg">
              {saving ? 'Saving sample' : 'Save and continue to upload'}
            </Button>
          </div>
        </div>

        {/* Live preview — shows exactly what will be sent */}
        <Card className="lg:sticky lg:top-24">
          <CardHeader title="Request preview" description="The JSON body sent to POST /samples." />
          <CardBody>
            <pre className="font-mono text-[11.5px] leading-relaxed text-muted whitespace-pre-wrap break-words">
{JSON.stringify(
  {
    name: form.name || '…',
    location: form.location || '…',
    collection_date: form.collection_date,
    sample_type: form.sample_type,
    environmental_metadata: buildMetadata(),
  },
  null,
  2,
)}
            </pre>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
