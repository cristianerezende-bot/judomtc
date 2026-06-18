'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AthleteTimeline from '@/components/AthleteTimeline'
import StatusBadge from '@/components/StatusBadge'
import type { AthleteReport } from '@/types'
import { fmt, getACWRStatus } from '@/lib/utils'
import { TrendingUp, AlertCircle, Activity, Heart } from 'lucide-react'

import TrendChart from '@/components/TrendChart'
import BarChart from '@/components/BarChart'
import RadarChart from '@/components/RadarChart'

export default function AtletaPage() {
  const searchParams = useSearchParams()
  const categoria = searchParams.get('categoria') ?? ''

  const [roster, setRoster]   = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [report, setReport]   = useState<AthleteReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const url = categoria
      ? `/api/rec?categoria=${encodeURIComponent(categoria)}`
      : '/api/rec'
    fetch(url).then(r => r.json()).then(d => {
      const names = [
        ...new Set([
          ...(d.rowsToday ?? []).map((r: {atleta:string}) => r.atleta),
          ...(d.missingToday ?? []),
        ])
      ].sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'))
      setRoster(names)
      if (names.length && !selected) setSelected(names[0])
    })
  }, [categoria])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/atleta?atleta=${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(d => { setReport(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  const ad = report?.adherence
  const lastRow = report?.rows.at(-1)
  
  // Radar data do atleta selecionado
  const individualRadar = lastRow ? [
    lastRow.sono ?? 0,
    lastRow.stress ?? 0,
    lastRow.fadiga ?? 0,
    lastRow.dor ?? 0,
    lastRow.humor ?? 0
  ] : [0,0,0,0,0]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0B1220]">Relatório</h1>
        </div>
        {categoria && <span className="pill bg-[#0B1220] text-white border-none">{categoria}</span>}
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap shadow-sm border-black/5 bg-white/50 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-xl bg-[#D6B25E] flex items-center justify-center text-white shadow-lg shadow-[#D6B25E]/20">
          <Activity size={20} />
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase">Selecione o Atleta</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full border-none p-0 text-lg font-black bg-transparent outline-none cursor-pointer text-[#0B1220]">
            {roster.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="card p-12 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#D6B25E] border-t-transparent rounded-full animate-spin"></div>
          Processando Big Data e Biomecânica…
        </div>
      )}

      {!loading && report && (
        <>
          {/* TOP CARDS: EXECUTIVE SUMMARY */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="card p-5 bg-white border-t-4 border-t-[#D6B25E]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prontidão (IP 4.0)</span>
                <div className="flex items-end gap-2 mt-1">
                  <div className="text-4xl font-black text-[#0B1220]">{lastRow?.readiness ?? '—'}%</div>
                  <div className="mb-1">
                    <StatusBadge 
                      cls={(lastRow?.readiness || 0) < 50 ? 'bad' : (lastRow?.readiness || 0) < 75 ? 'mid' : 'good'} 
                      label=""
                    />
                  </div>
                </div>
                <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Activity size={10} /> Status: {(lastRow?.readiness || 0) < 50 ? 'Risco Elevado' : (lastRow?.readiness || 0) < 75 ? 'Atenção' : 'Excelente'}
                </div>
             </div>

             <div className="card p-5 bg-white border-t-4 border-t-emerald-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga (ACWR)</span>
                <div className="flex items-end gap-2 mt-1">
                  <div className="text-4xl font-black text-[#0B1220]">{fmt(lastRow?.ac ?? null, 2)}</div>
                  <TrendingUp size={18} className={getACWRStatus(lastRow?.ac ?? null) === 'good' ? 'text-emerald-500' : 'text-amber-500'} />
                </div>
                <div className="mt-3">
                  <StatusBadge 
                    cls={getACWRStatus(lastRow?.ac ?? null)} 
                    label={getACWRStatus(lastRow?.ac ?? null) === 'good' ? 'Zona Ideal (Safe)' : 'Revisar Volume'}
                  />
                </div>
             </div>

             <div className="card p-5 bg-white border-t-4 border-t-blue-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adesão (14 Dias)</span>
                <div className="text-4xl font-black text-[#0B1220] mt-1">{ad?.rec14Pct}%</div>
                <div className="mt-3 flex items-center justify-between">
                   <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden mr-2">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${ad?.rec14Pct}%` }}></div>
                   </div>
                   <span className="text-[10px] font-black text-blue-500">{ad?.rec14Pct >= 90 ? 'META OK' : 'BAIXA'}</span>
                </div>
             </div>

             <div className="card p-5 bg-white border-t-4 border-t-purple-500">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga Acumulada</span>
                <div className="text-4xl font-black text-[#0B1220] mt-1">{Math.round(lastRow?.workload || 0)}</div>
                <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                  <Activity size={10} /> Unidades Arbitrárias
                </div>
             </div>
          </div>

          {/* VISUALIZAÇÃO DE TENDÊNCIAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#D6B25E]" />
                    Evolução da Prontidão (Últimos 14 Dias)
                  </h3>
                </div>
                <TrendChart data={report.rows} dataKey="readiness" label="Prontidão" />
              </div>

              <div className="card p-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    Carga Interna Diária (UA)
                  </h3>
                </div>
                <BarChart data={report.rows} dataKey="workload" label="Carga" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 bg-[#0B1220] text-white flex flex-col items-center">
                <h3 className="font-black text-sm uppercase tracking-wider mb-6 text-slate-400 self-start">
                  Radar de Bem-Estar
                </h3>
                <div className="w-full aspect-square">
                  <RadarChart values={individualRadar} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 w-full text-[10px] font-black uppercase text-slate-400">
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Sono</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Stress</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Fadiga</div>
                   <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Dor</div>
                </div>
              </div>
              
              <div className="card p-6 bg-white">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-600 mb-4">
                  Check-in Semanal
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Recuperação</span>
                    <span className="font-black text-[#0B1220]">{ad?.rec7Ok} / 7 dias</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">PSE Treino</span>
                    <span className="font-black text-[#0B1220]">{ad?.pse7Ok} / 7 dias</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase">Alertas Ativos</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {lastRow?.dor && lastRow.dor > 3 ? `Relatou dor nível ${lastRow.dor} em ${lastRow.localDor}` : 'Nenhum alerta crítico de dor hoje.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DETALHADA NO FINAL */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-black/5 flex justify-between items-center">
               <span className="font-black text-sm uppercase tracking-wider text-slate-600">Log de Monitoramento Detalhado</span>
               <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Pronto
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Risco
                  </div>
               </div>
            </div>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-black/5 text-slate-400 text-left uppercase tracking-tighter">
                    <th className="px-6 py-3 font-black">Data</th>
                    <th className="px-6 py-3 font-black text-center">Prontidão</th>
                    <th className="px-6 py-3 font-black text-center">ACWR</th>
                    <th className="px-6 py-3 font-black text-center">PSR</th>
                    <th className="px-6 py-3 font-black text-center">Sono</th>
                    <th className="px-6 py-3 font-black text-center">Fadiga</th>
                    <th className="px-6 py-3 font-black text-center">Dor</th>
                    <th className="px-6 py-3 font-black text-center">Carga (UA)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.rows].reverse().map(r => (
                    <tr key={r.dayKey} className="border-b border-black/5 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-black text-[#0B1220]">{r.dayBr}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-1 rounded-md font-black text-white text-[10px]
                          ${(r.readiness || 0) < 50 ? 'bg-red-500 shadow-sm shadow-red-200' : (r.readiness || 0) < 75 ? 'bg-amber-400' : 'bg-emerald-500'}`}>
                          {r.readiness || '—'}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center font-bold text-slate-600">{fmt(r.ac, 2)}</td>
                      <td className="px-6 py-3 text-center text-slate-500">{r.psr ?? '—'}</td>
                      <td className="px-6 py-3 text-center text-slate-500">{r.sono ?? '—'}</td>
                      <td className="px-6 py-3 text-center text-slate-500">{r.fadiga ?? '—'}</td>
                      <td className={`px-6 py-3 text-center font-black ${(r.dor || 0) > 3 ? 'text-red-500' : 'text-slate-400'}`}>{r.dor ?? '—'}</td>
                      <td className="px-6 py-3 text-center font-bold text-purple-600">{Math.round(r.workload || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

