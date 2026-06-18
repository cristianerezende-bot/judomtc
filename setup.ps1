# ============================================================
# setup.ps1 — Dashboard Judô Alto Rendimento
# Execute no terminal do VS Code dentro da pasta Relatório Judo:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\setup.ps1
# ============================================================

Write-Host "Criando estrutura do projeto..." -ForegroundColor Cyan

# ─── Pastas ──────────────────────────────────────────────────
$dirs = @(
  "src\types",
  "src\lib",
  "src\app\api\auth\[...nextauth]",
  "src\app\api\home",
  "src\app\api\rec",
  "src\app\api\pse",
  "src\app\api\atleta",
  "src\app\login",
  "src\app\rec",
  "src\app\pse",
  "src\app\atleta",
  "src\components"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# ─── Helper para gravar arquivos ─────────────────────────────
function W($path, $content) {
  $dir = Split-Path $path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $path -Value $content -Encoding UTF8
  Write-Host "  OK  $path" -ForegroundColor Green
}

# ============================================================
# package.json
# ============================================================
W "package.json" @'
{
  "name": "judo-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18",
    "react-dom": "^18",
    "next-auth": "^4.24.7",
    "googleapis": "^140.0.1",
    "recharts": "^2.12.7",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.5"
  }
}
'@

# ============================================================
# .gitignore
# ============================================================
W ".gitignore" @'
.env.local
.env*.local
.next/
node_modules/
out/
*.tsbuildinfo
next-env.d.ts
'@

# ============================================================
# .env.local.example
# ============================================================
W ".env.local.example" @'
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
CACHE_SPREADSHEET_ID=1Nxp2iTrPRIz1dAWuGv2lyo4l8TbKZkGfGKYjYLP6FzI
ALLOWED_EMAILS=cristiane.rezende@minastc.com.br
'@

# ============================================================
# next.config.js
# ============================================================
W "next.config.js" @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis'],
  },
}
module.exports = nextConfig
'@

# ============================================================
# tailwind.config.ts
# ============================================================
W "tailwind.config.ts" @'
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { 1: '#041e3c', 2: '#071b33', 3: '#0b3c6f' },
        gold: '#D6B25E',
        ink: '#0B1220',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
'@

# ============================================================
# postcss.config.js
# ============================================================
W "postcss.config.js" @'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
'@

# ============================================================
# tsconfig.json
# ============================================================
W "tsconfig.json" @'
{
  "compilerOptions": {
    "lib": ["dom","dom.iterable","esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./src/*"]}
  },
  "include": ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
'@

# ============================================================
# src/types/index.ts
# ============================================================
W "src\types\index.ts" @'
export interface RosterEntry { nome: string; categoria: string }

export interface RecRow {
  atleta: string
  psr: number | null; be: number | null; fadiga: number | null
  sono: number | null; dor: number | null; stress: number | null
  humor: number | null; tsOrigem: string
}

export interface PseRow {
  atleta: string
  pseManha: number | null; pseTarde: number | null
  qtd: number | null; ultimaAtualizacao: string
}

export interface HomeData {
  updatedAt: string; totalAtletas: number
  recPendentes: number; psePendentes: number
  recMissing: string[]; pseMissing: string[]
  radar: number[]; categorias: string[]
}

export interface HistRow {
  data: string; atleta: string; categoria: string
  recOk: boolean; pseOk: boolean
  psr: number | null; be: number | null; dor: number | null
  fadiga: number | null; sono: number | null; stress: number | null
  humor: number | null; pseManha: number | null; pseTarde: number | null
  workload: number | null; ac: number | null; vfc: number | null
  salto: number | null; menstruada: string; localDor: string
}

export interface DayRow {
  dayKey: string; dayBr: string; recOk: boolean; pseOk: boolean
  psr: number | null; be: number | null; dor: number | null
  fadiga: number | null; stress: number | null; humor: number | null
  sono: number | null; workload: number | null; ac: number | null
  vfc: number | null; salto: number | null
  pseM: number | null; pseT: number | null
  menstruada: string; localDor: string
}

export interface Adherence {
  rec7Ok: number; pse7Ok: number; rec7Miss: number; pse7Miss: number; total7Miss: number
  rec14Ok: number; pse14Ok: number; rec14Miss: number; pse14Miss: number; total14Miss: number
  rec7Pct: number; pse7Pct: number; rec14Pct: number; pse14Pct: number
}

