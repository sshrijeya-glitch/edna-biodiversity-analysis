import { useState } from 'react'
import { Braces, Check } from 'lucide-react'

/**
 * Copies the exact API response behind a panel. Useful in a demo: it shows a
 * reviewer that the numbers on screen came from the backend, not from the frontend.
 */
export default function CopyJson({ data, label = 'Copy raw response' }) {
  const [copied, setCopied] = useState(false)
  if (!data) return null

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-hair
        text-[12px] font-medium text-muted hover:text-teal hover:border-teal/40 transition-colors"
      title={label}
    >
      {copied ? <Check size={13} /> : <Braces size={13} />}
      {copied ? 'Copied' : 'JSON'}
    </button>
  )
}
