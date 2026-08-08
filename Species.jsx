import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Search, Play, ArrowUpDown, Table2, Network, ChevronRight, Layers,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SampleSubNav from '../components/analysis/SampleSubNav'
import CopyJson from '../components/analysis/CopyJson'
import ParamControl from '../components/analysis/ParamControl'
import { ErrorState, EmptyState, Skeleton } from '../components/ui/States'
import { inputClass, selectClass } from '../components/ui/Field'
import { useApi } from '../hooks/useApi'
import { getSpecies } from '../api/endpoints'
import { taxonColor, tooltipStyle } from '../lib/charts'
import { shortId } from '../lib/format'

const RANKS = ['phylum', 'class_name', 'order', 'family', 'genus', 'species']
const RANK_LABEL = {
  phylum: 'Phylum', class_name: 'Class', order: 'Order',
  family: 'Family', genus: 'Genus', species: 'Species',
}

/**
 * Species explorer. One call — GET /analysis/{id}/species — reduced three ways:
 * a per-read table, a grouped species summary, and a lineage tree.
 * All grouping happens in the browser; the backend has no aggregation endpoint.
 */
export default function Species() {
  const { id } = useParams()
  const { data, loading, error, reload } = useApi(() => getSpecies(id), [id])

  const [view, setView] = useState('grouped') // grouped | reads | tree
  const [query, setQuery] = useState('')
  const [phylum, setPhylum] = useState('all')
  const [minIdentity, setMinIdentity] = useState(0)
  const [sort, setSort] = useState({ key: 'identity_percentage', dir: 'desc' })

  const rows = data?.identified_species || []

  const phyla = useMemo(
    () => Array.from(new Set(rows.map((r) => r.phylum))).filter(Boolean).sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (phylum !== 'all' && r.phylum !== phylum) return false
      if (r.identity_percentage < minIdentity) return false
      if (!q) return true
      return RANKS.some((rank) => String(r[rank] || '').toLowerCase().includes(q))
    })
  }, [rows, query, phylum, minIdentity])

  const sortedReads = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  /** Collapse per-read rows into one row per species, with read count and identity range. */
  const grouped = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const existing = map.get(r.species)
      if (existing) {
        existing.reads += 1
        existing.minIdentity = Math.min(existing.minIdentity, r.identity_percentage)
        existing.maxIdentity = Math.max(existing.maxIdentity, r.identity_percentage)
      } else {
        map.set(r.species, {
          ...r, reads: 1,
          minIdentity: r.identity_percentage,
          maxIdentity: r.identity_percentage,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => b.reads - a.reads)
  }, [filtered])

  /** Nested lineage: phylum → class → order → family → genus → species. */
  const tree = useMemo(() => buildTree(filtered), [filtered])

  const treemapData = useMemo(
    () => grouped.map((g, i) => ({ name: g.species, size: g.reads, fill: taxonColor(i) })),
    [grouped],
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

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))

  return (
    <>
      <PageHeader
        eyebrow="Analysis"
        title="Species explorer"
        description="Every read that matched the reference database above the identity cutoff, with its full lineage."
        actions={<CopyJson data={data} />}
      />

      <SampleSubNav sampleId={id} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No identified species for this sample"
          description="Either the pipeline has not run, or no read reached the identity cutoff. Lower the cutoff and run taxonomy again."
          action={<Link to={`/analyze/${id}`}><Button icon={Play}>Open analysis runner</Button></Link>}
        />
      ) : (
        <>
          {/* --- Controls --- */}
          <Card className="mb-6">
            <CardBody className="space-y-5">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
                    placeholder="Search any rank — species, genus, family…"
                    className={`${inputClass} pl-9`} aria-label="Search taxa" />
                </div>
                <select value={phylum} onChange={(e) => setPhylum(e.target.value)}
                  className={`${selectClass} lg:w-56`} aria-label="Filter by phylum">
                  <option value="all">All phyla</option>
                  {phyla.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="flex gap-1 p-1 bg-mist rounded-xl">
                  {[
                    { key: 'grouped', label: 'Species', icon: Layers },
                    { key: 'reads', label: 'Reads', icon: Table2 },
                    { key: 'tree', label: 'Lineage', icon: Network },
                  ].map((v) => (
                    <button key={v.key} onClick={() => setView(v.key)}
                      className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-colors ${
                        view === v.key ? 'bg-paper text-ink shadow-card' : 'text-muted hover:text-ink'}`}>
                      <v.icon size={13} /> {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-sm">
                <ParamControl label="Minimum identity to display" value={minIdentity}
                  onChange={setMinIdentity} min={0} max={100} step={1} unit="%"
                  hint="Display filter only" />
              </div>

              <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-muted">
                {filtered.length} of {rows.length} reads · {grouped.length} distinct species
              </p>
            </CardBody>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="Nothing matches those filters"
              description="Lower the identity filter or clear the search."
              action={<Button variant="secondary" onClick={() => { setQuery(''); setPhylum('all'); setMinIdentity(0) }}>
                Clear filters</Button>} />
          ) : view === 'grouped' ? (
            <Card>
              <CardHeader title="Identified species" description="Reads collapsed by species name." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hair">
                      {['Species', 'Genus', 'Family', 'Class', 'Phylum', 'Reads', 'Identity'].map((h) => (
                        <th key={h} className="eyebrow text-muted px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hair">
                    {grouped.map((g) => (
                      <tr key={g.species} className="hover:bg-mist/50 transition-colors">
                        <td className="px-5 py-3.5 text-[15px] italic text-ink font-medium whitespace-nowrap">{g.species}</td>
                        <td className="px-5 py-3.5 text-[12.5px] text-muted whitespace-nowrap">{g.genus}</td>
                        <td className="px-5 py-3.5 text-[12.5px] text-muted whitespace-nowrap">{g.family}</td>
                        <td className="px-5 py-3.5 text-[12.5px] text-muted whitespace-nowrap">{g.class_name}</td>
                        <td className="px-5 py-3.5 text-[12.5px] text-muted whitespace-nowrap">{g.phylum}</td>
                        <td className="px-5 py-3 font-mono text-[13px] text-ink tabular-nums">{g.reads}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="font-mono text-[12.5px] text-teal tabular-nums">
                            {g.minIdentity === g.maxIdentity
                              ? `${g.maxIdentity}%`
                              : `${g.minIdentity}–${g.maxIdentity}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {treemapData.length > 1 && (
                <CardBody className="border-t border-hair">
                  <p className="eyebrow text-muted mb-3">Read share by species</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap data={treemapData} dataKey="size" stroke="#FFFFFF" strokeWidth={2}
                        content={<TreemapCell />}>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} reads`, '']} />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              )}
            </Card>
          ) : view === 'reads' ? (
            <Card>
              <CardHeader title="Per-read assignments" description="One row per classified sequence." />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-hair">
                      <th className="eyebrow text-muted px-5 py-3">Sequence</th>
                      {RANKS.map((rank) => (
                        <th key={rank} className="px-5 py-3">
                          <button onClick={() => toggleSort(rank)}
                            className="eyebrow text-muted hover:text-teal inline-flex items-center gap-1">
                            {RANK_LABEL[rank]} <ArrowUpDown size={10} />
                          </button>
                        </th>
                      ))}
                      <th className="px-5 py-3">
                        <button onClick={() => toggleSort('identity_percentage')}
                          className="eyebrow text-muted hover:text-teal inline-flex items-center gap-1">
                          Identity <ArrowUpDown size={10} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hair">
                    {sortedReads.map((r) => (
                      <tr key={r.sequence_id} className="hover:bg-mist/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-[11.5px] text-muted whitespace-nowrap">
                          {shortId(r.sequence_id)}
                        </td>
                        {RANKS.map((rank) => (
                          <td key={rank} className={`px-5 py-3 text-[13px] whitespace-nowrap ${
                            rank === 'species' ? 'italic text-ink font-medium' : 'text-muted'}`}>
                            {r[rank]}
                          </td>
                        ))}
                        <td className="px-5 py-3">
                          <IdentityBar value={r.identity_percentage} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader title="Taxonomic lineage"
                description="Built in the browser from the rank fields on each read." />
              <CardBody>
                <TreeNode nodes={tree} depth={0} />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </>
  )
}

function IdentityBar({ value }) {
  return (
    <span className="flex items-center gap-2 min-w-[92px]">
      <span className="flex-1 h-1.5 rounded-full bg-hair overflow-hidden">
        <span className="block h-full bg-teal" style={{ width: `${Math.min(100, value)}%` }} />
      </span>
      <span className="font-mono text-[12px] text-ink tabular-nums w-12 text-right">{value}%</span>
    </span>
  )
}

function TreemapCell({ x, y, width, height, name, fill }) {
  if (width < 2 || height < 2) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#FFFFFF" strokeWidth={2} rx={4} />
      {width > 70 && height > 26 && (
        <text x={x + 8} y={y + 18} fill="#FFFFFF" fontSize={11} fontFamily="Instrument Sans" fontStyle="italic">
          {name.length > width / 6 ? `${name.slice(0, Math.floor(width / 6))}…` : name}
        </text>
      )}
    </g>
  )
}

/** Nested lineage counts, one level per taxonomic rank. */
function buildTree(rows) {
  const root = {}
  rows.forEach((r) => {
    let level = root
    RANKS.forEach((rank) => {
      const name = r[rank] || 'Unassigned'
      level[name] = level[name] || { name, rank, count: 0, children: {} }
      level[name].count += 1
      level = level[name].children
    })
  })
  const toArray = (obj) =>
    Object.values(obj)
      .map((node) => ({ ...node, children: toArray(node.children) }))
      .sort((a, b) => b.count - a.count)
  return toArray(root)
}

function TreeNode({ nodes, depth }) {
  const [collapsed, setCollapsed] = useState({})
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-hair pl-4' : ''}>
      {nodes.map((node) => {
        const isOpen = !collapsed[node.name]
        const hasChildren = node.children.length > 0
        return (
          <li key={`${node.rank}-${node.name}`} className="py-1">
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button onClick={() => setCollapsed((c) => ({ ...c, [node.name]: isOpen }))}
                  className="text-muted hover:text-teal" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                  <ChevronRight size={13} className={isOpen ? 'rotate-90 transition-transform' : 'transition-transform'} />
                </button>
              ) : (
                <span className="w-[13px]" />
              )}
              <span className={`text-[13.5px] ${node.rank === 'species' ? 'italic text-ink font-medium' : 'text-ink'}`}>
                {node.name}
              </span>
              <Badge tone="neutral">{RANK_LABEL[node.rank]}</Badge>
              <span className="font-mono text-[11.5px] text-muted tabular-nums">{node.count}</span>
            </div>
            {hasChildren && isOpen && <TreeNode nodes={node.children} depth={depth + 1} />}
          </li>
        )
      })}
    </ul>
  )
}
