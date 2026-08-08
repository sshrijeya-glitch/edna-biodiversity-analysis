/**
 * Ecosystem assessment layer.
 *
 * READ THIS BEFORE CHANGING ANYTHING HERE.
 *
 * The backend stores taxonomy, read counts and diversity indices. It does NOT
 * store conservation status, pollution levels or ecosystem health. Everything in
 * this file is one of two things:
 *
 *   1. A calculation over data the backend really returned  → tagged 'measured'
 *   2. A published threshold applied to a user-entered reading, or a static
 *      reference table shipped with this frontend            → tagged 'interpreted'
 *                                                              or 'reference'
 *
 * Every finding carries its layer so the UI can label it. Nothing here should
 * ever be presented as a measurement the platform made of the environment.
 */

// ---------------------------------------------------------------------------
// Conservation status — STATIC TABLE, NOT A LIVE IUCN LOOKUP
// ---------------------------------------------------------------------------
// Covers the taxa seeded in the backend's demo reference database
// (app/services/seed_service.py). Species outside this table return null and
// the UI says so rather than guessing.
//
// VERIFY THESE AT https://www.iucnredlist.org BEFORE PRESENTING THEM.
// Listings are revised periodically and several of these are assessed globally
// while regional populations differ.
export const IUCN_REFERENCE = {
  'Panthera tigris': {
    status: 'EN', label: 'Endangered', severity: 'high',
    note: 'Global listing. Regional subspecies assessments differ.',
  },
  'Gadus morhua': {
    status: 'VU', label: 'Vulnerable', severity: 'medium',
    note: 'Atlantic cod. Historic stock collapse in the Northwest Atlantic.',
  },
  'Salmo salar': {
    status: 'LC', label: 'Least concern', severity: 'low',
    note: 'Global listing; several regional populations are assessed separately and more severely.',
  },
  'Daphnia magna': {
    status: 'NE', label: 'Not evaluated', severity: 'none',
    note: 'Widespread freshwater cladoceran. Commonly used as a toxicity test organism.',
  },
  'Escherichia coli': {
    status: 'NE', label: 'Not evaluated', severity: 'none',
    note: 'Not a conservation target. Routinely used as a faecal contamination indicator.',
  },
}

export const lookupConservation = (species) => IUCN_REFERENCE[species] || null

// ---------------------------------------------------------------------------
// Indicator organisms — established ecological meaning, not a claim about a site
// ---------------------------------------------------------------------------
export const INDICATOR_TAXA = {
  'Escherichia coli': {
    meaning: 'Standard indicator of faecal contamination in water quality monitoring.',
    caution: 'Detection in eDNA indicates DNA presence, not viable cells or a quantified count. Confirm with a culture-based or qPCR method before drawing conclusions.',
    severity: 'medium',
  },
  'Daphnia magna': {
    meaning: 'Sensitive to metals and organic pollutants; often used in ecotoxicology.',
    caution: 'Presence alone does not indicate water quality. Abundance trends across repeat samples would.',
    severity: 'low',
  },
}

// ---------------------------------------------------------------------------
// Environmental parameter ranges
// ---------------------------------------------------------------------------
// Indicative general ranges for freshwater aquatic life, drawn from commonly
// published guidance. TREAT AS APPROXIMATE. Verify against CPCB (India) or the
// relevant national standard for the water body being sampled — acceptable
// ranges differ by water class, season and designated use.
export const PARAMETER_RANGES = {
  ph: {
    label: 'pH', unit: '',
    ok: [6.5, 8.5],
    describe: (v) =>
      v < 6.5 ? 'Below the commonly cited range for freshwater aquatic life; acidification stress is possible.'
      : v > 8.5 ? 'Above the commonly cited range; can indicate algal bloom activity or industrial input.'
      : 'Within the commonly cited range for freshwater aquatic life.',
  },
  dissolved_oxygen_mg_l: {
    label: 'Dissolved oxygen', unit: ' mg/L',
    ok: [5, 14],
    describe: (v) =>
      v < 3 ? 'Severely low. Widely regarded as hypoxic and stressful or lethal for most fish.'
      : v < 5 ? 'Below the level usually cited as supporting healthy fish populations.'
      : 'Adequate for most freshwater aquatic life by commonly cited guidance.',
  },
  temperature_c: {
    label: 'Temperature', unit: ' °C',
    ok: [10, 32],
    describe: (v) =>
      v > 32 ? 'High. Many freshwater fish experience thermal stress above roughly this point, and warm water holds less oxygen.'
      : v < 10 ? 'Low. Metabolic activity and detectable eDNA shedding both decline in cold water.'
      : 'Within a range tolerated by most freshwater aquatic life.',
  },
  turbidity_ntu: {
    label: 'Turbidity', unit: ' NTU',
    ok: [0, 25],
    describe: (v) =>
      v > 25 ? 'Elevated. High suspended solids reduce light penetration and can inhibit eDNA recovery.'
      : 'Low to moderate suspended solids.',
  },
}

