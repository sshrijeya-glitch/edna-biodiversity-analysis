/** Small display helpers. No business logic lives here. */

export const shortId = (id) => (id ? String(id).slice(0, 8) : '—')

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The backend seeds one demo sample at startup (services/seed_service.py).
 * Its name begins with DEMO_, so the UI can label it honestly instead of
 * letting a judge mistake seeded data for a real field collection.
 */
export const isSeededDemoSample = (sample) => Boolean(sample?.name?.startsWith('DEMO_'))

/** Which pipeline stage a sample has reached, derived from GET /analysis/{id}/results. */
export function deriveStage(results) {
  if (!results) return 'created'
  const passed = results.preprocessing_summary?.total_passed_sequences || 0
  const analyzed = results.taxonomy_summary?.total_analyzed || 0
  const hasBiodiversity = Boolean(
    results.biodiversity_metrics && Object.keys(results.biodiversity_metrics).length,
  )
  if (hasBiodiversity) return 'complete'
  if (analyzed > 0) return 'classified'
  if (passed > 0) return 'preprocessed'
  return 'created'
}

export const STAGE_LABEL = {
  created: 'Awaiting analysis',
  preprocessed: 'Preprocessed',
  classified: 'Taxonomy assigned',
  complete: 'Analysis complete',
}

export const STAGE_TONE = {
  created: 'neutral',
  preprocessed: 'info',
  classified: 'info',
  complete: 'positive',
}