export interface CardItem {
  label: string; value: number | null
  status: { label: string; cls: 'good' | 'mid' | 'bad' | 'na' }
}

export interface AthleteReport {
  athlete: string; categoria: string; windowDays: number; todayKey: string
  dayKeys: string[]; rows: DayRow[]; adherence: Adherence
}
'@

# ============================================================
# src/lib/utils.ts
# ============================================================
W "src\lib\utils.ts" @'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normName(s: string): string {
  return s.trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(String(v).replace(',', '.').replace('%', '').trim())
  return isFinite(n) ? n : null
}

export function fmt(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  return v.toFixed(decimals).replace('.', ',')
}

export function lastNDaysKeys(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out.reverse()
}

export function formatBr(key: string): string {
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}` : key
}
'@

# ============================================================
# src/lib/sheets.ts
# ============================================================
W "src\lib\sheets.ts" @'
import { google } from 'googleapis'
import type { RosterEntry, RecRow, PseRow, HomeData, HistRow } from '@/types'
import { normName, num } from './utils'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

const SS_ID = process.env.CACHE_SPREADSHEET_ID!

function normH(h: string) {
  return h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[\s_]+/g, '_')
}

function col(headers: string[], names: string[]): number {
  for (const n of names) {
    const i = headers.indexOf(normH(n))
    if (i !== -1) return i
  }
  return -1
}

async function readSheet(name: string) {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SS_ID, range: name,
  })
  const values = (res.data.values ?? []) as string[][]
  if (values.length < 2) return { headers: [] as string[], rows: [] as string[][] }
  return {
    headers: values[0].map(normH),
    rows: values.slice(1).filter(r => r.some(c => c !== ''))
  }
}

function s(v: unknown) { return String(v ?? '').trim() }

export async function getRoster(categoria?: string): Promise<RosterEntry[]> {
  const { headers, rows } = await readSheet('CACHE_ROSTER')
  if (!rows.length) return []
  const iN = col(headers, ['ATLETA', 'NOME'])
  const iC = col(headers, ['CATEGORIA'])
  let entries = rows.map(r => ({ nome: s(r[iN]), categoria: s(r[iC]) })).filter(e => e.nome)
  if (categoria) {
    const cat = normName(categoria)
    entries = entries.filter(e => normName(e.categoria) === cat)
  }
  return entries.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getRecHoje(categoria?: string): Promise<RecRow[]> {
  const { headers, rows } = await readSheet('CACHE_REC_HOJE')
  if (!rows.length) return []
  const iA = col(headers, ['ATLETA','NOME']), iP = col(headers, ['PSR'])
  const iB = col(headers, ['BE','BEM_ESTAR']), iF = col(headers, ['FADIGA'])
  const iS = col(headers, ['SONO']), iD = col(headers, ['DOR'])
  const iSt = col(headers, ['STRESS','ESTRESSE']), iH = col(headers, ['HUMOR'])
  const iT = col(headers, ['TS_ORIGEM'])
  let result = rows.map(r => ({
    atleta: s(r[iA]), psr: num(r[iP]), be: num(r[iB]), fadiga: num(r[iF]),
    sono: num(r[iS]), dor: num(r[iD]), stress: num(r[iSt]), humor: num(r[iH]),
    tsOrigem: s(r[iT]),
  })).filter(r => r.atleta)
  if (categoria) {
    const roster = await getRoster(categoria)
    const nomes = new Set(roster.map(e => normName(e.nome)))
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getPseHoje(categoria?: string): Promise<PseRow[]> {
  const { headers, rows } = await readSheet('CACHE_PSE_HOJE')
  if (!rows.length) return []
  const iA = col(headers, ['ATLETA','NOME'])
  const iM = col(headers, ['PSE_MANHA']), iT = col(headers, ['PSE_TARDE'])
  const iQ = col(headers, ['QTD_REGISTROS','QTD']), iU = col(headers, ['ULTIMA_ATUALIZACAO'])
  let result = rows.map(r => ({
    atleta: s(r[iA]), pseManha: num(r[iM]), pseTarde: num(r[iT]),
    qtd: num(r[iQ]), ultimaAtualizacao: s(r[iU]),
  })).filter(r => r.atleta)
  if (categoria) {
    const roster = await getRoster(categoria)
    const nomes = new Set(roster.map(e => normName(e.nome)))
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getHomeData(categoria?: string): Promise<HomeData> {
  const { rows } = await readSheet('CACHE_HOME')
  const map: Record<string, string> = {}
  rows.forEach(r => { if (r[0]) map[s(r[0])] = s(r[1]) })
  let categorias: string[] = []
  try { categorias = JSON.parse(map['CATEGORIAS_JSON'] || '[]') } catch { /* */ }
  const roster = await getRoster(categoria)
  const rosterNames = roster.map(e => e.nome)
  const recRows = await getRecHoje(categoria)
  const pseRows = await getPseHoje(categoria)
  const recSet = new Set(recRows.map(r => normName(r.atleta)))
  const pseSet = new Set(pseRows.map(r => normName(r.atleta)))
  const recMissing = rosterNames.filter(n => !recSet.has(normName(n)))
  const pseMissing = rosterNames.filter(n => !pseSet.has(normName(n)))
  function avg(arr: (number | null)[]) {
    const v = arr.filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
  }
  const clamp = (v: number) => Math.max(0, Math.min(5, parseFloat(v.toFixed(1))))
  const radar = [
    clamp(avg(recRows.map(r => r.sono))),
    clamp(5 - avg(recRows.map(r => r.stress))),
    clamp(5 - avg(recRows.map(r => r.fadiga))),
    clamp(5 - avg(recRows.map(r => r.dor))),
    clamp(avg(recRows.map(r => r.humor))),
  ]
  return {
    updatedAt: map['UPDATED_AT'] ?? '', totalAtletas: rosterNames.length,
    recPendentes: recMissing.length, psePendentes: pseMissing.length,
    recMissing, pseMissing, radar, categorias,
  }
}

export async function getAtletaHist(atletaNome: string): Promise<HistRow[]> {
  const { headers, rows } = await readSheet('CACHE_ATLETA_HIST_30D')
  if (!rows.length) return []
  function i(names: string[]) { return col(headers, names) }
  const nome = normName(atletaNome)
  return rows
    .filter(r => normName(s(r[i(['ATLETA'])])) === nome)
    .map(r => ({
      data: s(r[i(['DATA'])]), atleta: s(r[i(['ATLETA'])]), categoria: s(r[i(['CATEGORIA'])]),
      recOk: Number(r[i(['REC_OK'])] ?? 0) === 1,
      pseOk: Number(r[i(['PSE_OK'])] ?? 0) === 1,
      psr: num(r[i(['PSR'])]), be: num(r[i(['BE'])]), dor: num(r[i(['DOR'])]),
      fadiga: num(r[i(['FADIGA'])]), sono: num(r[i(['SONO'])]),
      stress: num(r[i(['STRESS','ESTRESSE'])]), humor: num(r[i(['HUMOR'])]),
      pseManha: num(r[i(['PSE_MANHA'])]), pseTarde: num(r[i(['PSE_TARDE'])]),
      workload: num(r[i(['WORKLOAD'])]), ac: num(r[i(['AC'])]),
      vfc: num(r[i(['VFC'])]), salto: num(r[i(['SALTO'])]),
      menstruada: s(r[i(['MENSTRUADA'])]), localDor: s(r[i(['LOCAL_DOR'])]),
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}
'@

# ============================================================
# src/app/api/auth/[...nextauth]/route.ts
# ============================================================
W "src\app\api\auth\[...nextauth]\route.ts" @'
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const allowedEmails = (process.env.ALLOWED_EMAILS ?? '').split(',').map(e => e.trim())

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return allowedEmails.includes(user.email ?? '')
    },
    async session({ session }) {
      return session
    },
  },
  pages: { signIn: '/login' },
})

export { handler as GET, handler as POST }
'@

# ============================================================
# src/app/api/home/route.ts
# ============================================================
W "src\app\api\home\route.ts" @'
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
'@

# ============================================================
# src/app/api/rec/route.ts
# ============================================================
W "src\app\api\rec\route.ts" @'
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
'@

# ============================================================
# src/app/api/pse/route.ts
# ============================================================
W "src\app\api\pse\route.ts" @'
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
'@

# ============================================================
# src/app/api/atleta/route.ts
# ============================================================
W "src\app\api\atleta\route.ts" @'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAtletaHist } from '@/lib/sheets'
import { lastNDaysKeys, formatBr } from '@/lib/utils'
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
      windowDays: 14, todayKey: new Date().toISOString().slice(0,10),
      dayKeys, rows, adherence,
    }
    return NextResponse.json(report, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
'@

# ============================================================
# src/app/globals.css
# ============================================================
W "src\app\globals.css" @'
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: linear-gradient(180deg, #0b3c6f 0%, #041e3c 100%);
  min-height: 100vh;
  color: #fff;
}

.card {
  @apply bg-white rounded-3xl border border-black/10 shadow-xl overflow-hidden;
}

.pill {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-black
         bg-black/5 border border-black/10 text-slate-700;
}
'@

# ============================================================
# src/app/layout.tsx
# ============================================================
W "src\app\layout.tsx" @'
import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from 'next-auth'
import Shell from '@/components/Shell'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Dashboard Judô',
  description: 'Monitoramento de atletas de alto rendimento',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {session ? <Shell>{children}</Shell> : <>{children}</>}
        </Providers>
      </body>
    </html>
  )
}
'@

# ============================================================
# src/components/Providers.tsx
# ============================================================
W "src\components\Providers.tsx" @'
'use client'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
'@

# ============================================================
# src/app/login/page.tsx
# ============================================================
W "src\app\login\page.tsx" @'
'use client'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-3xl border border-black/10 shadow-2xl
                      p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#0b3c6f] flex items-center
                        justify-center text-3xl shadow-lg">
          🥋
        </div>
        <h1 className="text-[#0B1220] text-2xl font-black text-center">
          Dashboard Judô
        </h1>
        <p className="text-slate-500 text-sm font-bold text-center">
          Acesso restrito à comissão técnica
        </p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 px-6 py-3
                     bg-[#0b3c6f] hover:bg-[#041e3c] text-white font-black
                     rounded-2xl transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  )
}
'@

# ============================================================
# src/components/Shell.tsx
# ============================================================
W "src\components\Shell.tsx" @'
'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, HeartPulse, Gauge, User, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'

const NAV = [
  { href: '/',       label: 'Home',        icon: Home       },
  { href: '/rec',    label: 'Recuperação', icon: HeartPulse },
  { href: '/pse',    label: 'PSE',         icon: Gauge      },
  { href: '/atleta', label: 'Atleta',      icon: User       },
]

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const categoria    = searchParams.get('categoria') ?? ''
  const [categorias, setCategorias] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/home')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.categorias)) setCategorias(d.categorias) })
      .catch(() => {})
  }, [])

  function navHref(href: string) {
    return categoria ? `${href}?categoria=${encodeURIComponent(categoria)}` : href
  }

  function onCatChange(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('categoria', val)
    else params.delete('categoria')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-3 mt-3 rounded-3xl border border-white/20
                         bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/12 border border-white/20
                            flex items-center justify-center text-2xl">🥋</div>
            <div>
              <div className="font-black text-sm leading-tight">
                Dashboard Judô
                {categoria && (
                  <span className="ml-2 text-xs font-bold opacity-80
                                   bg-yellow-400/20 border border-yellow-400/40
                                   px-2 py-0.5 rounded-full">
                    {categoria}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold opacity-75 mt-0.5">Alto Rendimento · MTC</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl
                       bg-white/10 border border-white/16 text-xs font-black
                       hover:bg-white/20 transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        <div className="px-3 pb-3 flex items-center gap-2 flex-wrap
                        border-t border-white/12 pt-2.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={navHref(href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full
                            text-xs font-black border transition-colors
                            ${active
                              ? 'bg-yellow-400/20 border-yellow-400/30'
                              : 'bg-white/8 border-white/16 hover:bg-white/16'}`}>
                <Icon size={14} /> {label}
              </Link>
            )
          })}

          <div className="flex-1" />

          {categorias.length > 0 && (
            <select
              value={categoria}
              onChange={e => onCatChange(e.target.value)}
              className="bg-white/12 border border-white/22 text-white text-xs
                         font-black rounded-full px-3 py-2 outline-none cursor-pointer
                         hover:bg-yellow-400/15 transition-colors min-w-[160px]"
            >
              <option value="">Todas as categorias</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </header>

      <main className="flex-1 mx-3 mt-3 mb-4 rounded-3xl bg-slate-50
                       text-[#0B1220] shadow-2xl overflow-hidden p-4 md:p-5">
        {children}
      </main>
    </div>
  )
}

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ShellInner>{children}</ShellInner>
    </Suspense>
  )
}
'@

