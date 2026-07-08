import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAtletaHist } from '@/lib/sheets'
import { lastNDaysKeys, formatBr, getTodaySpKey } from '@/lib/utils'
import type { DayRow, Adherence, AthleteReport } from '@/types'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const atleta = req.nextUrl.searchParams.get('atleta') ?? ''
  if (!atleta) return NextResponse.json({ error: 'atleta param required' }, { status: 400 })
  try {
    const hist = await getAtletaHist(atleta)
    const dayKeys = lastNDaysKeys(14)
    const byDay: Record<string, typeof hist[0]> = {}
    hist.forEach(r => { byDay[r.data] = r })
    const rows: DayRow[] = dayKeys.map(k => {
      const r = byDay[k]
      return {
        dayKey: k, dayBr: formatBr(k),
        recOk: !!(r?.recOk), pseOk: !!(r?.pseOk),
        psr: r?.psr ?? null, be: r?.be ?? null, dor: r?.dor ?? null,
        fadiga: r?.fadiga ?? null, stress: r?.stress ?? null,
        humor: r?.humor ?? null, sono: r?.sono ?? null,
        workload: r?.workload ?? null, ac: r?.ac ?? null,
        vfc: r?.vfc ?? null, salto: r?.salto ?? null,
        pseM: r?.pseManha ?? null, pseT: r?.pseTarde ?? null,
        menstruada: r?.menstruada ?? '', localDor: r?.localDor ?? '',
        readiness: r?.readiness ?? null,
      }
    })
    function sumBy(arr: DayRow[], key: 'recOk' | 'pseOk') {
      return arr.reduce((acc, r) => acc + (r[key] ? 1 : 0), 0)
    }
    const last7 = rows.slice(-7), last14 = rows.slice(-14)
    const rec7 = sumBy(last7,'recOk'), pse7 = sumBy(last7,'pseOk')
    const rec14 = sumBy(last14,'recOk'), pse14 = sumBy(last14,'pseOk')
    const adherence: Adherence = {
      rec7Ok: rec7, pse7Ok: pse7,
      rec7Miss: Math.max(last7.length-rec7,0), pse7Miss: Math.max(last7.length-pse7,0),
      total7Miss: Math.max(last7.length*2-(rec7+pse7),0),
      rec14Ok: rec14, pse14Ok: pse14,
      rec14Miss: Math.max(last14.length-rec14,0), pse14Miss: Math.max(last14.length-pse14,0),
      total14Miss: Math.max(last14.length*2-(rec14+pse14),0),
      rec7Pct:  last7.length  ? Math.round((rec7/last7.length)*100)   : 0,
      pse7Pct:  last7.length  ? Math.round((pse7/last7.length)*100)   : 0,
      rec14Pct: last14.length ? Math.round((rec14/last14.length)*100) : 0,
      pse14Pct: last14.length ? Math.round((pse14/last14.length)*100) : 0,
    }
    const report: AthleteReport = {
      athlete: atleta, categoria: hist[0]?.categoria ?? '',
      windowDays: 14, todayKey: getTodaySpKey(),
      dayKeys, rows, adherence,
    }
    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
