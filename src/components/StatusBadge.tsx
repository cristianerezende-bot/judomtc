interface Props {
  cls: 'good' | 'mid' | 'bad' | 'na'
  label: string
  className?: string
}

export default function StatusBadge({ cls, label, className = '' }: Props) {
  const c = cls === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : cls === 'mid'  ? 'bg-amber-50   border-amber-200   text-amber-800'
          : cls === 'bad'  ? 'bg-red-50     border-red-200     text-red-800'
          : 'bg-slate-50 border-slate-200 text-slate-500'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-black border ${c} ${className}`}>
      {label}
    </span>
  )
}
