/** Labelled form control wrapper. Errors sit under the field, never as a popup. */
export default function Field({ label, htmlFor, hint, error, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-rust ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
      {error && <p className="mt-1.5 text-[12px] text-rust">{error}</p>}
    </div>
  )
}

export const inputClass =
  'w-full h-10 px-3 rounded-xl bg-mist/60 border border-hair text-sm text-ink placeholder:text-muted/60 ' +
  'focus:bg-paper focus:border-teal outline-none transition-colors'

export const selectClass = inputClass + ' appearance-none pr-9'
