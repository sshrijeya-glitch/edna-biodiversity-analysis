/**
 * Numeric parameter with a slider and a readout. The min/max bounds mirror the
 * Pydantic Field constraints in app/schemas/schemas.py, so the UI cannot send
 * a value the backend would reject.
 */
export default function ParamControl({ label, value, onChange, min, max, step = 1, unit, hint, disabled }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[12.5px] font-medium text-ink">{label}</label>
        <span className="font-mono text-[12.5px] text-teal tabular-nums">
          {value}
          {unit && <span className="text-muted ml-0.5">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-hair accent-teal cursor-pointer disabled:opacity-50
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
          [&::-webkit-slider-thumb]:shadow-card"
      />
      <div className="flex justify-between mt-1.5">
        <span className="font-mono text-[10.5px] text-muted/70">{min}{unit}</span>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
        <span className="font-mono text-[10.5px] text-muted/70">{max}{unit}</span>
      </div>
    </div>
  )
}
