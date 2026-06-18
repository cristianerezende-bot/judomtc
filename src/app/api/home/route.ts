import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getHomeData } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoria = req.nextUrl.searchParams.get('categoria') ?? undefined
  try {
    const data = await getHomeData(categoria)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
