import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getRoster, getPseHoje } from '@/lib/sheets'
import { normName } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoria = req.nextUrl.searchParams.get('categoria') ?? undefined
  try {
    const roster = await getRoster(categoria)
    const pseRows = await getPseHoje(categoria)
    const pseSet = new Set(pseRows.map(r => normName(r.atleta)))
    const pseMissingToday = roster.map(e => e.nome).filter(n => !pseSet.has(normName(n)))
    let pseManhaOk = 0, pseManhaFalt = 0, pseTardeOk = 0, pseTardeFalt = 0
    pseRows.forEach(r => {
      r.pseManha !== null ? pseManhaOk++ : pseManhaFalt++
      r.pseTarde !== null ? pseTardeOk++ : pseTardeFalt++
    })
    return NextResponse.json(
      { pseRows, pseMissingToday, kpis: { pseManhaOk, pseManhaFalt, pseTardeOk, pseTardeFalt } },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
