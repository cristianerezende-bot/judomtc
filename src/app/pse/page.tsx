import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getRoster, getPseHoje } from '@/lib/sheets'
import { normName } from '@/lib/utils'
import MissingTable from '@/components/MissingTable'
import StatusBadge from '@/components/StatusBadge'

interface Props { searchParams: { categoria?: string } }
export const revalidate = 60

function clsPSE(v: number | null) {
  if (v === null) return 'na' as const
  return v > 6 ? 'bad' : v > 4 ? 'mid' : 'good' as const
}

export default async function PsePage({ searchParams }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const categoria = searchParams.categoria
  const roster  = await getRoster(categoria)
  const pseRows = await getPseHoje(categoria)
  const pseSet  = new Set(pseRows.map(r => normName(r.atleta)))
  const missing = roster.map(e => e.nome).filter(n => !pseSet.has(normName(n)))
  const pct     = roster.length ? Math.round((pseRows.length / roster.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-black text-[#0B1220]">PSE · Hoje</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">Manhã / Tarde · maior = pior</p>
        </div>
        <span className="pill">Respondido: {pct}%</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 card overflow-auto">
          <div className="px-4 py-3 bg-black/3 border-b border-black/8 font-black text-sm">
            PSE por atleta
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/3">
                {['Atleta','PSE Manhã','PSE Tarde'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-black text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map(({ nome }) => {
                const row = pseRows.find(r => normName(r.atleta) === normName(nome))
                return (
                  <tr key={nome} className="border-t border-black/6">
                    <td className="px-3 py-2 font-black">{nome}</td>
                    <td className="px-3 py-2">
                      <StatusBadge cls={clsPSE(row?.pseManha ?? null)}
                        label={row?.pseManha != null ? String(Math.round(row.pseManha)) : '—'} />
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge cls={clsPSE(row?.pseTarde ?? null)}
                        label={row?.pseTarde != null ? String(Math.round(row.pseTarde)) : '—'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <MissingTable names={missing} title="Faltantes · PSE" />
      </div>
    </div>
  )
}
