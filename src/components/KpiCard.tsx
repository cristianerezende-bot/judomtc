interface Props {
  label: string
  value: string | number
  meta?: string
  icon?: React.ReactNode
  variant?: 'default' | 'good' | 'bad' | 'mid'
}

export default function KpiCard({ label, value, meta, icon, variant = 'default' }: Props) {
  const bg = variant === 'good' ? 'bg-emerald-50 border-emerald-200'
           : variant === 'bad'  ? 'bg-red-50 border-red-200'
           : variant === 'mid'  ? 'bg-amber-50 border-amber-200'
           : 'bg-white border-black/10'
  return (
    <div className={`relative rounded-3xl border shadow-lg p-4 overflow-hidden ${bg}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r
                      from-yellow-400 via-indigo-400 to-cyan-400" />
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="text-xs font-black text-slate-500 tracking-wide">{label}</div>
          <div className="text-3xl font-black text-[#0B1220] mt-2 leading-none">{value}</div>
          {meta && <div className="text-xs font-bold text-slate-400 mt-1.5">{meta}</div>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-2xl bg-black/5 border border-black/8
                          flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