# ============================================================
# src/components/KpiCard.tsx
# ============================================================
W "src\components\KpiCard.tsx" @'
interface Props {
  label: string
  value: string | number
  meta?: string
  icon?: React.ReactNode
  variant?: 'default' | 'good' | 'bad'
}

export default function KpiCard({ label, value, meta, icon, variant = 'default' }: Props) {
  const bg = variant === 'good' ? 'bg-emerald-50 border-emerald-200'
           : variant === 'bad'  ? 'bg-red-50 border-red-200'
           : 'bg-white border-black/10'
  return (
    <div className={`relative rounded-3xl border shadow-lg p-4 overflow-hidden ${bg}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r
                      from-yellow-400 via-indigo-400 to-cyan-400" />
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="text-xs font-black text-slate-500 tracking-wide">{label}</div>
          <div className="text-3xl font-black text-[#0B1220] mt-2 leading-none">{value}</div>
          {meta && <div className="text-xs font-bold text-slate-400 mt-1.5">{meta}</div>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-2xl bg-black/5 border border-black/8
                          flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
'@

# ============================================================
# src/components/StatusBadge.tsx
# ============================================================
W "src\components\StatusBadge.tsx" @'
interface Props {
  cls: 'good' | 'mid' | 'bad' | 'na'
  label: string
  className?: string
}

export default function StatusBadge({ cls, label, className = '' }: Props) {
  const c = cls === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : cls === 'mid'  ? 'bg-amber-50   border-amber-200   text-amber-800'
          : cls === 'bad'  ? 'bg-red-50     border-red-200     text-red-800'
          : 'bg-slate-50 border-slate-200 text-slate-500'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                      text-xs font-black border ${c} ${className}`}>
      {label}
    </span>
  )
}
'@

