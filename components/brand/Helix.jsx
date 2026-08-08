/**
 * Signature motif: a double helix drawn to real proportions.
 *
 * B-form DNA has a pitch of about 3.4 nm and a diameter of about 2 nm, so one
 * full turn is roughly 1.7x the width of the molecule. `pitchRatio` holds that
 * ratio, and the number of turns is derived from it rather than picked by eye —
 * which is what stops it looking like a coiled spring.
 *
 * Depth is conveyed by drawing each strand in short segments: segments on the
 * far side of the axis are thinner and dimmer, the near side thicker and
 * brighter, with the base-pair rungs sandwiched between the two passes.
 */
export default function Helix({
  width = 240,
  height = 900,
  pitchRatio = 1.7,
  orientation = 'vertical',
  basePairsPerTurn = 10,
  className = '',
  strandFront = '#4FC3A1',
  strandBack = '#2E7FA8',
  rungColor = '#7FD4C1',
  opacity = 0.55,
}) {
  const axisLength = orientation === 'vertical' ? height : width
  const diameter = orientation === 'vertical' ? width : height

  const amp = diameter / 2 - 3
  const mid = diameter / 2
  const turns = axisLength / (diameter * pitchRatio)
  const omega = turns * Math.PI * 2

  const steps = Math.max(80, Math.round(turns * 48))
  const project = (across, along) =>
    orientation === 'vertical' ? [across, along] : [along, across]

  const strandSegments = (phase) => {
    const segments = []
    for (let i = 0; i < steps; i++) {
      const t1 = i / steps
      const t2 = (i + 1) / steps
      const a1 = t1 * omega + phase
      const a2 = t2 * omega + phase
      const [x1, y1] = project(mid + amp * Math.sin(a1), t1 * axisLength)
      const [x2, y2] = project(mid + amp * Math.sin(a2), t2 * axisLength)
      const depth = (Math.cos(a1) + Math.cos(a2)) / 2
      segments.push({ x1, y1, x2, y2, depth })
    }
    return segments
  }

  const strandA = strandSegments(0)
  const strandB = strandSegments(Math.PI)

  const rungCount = Math.max(4, Math.round(turns * basePairsPerTurn))
  const rungs = Array.from({ length: rungCount }, (_, i) => {
    const t = (i + 0.5) / rungCount
    const a = t * omega
    const [x1, y1] = project(mid + amp * Math.sin(a), t * axisLength)
    const [x2, y2] = project(mid + amp * Math.sin(a + Math.PI), t * axisLength)
    const spread = Math.abs(Math.sin(a))
    return { x1, y1, x2, y2, o: 0.1 + spread * 0.55 }
  })

  const draw = (segments, near, color, keyPrefix) =>
    segments
      .filter((s) => (near ? s.depth >= 0 : s.depth < 0))
      .map((s, i) => (
        <line
          key={`${keyPrefix}-${i}`}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={color}
          strokeWidth={1.1 + 1.1 * ((s.depth + 1) / 2)}
          strokeOpacity={0.35 + 0.65 * ((s.depth + 1) / 2)}
          strokeLinecap="round"
        />
      ))

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ opacity }}
    >
      {draw(strandA, false, strandBack, 'ab')}
      {draw(strandB, false, strandBack, 'bb')}

      {rungs.map((r, i) => (
        <line
          key={`r-${i}`}
          x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
          stroke={rungColor} strokeWidth="1" strokeOpacity={r.o}
        />
      ))}

      {draw(strandA, true, strandFront, 'af')}
      {draw(strandB, true, strandFront, 'bf')}
    </svg>
  )
}