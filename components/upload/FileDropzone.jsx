import { useRef, useState } from 'react'
import { UploadCloud, FileText, X } from 'lucide-react'
import Button from '../ui/Button'
import { formatBytes } from '../../lib/format'

// sample_service.store_uploaded_file accepts exactly these extensions.
const ACCEPTED = ['.fasta', '.fa', '.fastq', '.fq']

/**
 * Drag-and-drop file picker. Validates the extension in the browser using the
 * same rule the backend applies, so the user gets the message before the round trip.
 * The backend accepts one file per request.
 */
export default function FileDropzone({ file, onSelect, onClear, disabled }) {
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (picked) => {
    if (!picked) return
    const ext = picked.name.slice(picked.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      setLocalError(`${ext || 'That file'} is not supported. Choose a .fasta, .fa, .fastq or .fq file.`)
      return
    }
    if (picked.size === 0) {
      setLocalError('That file is empty. The backend rejects empty uploads.')
      return
    }
    setLocalError(null)
    onSelect(picked)
  }

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-teal/30 bg-teal/[0.04] p-4">
        <span className="grid place-items-center w-11 h-11 rounded-xl bg-teal/[0.12] text-teal shrink-0">
          <FileText size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate">{file.name}</p>
          <p className="font-mono text-[11.5px] text-muted mt-0.5">
            {formatBytes(file.size)} · {file.name.toLowerCase().endsWith('q') ? 'FASTQ' : 'FASTA'}
          </p>
        </div>
        {!disabled && (
          <button onClick={onClear} className="text-muted hover:text-rust p-1" aria-label="Remove file">
            <X size={17} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-teal bg-teal/[0.06]' : 'border-hair bg-mist/40 hover:border-teal/50'
        }`}
      >
        <span className="inline-grid place-items-center w-12 h-12 rounded-xl bg-paper border border-hair text-teal mb-4">
          <UploadCloud size={22} strokeWidth={1.8} />
        </span>
        <p className="text-sm font-medium text-ink">Drop a sequence file here</p>
        <p className="mt-1.5 text-[13px] text-muted">
          or <span className="text-teal font-medium">browse your computer</span>
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted/70">
          .fasta · .fa · .fastq · .fq
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {localError && <p className="mt-2 text-[12.5px] text-rust">{localError}</p>}
    </div>
  )
}