/** Interprets whichever recognised parameters the user actually entered. Unknown keys are skipped. */
export function assessParameters(environmentalMetadata = {}) {
  return Object.entries(environmentalMetadata)
    .map(([key, value]) => {
      const spec = PARAMETER_RANGES[key]
      if (!spec || typeof value !== 'number') return null
      const [lo, hi] = spec.ok
      const withinRange = value >= lo && value <= hi
      return {
        key, value, label: spec.label, unit: spec.unit,
        range: `${lo}–${hi}${spec.unit}`,
        withinRange,
        severity: withinRange ? 'none' : 'medium',
        description: spec.describe(value),
      }
    })
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Community structure — computed entirely from backend results
// ---------------------------------------------------------------------------

/** Pielou's evenness: J = H' / ln(S). Standard ecological index. */
export function evenness(shannon, richness) {
  if (!richness || richness <= 1) return null
  return shannon / Math.log(richness)
}

/**
 * Turns the stored analysis into structured findings.
 * Thresholds below are presentation conventions chosen for this prototype, not
 * standards — each finding states the number it was derived from so a reader can
 * disagree with the threshold and still see the data.
 */
export function assessCommunity({ biodiversity, taxonomy, totalReads }) {
  const findings = []
  if (!biodiversity || !Object.keys(biodiversity).length) return findings

  const abundance = Object.entries(biodiversity.taxa_abundance || {})
    .map(([name, v]) => ({ name, count: v.count, percentage: v.percentage ?? (v.relative_abundance || 0) * 100 }))
    .sort((a, b) => b.count - a.count)

  const j = evenness(biodiversity.shannon_index, biodiversity.species_richness)

  if (j !== null) {
    findings.push({
      id: 'evenness',
      severity: j < 0.5 ? 'medium' : 'none',
      title: j < 0.5 ? 'Community is unevenly distributed' : 'Reads are spread relatively evenly across taxa',
      detail: `Pielou's evenness J = H′ / ln(S) = ${biodiversity.shannon_index} / ${Math.log(biodiversity.species_richness).toFixed(4)} = ${j.toFixed(3)}. Values below 0.5 mean a small number of taxa account for most reads.`,
    })
  }

  const dominant = abundance[0]
  if (dominant && dominant.percentage >= 50) {
    findings.push({
      id: 'dominance',
      severity: dominant.percentage >= 75 ? 'high' : 'medium',
      title: `One group accounts for ${dominant.percentage.toFixed(1)}% of reads`,
      detail: `${dominant.name} carries ${dominant.count} of ${totalReads} reads. Strong single-taxon dominance can reflect a genuine bloom, a sampling artefact, or PCR bias — repeat sampling is the only way to tell them apart.`,
    })
  }

  const unknownShare = taxonomy?.total_analyzed
    ? (taxonomy.unknown_count / taxonomy.total_analyzed) * 100
    : 0
  if (unknownShare >= 40) {
    findings.push({
      id: 'reference-gap',
      severity: unknownShare >= 70 ? 'high' : 'medium',
      title: `${unknownShare.toFixed(1)}% of reads matched nothing in the reference database`,
      detail: `${taxonomy.unknown_count} of ${taxonomy.total_analyzed} reads fell below the identity cutoff. With a reference database this small, a high unclassified share almost always means the reference set is incomplete rather than that novel organisms were found.`,
    })
  }

  if (biodiversity.species_richness <= 3) {
    findings.push({
      id: 'low-richness',
      severity: 'medium',
      title: `Only ${biodiversity.species_richness} distinct groups detected`,
      detail: 'Low richness may reflect a degraded community, a small reference database, shallow sequencing depth, or all three. It is not on its own evidence of ecosystem stress.',
    })
  }

  return findings
}

/** Recommendations follow from the findings, and each names the finding it answers. */
export function buildRecommendations({ findings, parameterFindings, indicatorHits, conservationHits }) {
  const recs = []

  if (findings.some((f) => f.id === 'reference-gap')) {
    recs.push({
      priority: 'high',
      action: 'Expand the reference barcode database',
      rationale: 'A large unclassified fraction limits every downstream conclusion. Adding regionally relevant COI, 16S and 18S barcodes will reclassify reads currently sitting in unknown clusters.',
    })
  }
  if (findings.some((f) => f.id === 'dominance' || f.id === 'evenness')) {
    recs.push({
      priority: 'medium',
      action: 'Collect replicate samples at this site',
      rationale: 'A single sample cannot separate a real ecological signal from sampling or amplification bias. Three or more replicates across the same site and season would.',
    })
  }
  if (indicatorHits.length > 0) {
    recs.push({
      priority: 'high',
      action: 'Confirm indicator detections with a targeted method',
      rationale: 'eDNA reports DNA presence, not viable organisms or concentrations. Culture-based testing or qPCR is needed before any contamination claim.',
    })
  }
  if (parameterFindings.some((p) => !p.withinRange)) {
    recs.push({
      priority: 'medium',
      action: 'Re-measure the out-of-range parameters on site',
      rationale: 'Environmental readings are entered manually and are single point-in-time values. Confirm with a calibrated probe before treating them as evidence.',
    })
  }
  if (conservationHits.some((c) => c.severity === 'high')) {
    recs.push({
      priority: 'high',
      action: 'Report the detection to the relevant wildlife authority',
      rationale: 'A read matching a species with a threatened listing warrants verification and, if confirmed, notification to the state forest or wildlife department.',
    })
  }

  recs.push({
    priority: 'low',
    action: 'Archive the raw sequence file alongside this report',
    rationale: 'Results depend on the identity cutoff and the reference database used. Keeping the raw reads lets the analysis be repeated when either changes.',
  })

  return recs
}

/**
 * Warnings are raised only where a specific, stated condition is met, and each
 * carries the condition that triggered it. Nothing is raised on a hunch.
 */
export function buildWarnings({ indicatorHits, conservationHits, parameterFindings }) {
  const warnings = []

  indicatorHits.forEach((hit) => {
    if (hit.severity !== 'medium' && hit.severity !== 'high') return
    warnings.push({
      level: 'attention',
      title: `${hit.species} detected — indicator organism`,
      trigger: `${hit.reads} read(s) assigned at ≥ the identity cutoff`,
      detail: hit.caution,
    })
  })

  conservationHits
    .filter((c) => c.severity === 'high')
    .forEach((c) => {
      warnings.push({
        level: 'attention',
        title: `${c.species} carries a threatened listing`,
        trigger: `Reference table lists this species as ${c.label} (${c.status})`,
        detail: 'Verify the assignment against a curated barcode reference before acting on it. A match against a five-entry demo database is not a confirmed detection.',
      })
    })

  parameterFindings
    .filter((p) => !p.withinRange)
    .forEach((p) => {
      warnings.push({
        level: 'attention',
        title: `${p.label} outside the commonly cited range`,
        trigger: `Recorded ${p.value}${p.unit}, typical range ${p.range}`,
        detail: p.description,
      })
    })

  return warnings
}

export const SEVERITY_TONE = { high: 'danger', medium: 'warning', low: 'info', none: 'positive' }
