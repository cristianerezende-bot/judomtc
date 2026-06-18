import type { DayRow } from '@/types'

interface Props { rows: DayRow[]; type: 'rec' | 'pse'; pct: number }

export default function AthleteTimeline({ rows, type, pct }: Props) {
  return (
    <div className="rounded-3xl bg-white border border-black/10 shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-black text-sm">{type === 'rec' ? 'REC' : 'PSE'}</span>
        <span className="pill">{pct}% adesão</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {rows.map(r => {
          const ok = type === 'rec' ? r.recOk : r.pseOk
          return (
            <div key={r.dayKey}
              className={`flex-shrink-0 w-14 rounded-2xl border p-1.5 text-center
                ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs font-black text-[#0B1220]">{r.dayBr}</div>
              <div className={`text-xs font-black mt-1
                ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {ok ? 'OK' : 'Faltou'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
