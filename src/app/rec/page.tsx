import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getRoster, getRecHoje } from '@/lib/sheets'
import { normName } from '@/lib/utils'
import MissingTable from '@/components/MissingTable'
import StatusBadge from '@/components/StatusBadge'

interface Props { searchParams: { categoria?: string } }
export const revalidate = 60

function clsPSR(v: number | null) {
  if (v === null) return 'na' as const
  return v <= 3 ? 'bad' : v <= 6 ? 'mid' : 'good' as const
}
function cls05(v: number | null) {
  if (v === null) return 'na' as const
  return v <= 1.5 ? 'bad' : v <= 3 ? 'mid' : 'good' as const
}
function clsBE(v: number | null) {
  if (v === null) return 'na' as const
  return v < 15 ? 'bad' : v < 20 ? 'mid' : 'good' as const
}
const fv = (v: number | null) => v !== null ? v.toFixed(1) : '—'

export default async function RecPage({ searchParams }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const categoria = searchParams.categoria
  const roster  = await getRoster(categoria)
  const recRows = await getRecHoje(categoria)
  const recSet  = new Set(recRows.map(r => normName(r.atleta)))
  const missing = roster.map(e => e.nome).filter(n => !recSet.has(normName(n)))
  const pct     = roster.length ? Math.round((recRows.length / roster.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-[#0B1220]">Recuperação · Hoje</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">PSR 0–10 · demais 0–5</p>
        </div>
        <span className="pill">Respondido: {pct}%</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Respondidos', value: recRows.length },
          { label: 'Faltantes',   value: missing.length },
          { label: 'Percentual',  value: `${pct}%` },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="text-xs font-black text-slate-500">{k.label}</div>
            <div className="text-3xl font-black text-[#0B1220] mt-2">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 card">
          <div className="px-4 py-3 bg-black/3 border-b border-black/8 font-black text-sm">
            Quem respondeu
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/3">
                  {['Atleta','PSR','BE','Dor','Fadiga','Estresse','Humor','Sono'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black text-slate-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recRows.map(r => (
                  <tr key={r.atleta} className="border-t border-black/6">
                    <td className="px-3 py-2 font-black whitespace-nowrap">{r.atleta}</td>
                    <td className="px-3 py-2"><StatusBadge cls={clsPSR(r.psr)}   label={fv(r.psr)}    /></td>
                    <td className="px-3 py-2"><StatusBadge cls={clsBE(r.be)}     label={fv(r.be)}     /></td>
                    <td className="px-3 py-2"><StatusBadge cls={cls05(r.dor)}    label={fv(r.dor)}    /></td>
                    <td className="px-3 py-2"><StatusBadge cls={cls05(r.fadiga)} label={fv(r.fadiga)} /></td>
                    <td className="px-3 py-2"><StatusBadge cls={cls05(r.stress)} label={fv(r.stress)} /></td>
                    <td className="px-3 py-2"><StatusBadge cls={cls05(r.humor)}  label={fv(r.humor)}  /></td>
                    <td className="px-3 py-2"><StatusBadge cls={cls05(r.sono)}   label={fv(r.sono)}   /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <MissingTable names={missing} title="Faltantes · REC" />
      </div>
    </div>
  )
}
