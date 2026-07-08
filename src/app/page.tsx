import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getHomeData } from '@/lib/sheets'
import KpiCard from '@/components/KpiCard'
import MissingTable from '@/components/MissingTable'
import RadarChart from '@/components/RadarChart'
import DonutChart from '@/components/DonutChart'
import { Users, HeartPulse, Gauge } from 'lucide-react'

interface Props { searchParams: { categoria?: string } }
export const revalidate = 60

export default async function HomePage({ searchParams }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const data = await getHomeData(searchParams.categoria)

  const recResp = Math.max(data.totalAtletas - data.recPendentes, 0)
  const pseResp = Math.max(data.totalAtletas - data.psePendentes, 0)
  const recPct  = data.totalAtletas ? Math.round((recResp / data.totalAtletas) * 100) : 0
  const psePct  = data.totalAtletas ? Math.round((pseResp / data.totalAtletas) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1220]">
            Relatório
            {searchParams.categoria && (
              <span className="ml-2 text-base font-bold text-slate-500">
                · {searchParams.categoria}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 font-bold mt-1">
            Atualizado em {data.updatedAt || '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de atletas" value={data.totalAtletas} meta="roster do dia"
          icon={<Users size={18}/>} />
        <KpiCard label="REC pendentes" value={data.recPendentes}
          meta={`${recPct}% respondido`} icon={<HeartPulse size={18}/>}
          variant={data.recPendentes > 0 ? 'bad' : 'good'} />
        <KpiCard label="PSE pendentes" value={data.psePendentes}
          meta={`${psePct}% respondido`} icon={<Gauge size={18}/>}
          variant={data.psePendentes > 0 ? 'bad' : 'good'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-1">Adesão REC</p>
          <DonutChart percent={recPct} label="REC" variant={recPct < 70 ? 'rose' : 'emerald'} />
        </div>
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-1">Adesão PSE</p>
          <DonutChart percent={psePct} label="PSE" variant={psePct < 70 ? 'rose' : 'emerald'} />
        </div>
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-2">Radar · Perfil Bio-Psicossocial</p>
          <RadarChart values={data.radar} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MissingTable names={data.recMissing} title="REC · não responderam" />
        <MissingTable names={data.pseMissing} title="PSE · não responderam" />
      </div>
    </div>
  )
}
