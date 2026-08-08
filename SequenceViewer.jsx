import { useState } from 'react'
import { Copy, Check, ChevronDown } from 'lucide-react'

const BASE_COLOR = {
  A: 'text-[#2FA98F]',
  C: 'text-[#2E7FA8]',
  G: 'text-[#96652A]',
  T: 'text-[#B5483C]',
  N: 'text-muted',
}

/**
 * Monospace nucleotide viewer with base colouring and 10-base grouping,
 * the way a sequence is actually read. Long sequences collapse by default.
 */
export default function SequenceViewer({ sequence = '', collapsedLines = 2, label }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const clean = (sequence || '').toUpperCase()
  const perLine = 60
  const lines = []
  for (let i = 0; i < clean.length; i += perLine) lines.push(clean.slice(i, i + perLine))
  const visible = expanded ? lines : lines.slice(0, collapsedLines)

  const copy = async () => {
    await navigator.clipboard.writeText(clean)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="rounded-xl border border-hair bg-mist/50 overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-hair bg-paper">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
          {label || `${clean.length} bp`}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted hover:text-teal"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="px-3.5 py-3 overflow-x-auto">
        {visible.map((line, li) => (
          <div key={li} className="flex gap-3 items-baseline">
            <span className="font-mono text-[10.5px] text-muted/60 w-10 text-right shrink-0 tabular-nums">
              {li * perLine + 1}
            </span>
            <span className="font-mono text-[12.5px] tracking-[0.06em] whitespace-pre">
              {line.match(/.{1,10}/g)?.map((chunk, ci) => (
                <span key={ci} className="mr-2">
                  {chunk.split('').map((base, bi) => (
                    <span key={bi} className={BASE_COLOR[base] || 'text-ink'}>{base}</span>
                  ))}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {lines.length > collapsedLines && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-hair
            text-[12px] font-medium text-muted hover:text-teal hover:bg-paper transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${lines.length} lines`}
          <ChevronDown size={13} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      )}
    </div>
  )
}
