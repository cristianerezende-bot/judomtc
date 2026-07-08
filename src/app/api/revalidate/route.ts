import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function GET(req: NextRequest) {
  try {
    // Revalida a tag de cache do Google Sheets
    revalidateTag('sheets')
    
    // Revalida as páginas estáticas/ISR do App Router
    revalidatePath('/')
    revalidatePath('/rec')
    revalidatePath('/pse')
    revalidatePath('/atleta')
    
    return NextResponse.json({
      revalidated: true,
      message: 'Cache do Google Sheets e paginas revalidados com sucesso.',
      now: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('Erro na revalidacao:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    revalidateTag('sheets')
    revalidatePath('/')
    revalidatePath('/rec')
    revalidatePath('/pse')
    revalidatePath('/atleta')
    
    return NextResponse.json({
      revalidated: true,
      message: 'Cache do Google Sheets e paginas revalidados com sucesso via POST.',
      now: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('Erro na revalidacao:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
