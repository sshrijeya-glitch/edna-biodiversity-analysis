/**
 * Shared chart language. One palette, one set of axis defaults, so every
 * Recharts figure in the app reads as part of the same instrument.
 */
export const CHART = {
  known: '#2FA98F',
  unknown: '#D99A4E',
  other: '#8FA6B0',
  grid: '#DDE6E9',
  axis: '#5F7C8A',
  rejected: {
    REJECTED_LENGTH: '#B5483C',
    REJECTED_QUALITY: '#D99A4E',
    REJECTED_INVALID_CHAR: '#8FA6B0',
  },
}

/** Sequential blue-green ramp for taxa series. Wraps if there are more taxa than colours. */
export const TAXA_COLORS = [
  '#2FA98F', '#4FC3A1', '#7FD4C1', '#2E7FA8', '#5AA0C4',
  '#8FBFD8', '#1F6B5B', '#3D8F9E', '#6FB3A6', '#A8CEC4',
]

export const taxonColor = (index) => TAXA_COLORS[index % TAXA_COLORS.length]

/** Unknown clusters and the catch-all bucket keep their own colours regardless of position. */
export function seriesColor(name, index) {
  if (name?.startsWith('UNKNOWN_CLUSTER_')) return CHART.unknown
  if (name === 'Unclassified_Other') return CHART.other
  return taxonColor(index)
}

export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.axis, fontSize: 11, fontFamily: '"IBM Plex Mono", monospace' },
  tickLine: false,
  axisLine: { stroke: CHART.grid },
}

/** Tooltip styling passed to every Recharts <Tooltip contentStyle=…>. */
export const tooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid #DDE6E9',
  borderRadius: 12,
  fontSize: 12,
  fontFamily: '"Instrument Sans", sans-serif',
  boxShadow: '0 8px 24px -12px rgba(10,34,48,0.28)',
  padding: '8px 12px',
}
