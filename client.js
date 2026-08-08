import axios from 'axios'

// Relative path on purpose. In development Vite proxies /api to :8000; in
// production FastAPI serves this app itself, so /api/v1 is already correct.
// Override with VITE_API_BASE_URL only if the backend lives on another host.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // taxonomy matching is synchronous pairwise alignment — give it room
})

/**
 * Turns any axios failure into a plain, readable string.
 * FastAPI puts human-readable messages in response.data.detail.
 */
export function readError(error) {
  if (error.response) {
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
    return `Request failed with status ${error.response.status}.`
  }
  if (error.code === 'ECONNABORTED') return 'The request timed out. The analysis may still be running on the server.'
  return 'Cannot reach the backend. Start it with `python run.py` from the backend folder.'
}