# ============================================================
# src/components/MissingTable.tsx
# ============================================================
W "src\components\MissingTable.tsx" @'
'use client'
import { useState } from 'react'
import { Send } from 'lucide-react'

interface Props { names: string[]; title: string }

export default function MissingTable({ names, title }: Props) {
  const [sent, setSent] = useState<Set<string>>(new Set())
  const pending = names.filter(n => !sent.has(n))

  function copy() {
    navigator.clipboard.writeText(`${title}:\n` + pending.join('\n'))
  }

  return (
    <div className="rounded-3xl bg-white border border-black/10 shadow-lg overflow-hidden">
      <div className="px-4 py-3 bg-black/3 border-b border-black/8
                      flex justify-between items-center gap-2">
        <span className="font-black text-sm">{title}</span>
        <button onClick={copy}
          className="px-3 py-1.5 rounded-xl bg-[#0b3c6f] text-white text-xs
                     font-black hover:bg-[#041e3c] transition-colors">
          Copiar lista
        </button>
      </div>
      <div className="max-h-72 overflow-auto">
        {pending.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-sm font-bold">
            Nenhuma pendência 🎯
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {pending.map(nome => (
                <tr key={nome} className="border-b border-black/6 last:border-0">
                  <td className="px-4 py-2.5 font-black">{nome}</td>
                  <td className="px-3 py-2 w-14 text-right">
                    <button
                      onClick={() => setSent(p => new Set([...p, nome]))}
                      className="w-9 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40
                                 flex items-center justify-center hover:bg-emerald-100
                                 hover:border-emerald-300 transition-colors">
                      <Send size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
'@

# ============================================================
# src/components/RadarChart.tsx
# ============================================================
W "src\components\RadarChart.tsx" @'
'use client'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'

interface Props { values: number[] }

const LABELS = ['Sono', 'Estresse', 'Fadiga', 'Dor', 'Humor']

export default function RadarChartComponent({ values }: Props) {
  const data = LABELS.map((label, i) => ({ label, value: values[i] ?? 0 }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(15,23,42,.12)" />
        <PolarAngleAxis dataKey="label"
          tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
        <Radar name="Prontidão" dataKey="value"
          stroke="#D6B25E" fill="#D6B25E" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip formatter={(v: number) => v.toFixed(1)} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
'@

# ============================================================
# src/components/DonutChart.tsx
# ============================================================
W "src\components\DonutChart.tsx" @'
'use client'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

interface Props { percent: number; label: string }

export default function DonutChart({ percent, label }: Props) {
  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart innerRadius="60%" outerRadius="90%"
          startAngle={210} endAngle={-30}
          data={[{ value: percent, fill: '#D6B25E' }]}>
          <RadialBar dataKey="value" cornerRadius={6}
            background={{ fill: 'rgba(15,23,42,.06)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-[#0B1220]">{Math.round(percent)}%</span>
        <span className="text-xs font-black text-slate-500 mt-0.5">{label}</span>
      </div>
    </div>
  )
}
'@

# ============================================================
# src/components/AthleteTimeline.tsx
# ============================================================
W "src\components\AthleteTimeline.tsx" @'
import type { DayRow } from '@/types'

interface Props { rows: DayRow[]; type: 'rec' | 'pse'; pct: number }

export default function AthleteTimeline({ rows, type, pct }: Props) {
  return (
    <div className="rounded-3xl bg-white border border-black/10 shadow p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-black text-sm">{type === 'rec' ? 'REC' : 'PSE'}</span>
        <span className="pill">{pct}% adesão</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {rows.map(r => {
          const ok = type === 'rec' ? r.recOk : r.pseOk
          return (
            <div key={r.dayKey}
              className={`flex-shrink-0 w-14 rounded-2xl border p-1.5 text-center
                ${ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs font-black text-[#0B1220]">{r.dayBr}</div>
              <div className={`text-xs font-black mt-1
                ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {ok ? 'OK' : 'Faltou'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
'@

# ============================================================
# src/app/page.tsx — Home
# ============================================================
W "src\app\page.tsx" @'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getHomeData } from '@/lib/sheets'
import KpiCard from '@/components/KpiCard'
import MissingTable from '@/components/MissingTable'
import RadarChart from '@/components/RadarChart'
import DonutChart from '@/components/DonutChart'
import { Users, HeartPulse, Gauge, CheckCircle } from 'lucide-react'

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
      <div>
        <h1 className="text-2xl font-black text-[#0B1220]">
          Judô · Dashboard
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de atletas" value={data.totalAtletas} meta="roster do dia"
          icon={<Users size={18}/>} />
        <KpiCard label="REC pendentes" value={data.recPendentes}
          meta={`${recPct}% respondido`} icon={<HeartPulse size={18}/>}
          variant={data.recPendentes > 0 ? 'bad' : 'good'} />
        <KpiCard label="PSE pendentes" value={data.psePendentes}
          meta={`${psePct}% respondido`} icon={<Gauge size={18}/>}
          variant={data.psePendentes > 0 ? 'bad' : 'good'} />
        <KpiCard label="Adesão média" value={`${Math.round((recPct+psePct)/2)}%`}
          meta="REC + PSE" icon={<CheckCircle size={18}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-1">REC hoje</p>
          <DonutChart percent={recPct} label="REC" />
        </div>
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-1">PSE hoje</p>
          <DonutChart percent={psePct} label="PSE" />
        </div>
        <div className="card p-4">
          <p className="text-xs font-black text-slate-500 mb-2">Radar · Prontidão do dia</p>
          <RadarChart values={data.radar} />
          <p className="text-xs text-slate-400 font-bold mt-1">
            Escala 0–5 invertida: quanto maior, melhor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MissingTable names={data.recMissing} title="REC · não responderam" />
        <MissingTable names={data.pseMissing} title="PSE · não responderam" />
      </div>
    </div>
  )
}
'@

# ============================================================
# src/app/rec/page.tsx
# ============================================================
W "src\app\rec\page.tsx" @'
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

      <div className="grid grid-cols-3 gap-3">
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
        <div className="lg:col-span-2 card overflow-auto">
          <div className="px-4 py-3 bg-black/3 border-b border-black/8 font-black text-sm">
            Quem respondeu
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-black/3">
                {['Atleta','PSR','BE','Dor','Fadiga','Estresse','Humor','Sono'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-black text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recRows.map(r => (
                <tr key={r.atleta} className="border-t border-black/6">
                  <td className="px-3 py-2 font-black">{r.atleta}</td>
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
        <MissingTable names={missing} title="Faltantes · REC" />
      </div>
    </div>
  )
}
'@

# ============================================================
# src/app/pse/page.tsx
# ============================================================
W "src\app\pse\page.tsx" @'
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
'@

# ============================================================
# src/app/atleta/page.tsx
# ============================================================
W "src\app\atleta\page.tsx" @'
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AthleteTimeline from '@/components/AthleteTimeline'
import StatusBadge from '@/components/StatusBadge'
import type { AthleteReport } from '@/types'

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#0B1220]">
          Atleta · Histórico 14 dias
          {categoria && <span className="ml-2 text-base font-bold text-slate-500">· {categoria}</span>}
        </h1>
      </div>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <label className="text-xs font-black text-slate-500">Selecionar atleta</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="flex-1 min-w-48 border border-black/12 rounded-2xl px-3 py-2.5
                     text-sm font-black bg-white outline-none">
          {roster.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading && (
        <div className="card p-8 text-center text-slate-400 font-bold">
          Carregando dados…
        </div>
      )}

      {!loading && report && (
        <>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge cls={report.rows.at(-1)?.recOk ? 'good' : 'bad'}
              label={`REC hoje: ${report.rows.at(-1)?.recOk ? 'OK' : 'Faltou'}`} />
            <StatusBadge cls={report.rows.at(-1)?.pseOk ? 'good' : 'bad'}
              label={`PSE hoje: ${report.rows.at(-1)?.pseOk ? 'OK' : 'Faltou'}`} />
            {ad && (
              <StatusBadge
                cls={ad.total14Miss <= 4 ? 'good' : ad.total14Miss <= 8 ? 'mid' : 'bad'}
                label={`Faltas 14d: ${ad.total14Miss}`} />
            )}
          </div>

          {ad && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label:'REC 14d',    v:`${ad.rec14Pct}%`,    m:`${ad.rec14Miss} falta(s)`,  c: ad.rec14Pct>=85?'good':ad.rec14Pct>=65?'mid':'bad' },
                { label:'PSE 14d',    v:`${ad.pse14Pct}%`,    m:`${ad.pse14Miss} falta(s)`,  c: ad.pse14Pct>=85?'good':ad.pse14Pct>=65?'mid':'bad' },
                { label:'Faltas 7d',  v:ad.total7Miss,  m:`REC ${ad.rec7Miss} · PSE ${ad.pse7Miss}`,  c: ad.total7Miss<=2?'good':ad.total7Miss<=4?'mid':'bad' },
                { label:'Faltas 14d', v:ad.total14Miss, m:`REC ${ad.rec14Miss} · PSE ${ad.pse14Miss}`, c: ad.total14Miss<=4?'good':ad.total14Miss<=8?'mid':'bad' },
              ].map(k => (
                <div key={k.label} className={`card p-4
                  ${k.c==='good'?'bg-emerald-50':k.c==='bad'?'bg-red-50':'bg-amber-50'}`}>
                  <div className="text-xs font-black text-slate-500">{k.label}</div>
                  <div className="text-3xl font-black text-[#0B1220] mt-2">{k.v}</div>
                  <div className="text-xs text-slate-400 font-bold mt-1">{k.m}</div>
                </div>
              ))}
            </div>
          )}

          <AthleteTimeline rows={report.rows} type="rec" pct={ad?.rec14Pct ?? 0} />
          <AthleteTimeline rows={report.rows} type="pse" pct={ad?.pse14Pct ?? 0} />

          <div className="card overflow-auto">
            <div className="px-4 py-3 bg-black/3 border-b border-black/8 font-black text-sm">
              Histórico 14 dias
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/3">
                  {['Dia','REC','PSE','PSR','BE','Sono','Fadiga','Dor','PSE M','PSE T'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-black text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map(r => (
                  <tr key={r.dayKey} className="border-t border-black/6">
                    <td className="px-3 py-2 font-mono font-black">{r.dayBr}</td>
                    <td className="px-3 py-2"><StatusBadge cls={r.recOk?'good':'bad'} label={r.recOk?'OK':'Faltou'} /></td>
                    <td className="px-3 py-2"><StatusBadge cls={r.pseOk?'good':'bad'} label={r.pseOk?'OK':'Faltou'} /></td>
                    <td className="px-3 py-2">{r.psr !== null ? Math.round(r.psr) : '—'}</td>
                    <td className="px-3 py-2">{r.be !== null ? r.be.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2">{r.sono !== null ? r.sono.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2">{r.fadiga !== null ? r.fadiga.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2">{r.dor !== null ? r.dor.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2">{r.pseM !== null ? Math.round(r.pseM) : '—'}</td>
                    <td className="px-3 py-2">{r.pseT !== null ? Math.round(r.pseT) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
'@

# ============================================================
Write-Host ""
Write-Host "Projeto criado com sucesso!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. npm install" -ForegroundColor White
Write-Host "  2. cp .env.local.example .env.local  (e preencher as variaveis)" -ForegroundColor White
Write-Host "  3. npm run dev" -ForegroundColor White
Write-Host ""
