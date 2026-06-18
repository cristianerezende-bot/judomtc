import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getRoster, getRecHoje } from '@/lib/sheets'
import { normName } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoria = req.nextUrl.searchParams.get('categoria') ?? undefined
  try {
    const roster = await getRoster(categoria)
    const recRows = await getRecHoje(categoria)
    const recSet = new Set(recRows.map(r => normName(r.atleta)))
    const missingToday = roster.map(e => e.nome).filter(n => !recSet.has(normName(n)))
    return NextResponse.json(
      { rosterCount: roster.length, rowsToday: recRows, missingToday },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' } }
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
