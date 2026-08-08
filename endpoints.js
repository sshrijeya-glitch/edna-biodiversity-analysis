import { api } from './client'

/**
 * One function per real backend endpoint. Nothing here is invented —
 * every path, method and field name comes from the FastAPI routers.
 * Anything the backend does not expose simply has no function here.
 */

// --- Health (routers/health.py) ---
export const getHealth = () => api.get('/health').then((r) => r.data)

// --- Samples (routers/samples.py) ---
export const listSamples = () => api.get('/samples').then((r) => r.data)
export const getSample = (sampleId) => api.get(`/samples/${sampleId}`).then((r) => r.data)
export const createSample = (payload) => api.post('/samples', payload).then((r) => r.data)

// Upload is multipart/form-data: sample_id is a Form field, file is the upload.
export const uploadSequenceFile = (sampleId, file, onProgress) => {
  const form = new FormData()
  form.append('sample_id', sampleId)
  form.append('file', file)
  return api
    .post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
    .then((r) => r.data)
}

// --- Analysis pipeline (routers/analysis.py) ---
export const runPreprocess = (sampleId, options) =>
  api.post(`/analysis/${sampleId}/preprocess`, options).then((r) => r.data)

export const runTaxonomy = (sampleId, options) =>
  api.post(`/analysis/${sampleId}/taxonomy`, options).then((r) => r.data)

export const runUnknownClustering = (sampleId, options) =>
  api.post(`/analysis/${sampleId}/unknown-clusters`, options).then((r) => r.data)

export const runBiodiversity = (sampleId) =>
  api.post(`/analysis/${sampleId}/biodiversity`).then((r) => r.data)

export const getResults = (sampleId) => api.get(`/analysis/${sampleId}/results`).then((r) => r.data)
export const getSpecies = (sampleId) => api.get(`/analysis/${sampleId}/species`).then((r) => r.data)
export const getUnknown = (sampleId) => api.get(`/analysis/${sampleId}/unknown`).then((r) => r.data)

// --- Reports (routers/reports.py) ---
// PDF is a POST that streams a file, so it must be fetched as a blob and saved manually.
export const downloadPdfReport = (sampleId) =>
  api.post(`/reports/${sampleId}/pdf`, null, { responseType: 'blob' }).then((r) => r.data)

export const downloadCsvReport = (sampleId) =>
  api.get(`/reports/${sampleId}/csv`, { responseType: 'blob' }).then((r) => r.data)

// Triggers a browser download from a blob returned by the two functions above.
export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
