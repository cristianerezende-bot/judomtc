import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getHomeData, getRecHoje } from '@/lib/sheets'
import KpiCard from '@/components/KpiCard'
import MissingTable from '@/components/MissingTable'
import RadarChart from '@/components/RadarChart'
import DonutChart from '@/components/DonutChart'
import { Users, HeartPulse, Gauge, CheckCircle, AlertTriangle, TrendingDown } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

interface Props { searchParams: { categoria?: string } }
export const revalidate = 60

export default async function HomePage({ searchParams }: Props) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const data = await getHomeData(searchParams.categoria)
  const recRows = await getRecHoje(searchParams.categoria)
  
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
        <div className="bg-[#D6B25E]/10 border border-[#D6B25E]/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D6B25E] flex items-center justify-center text-white shadow-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#D6B25E] uppercase tracking-wider">Prontidão Média</div>
            <div className="text-xl font-black text-[#0B1220]">{data.readinessAvg}%</div>
          </div>
        </div>
      </div>

      {/* PAINEL DE EXCEÇÕES (DSS) */}
      {data.exceptions && data.exceptions.length > 0 && (
        <div className="card border-red-200 bg-red-50/30 overflow-hidden">
          <div className="px-4 py-2.5 bg-red-500 text-white flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="font-black text-xs uppercase tracking-wider">Atletas sob Atenção (Alertas Críticos)</span>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.exceptions.map((ex, idx) => (
              <div key={idx} className="bg-white border border-red-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-black text-sm text-[#0B1220]">{ex.atleta}</div>
                  <div className="text-[10px] font-bold text-slate-400">{ex.categoria}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-red-600">{ex.message}</div>
                  <div className="text-[10px] font-bold text-red-400">Intervir agora</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de atletas" value={data.totalAtletas} meta="roster do dia"
          icon={<Users size={18}/>} />
        <KpiCard label="REC pendentes" value={data.recPendentes}
          meta={`${recPct}% respondido`} icon={<HeartPulse size={18}/>}
          variant={data.recPendentes > 0 ? 'bad' : 'good'} />
        <KpiCard label="PSE pendentes" value={data.psePendentes}
          meta={`${psePct}% respondido`} icon={<Gauge size={18}/>}
          variant={data.psePendentes > 0 ? 'bad' : 'good'} />
        <KpiCard label="Prontidão (DSS)" value={`${data.readinessAvg}%`}
          meta="Média do grupo" icon={<TrendingDown size={18}/>} 
          variant={data.readinessAvg && data.readinessAvg < 70 ? 'mid' : 'good'} />
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

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-black/3 border-b border-black/8 flex justify-between items-center">
          <span className="font-black text-sm uppercase tracking-wider text-slate-600">Ranking de Prontidão Diária</span>
          <span className="text-[10px] font-bold text-slate-400">Ordenado por criticidade</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-black/2 border-b border-black/5">
                <th className="px-4 py-2.5 font-black">Atleta</th>
                <th className="px-4 py-2.5 font-black text-center">Score</th>
                <th className="px-4 py-2.5 font-black">Status</th>
                <th className="px-4 py-2.5 font-black">Principais Indicadores</th>
              </tr>
            </thead>
            <tbody>
              {recRows.sort((a,b) => (a.readiness || 0) - (b.readiness || 0)).map(r => (
                <tr key={r.atleta} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors">
                  <td className="px-4 py-3 font-black text-[#0B1220]">{r.atleta}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm
                        ${(r.readiness || 0) < 50 ? 'bg-red-500 text-white' : (r.readiness || 0) < 75 ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
                        {r.readiness}%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge 
                      cls={(r.readiness || 0) < 50 ? 'bad' : (r.readiness || 0) < 75 ? 'mid' : 'good'} 
                      label={(r.readiness || 0) < 50 ? 'Crítico' : (r.readiness || 0) < 75 ? 'Alerta' : 'Pronto'} 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-[10px] font-bold text-slate-500">
                      <span>PSR: {r.psr}</span>
                      <span>•</span>
                      <span>Sono: {r.sono}</span>
                      <span>•</span>
                      <span>Fadiga: {r.fadiga}</span>
                      <span>•</span>
                      <span>Dor: {r.dor}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MissingTable names={data.recMissing} title="REC · não responderam" />
        <MissingTable names={data.pseMissing} title="PSE · não responderam" />
      </div>
    </div>
  )
}
