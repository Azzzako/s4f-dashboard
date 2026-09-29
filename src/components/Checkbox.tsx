interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

// Plain accessible checkbox styled to fit the dashboard.
export function Checkbox({ checked, onChange, label, disabled }: Props) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="size-4 cursor-pointer rounded border-zinc-300 text-brand-600 accent-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"
      />
      <span className="sr-only">{label}</span>
    </label>
  )
}