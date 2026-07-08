import { google } from 'googleapis'
import type { RosterEntry, RecRow, PseRow, HomeData, HistRow, ExceptionAlert } from '@/types'
import { normName, num, calcWorkload, normalize, avg, getTodayBrStr } from './utils'
import { unstable_cache } from 'next/cache'

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

const SS_PRIMARY = process.env.CACHE_SPREADSHEET_ID!
const SS_SECONDARY = process.env.SECONDARY_SPREADSHEET_ID!

const SHEETS_READ_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de ${ms}ms ao ler ${label}`)), ms)
    ),
  ])
}

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

function s(v: unknown) { return String(v ?? '').trim() }

interface SheetData {
  headers: string[]
  rows: string[][]
}

interface SpreadsheetData {
  roster: SheetData
  recHoje: SheetData
  pseHoje: SheetData
  history: SheetData
  home: SheetData
}

// Leitura em lote (batch) de todas as abas necessárias em uma única requisição HTTP
async function readSpreadsheetBatch(spreadsheetId: string): Promise<SpreadsheetData> {
  const tabs = ['CACHE_ROSTER', 'CACHE_REC_HOJE', 'CACHE_PSE_HOJE', 'CACHE_ATLETA_HIST_30D', 'CACHE_HOME']
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await withTimeout(
      sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: tabs
      }),
      SHEETS_READ_TIMEOUT_MS,
      `spreadsheet ${spreadsheetId}`
    )
    const valueRanges = res.data.valueRanges ?? []
    
    function parseRange(values: string[][] | undefined | null): SheetData {
      if (!values || values.length < 2) return { headers: [], rows: [] }
      return {
        headers: values[0].map(normH),
        rows: values.slice(1).filter(r => r.some(c => c !== ''))
      }
    }
    
    return {
      roster: parseRange(valueRanges[0]?.values),
      recHoje: parseRange(valueRanges[1]?.values),
      pseHoje: parseRange(valueRanges[2]?.values),
      history: parseRange(valueRanges[3]?.values),
      home: parseRange(valueRanges[4]?.values)
    }
  } catch (err) {
    console.error(`Erro ao ler batch do spreadsheet ${spreadsheetId}:`, err)
    const empty = { headers: [] as string[], rows: [] as string[][] }
    return { roster: empty, recHoje: empty, pseHoje: empty, history: empty, home: empty }
  }
}

// Cache do Next.js de 5 minutos, limpável sob demanda via tag 'sheets'
const getCachedSpreadsheet = unstable_cache(
  async (spreadsheetId: string) => {
    return readSpreadsheetBatch(spreadsheetId)
  },
  ['google-sheets-batch-data-v3'],
  {
    revalidate: 300,
    tags: ['sheets']
  }
)

export async function getRoster(categoria?: string): Promise<RosterEntry[]> {
  const [data1, data2] = await Promise.all([
    getCachedSpreadsheet(SS_PRIMARY),
    getCachedSpreadsheet(SS_SECONDARY)
  ])
  
  function parseRoster(headers: string[], rows: string[][]) {
    const iN = col(headers, ['ATLETA', 'NOME']), iC = col(headers, ['CATEGORIA'])
    return rows.map(r => ({ nome: s(r[iN]), categoria: s(r[iC]) })).filter(e => e.nome)
  }
  
  const entries1 = parseRoster(data1.roster.headers, data1.roster.rows)
  const entries2 = parseRoster(data2.roster.headers, data2.roster.rows)
  
  const map = new Map<string, RosterEntry>()
  const combined = [...entries1, ...entries2]
  combined.forEach(e => map.set(normName(e.nome), e))
  
  let allEntries = Array.from(map.values())
  if (categoria) {
    const cat = normName(categoria)
    allEntries = allEntries.filter(e => normName(e.categoria) === cat)
  }
  return allEntries.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

// Função síncrona local para processar o histórico em memória a partir dos dados do batch
function processHistoryFromSheets(res1: SheetData, res2: SheetData): Record<string, HistRow[]> {
  const grouped: Record<string, HistRow[]> = {}
  
  function processHist(headers: string[], rows: string[][]) {
    if (!rows.length) return
    const i = (names: string[]) => col(headers, names)
    const iA = i(['ATLETA']), iD = i(['DATA']), iC = i(['CATEGORIA']), iRO = i(['REC_OK']), iPO = i(['PSE_OK']), iPSR = i(['PSR'])
    const iBE = i(['BE','BEM_ESTAR']), iDOR = i(['DOR']), iF = i(['FADIGA']), iS = i(['SONO']), iST = i(['STRESS','ESTRESSE']), iH = i(['HUMOR'])
    const iPM = i(['PSE_MANHA']), iPT = i(['PSE_TARDE']), iW = i(['WORKLOAD']), iAC = i(['AC']), iV = i(['VFC']), iSA = i(['SALTO'])
    const iM = i(['MENSTRUADA']), iLD = i(['LOCAL_DOR'])
    
    rows.forEach(r => {
      const name = s(r[iA]), key = normName(name)
      if (!grouped[key]) grouped[key] = []
      const pseM = num(r[iPM]), pseT = num(r[iPT])
      grouped[key].push({
        data: s(r[iD]), atleta: name, categoria: s(r[iC]), recOk: Number(r[iRO] ?? 0) === 1, pseOk: Number(r[iPO] ?? 0) === 1,
        psr: num(r[iPSR]), be: num(r[iBE]), dor: num(r[iDOR]), fadiga: num(r[iF]), sono: num(r[iS]), stress: num(r[iST]), humor: num(r[iH]),
        pseManha: pseM, pseTarde: pseT, workload: num(r[iW]) ?? calcWorkload(pseM, pseT), ac: num(r[iAC]), vfc: num(r[iV]), salto: num(r[iSA]),
        menstruada: s(r[iM]), localDor: s(r[iLD]),
      })
    })
  }
  
  processHist(res1.headers, res1.rows)
  processHist(res2.headers, res2.rows)
  
  Object.keys(grouped).forEach(k => {
    const days = new Map<string, HistRow>()
    grouped[k].sort((a,b) => a.data.localeCompare(b.data)).forEach(r => days.set(r.data, r))
    grouped[k] = Array.from(days.values())
  })
  return grouped
}

export async function getAllHistory(): Promise<Record<string, HistRow[]>> {
  const [data1, data2] = await Promise.all([
    getCachedSpreadsheet(SS_PRIMARY),
    getCachedSpreadsheet(SS_SECONDARY)
  ])
  return processHistoryFromSheets(data1.history, data2.history)
}

export async function getRecHoje(categoria?: string): Promise<RecRow[]> {
  const [data1, data2] = await Promise.all([
    getCachedSpreadsheet(SS_PRIMARY),
    getCachedSpreadsheet(SS_SECONDARY)
  ])
  
  const res1 = data1.recHoje
  const res2 = data2.recHoje
  const histMap = processHistoryFromSheets(data1.history, data2.history)
  
  function parseRec(headers: string[], rows: string[][]) {
    const iA = col(headers, ['ATLETA','NOME']), iP = col(headers, ['PSR']), iB = col(headers, ['BE','BEM_ESTAR']), iF = col(headers, ['FADIGA'])
    const iS = col(headers, ['SONO']), iD = col(headers, ['DOR']), iSt = col(headers, ['STRESS','ESTRESSE']), iH = col(headers, ['HUMOR']), iT = col(headers, ['TS_ORIGEM'])
    return rows.map(r => ({
      atleta: s(r[iA]), psr: num(r[iP]), be: num(r[iB]), fadiga: num(r[iF]), sono: num(r[iS]), dor: num(r[iD]), stress: num(r[iSt]), humor: num(r[iH]), tsOrigem: s(r[iT]),
    })).filter(r => r.atleta)
  }
  
  const todayBr = getTodayBrStr()
  const parsed1 = parseRec(res1.headers, res1.rows)
  const parsed2 = parseRec(res2.headers, res2.rows)
  
  const filtered = [...parsed1, ...parsed2].filter(r => {
    const datePart = r.tsOrigem.trim().split(' ')[0]
    return datePart === todayBr
  })
  
  const map = new Map<string, any>()
  filtered.forEach(r => map.set(normName(r.atleta), r))
  
  let result = Array.from(map.values()).map(d => {
    const hist = histMap[normName(d.atleta)] || []
    const getRange = (fn: (h: HistRow) => number | null) => {
      const vals = hist.map(fn).filter((v): v is number => v !== null)
      return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null
    }
    const rPSR = getRange(h => h.psr), rSono = getRange(h => h.sono), rHumor = getRange(h => h.humor)
    const rDor = getRange(h => h.dor), rFadiga = getRange(h => h.fadiga), rStress = getRange(h => h.stress)
    
    const nPSR = normalize(d.psr, rPSR?.min ?? 0, rPSR?.max ?? 10, false)
    const nSono = normalize(d.sono, rSono?.min ?? 1, rSono?.max ?? 5, false)
    const nHumor = normalize(d.humor, rHumor?.min ?? 1, rHumor?.max ?? 5, false)
    const nDor = normalize(d.dor, rDor?.min ?? 1, rDor?.max ?? 5, false)
    const nFadiga = normalize(d.fadiga, rFadiga?.min ?? 1, rFadiga?.max ?? 5, false)
    const nStress = normalize(d.stress, rStress?.min ?? 1, rStress?.max ?? 5, false)
    
    const eixoRec = avg([nPSR, nSono, nHumor, nDor, nFadiga, nStress])
    return { ...d, readiness: eixoRec !== null ? Math.round(eixoRec) : null }
  })
  
  if (categoria) {
    const roster = await getRoster(categoria), nomes = new Set(roster.map(e => normName(e.nome)))
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getPseHoje(categoria?: string): Promise<PseRow[]> {
  const [data1, data2] = await Promise.all([
    getCachedSpreadsheet(SS_PRIMARY),
    getCachedSpreadsheet(SS_SECONDARY)
  ])
  
  const res1 = data1.pseHoje
  const res2 = data2.pseHoje
  
  function parsePse(headers: string[], rows: string[][]) {
    const iA = col(headers, ['ATLETA','NOME']), iM = col(headers, ['PSE_MANHA']), iT = col(headers, ['PSE_TARDE']), iQ = col(headers, ['QTD_REGISTROS','QTD']), iU = col(headers, ['ULTIMA_ATUALIZACAO'])
    return rows.map(r => {
      const pseM = num(r[iM]), pseT = num(r[iT])
      return { atleta: s(r[iA]), pseManha: pseM, pseTarde: pseT, qtd: num(r[iQ]), ultimaAtualizacao: s(r[iU]), workload: calcWorkload(pseM, pseT) }
    }).filter(r => r.atleta)
  }
  
  const todayBr = getTodayBrStr()
  const parsed1 = parsePse(res1.headers, res1.rows)
  const parsed2 = parsePse(res2.headers, res2.rows)
  
  const filtered = [...parsed1, ...parsed2].filter(r => {
    const datePart = r.ultimaAtualizacao.trim().split(' ')[0]
    return datePart === todayBr
  })
  
  const map = new Map<string, PseRow>()
  filtered.forEach(r => map.set(normName(r.atleta), r))
  
  let result = Array.from(map.values())
  if (categoria) {
    const roster = await getRoster(categoria), nomes = new Set(roster.map(e => normName(e.nome)))
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getHomeData(categoria?: string): Promise<HomeData> {
  const [data1, data2] = await Promise.all([
    getCachedSpreadsheet(SS_PRIMARY),
    getCachedSpreadsheet(SS_SECONDARY)
  ])
  
  const res1 = data1.home
  const res2 = data2.home
  
  const map: Record<string, string> = {}
  res1.rows.forEach(r => { if (r[0]) map[s(r[0])] = s(r[1]) })
  res2.rows.forEach(r => { if (r[0]) map[s(r[0])] = s(r[1]) })
  
  let cats: string[] = []
  try {
    cats = Array.from(new Set([...JSON.parse(map['CATEGORIAS_JSON'] || '[]')])).sort()
  } catch { }
  
  // Como getRoster, getRecHoje e getPseHoje são chamadas locais, todas rodando em cima dos mesmos dados em lote de data1/data2, elas serão extremamente rápidas!
  const [roster, recRows, pseRows] = await Promise.all([
    getRoster(categoria),
    getRecHoje(categoria),
    getPseHoje(categoria)
  ])
  
  const rosterNames = roster.map(e => e.nome)
  const recSet = new Set(recRows.map(r => normName(r.atleta)))
  const pseSet = new Set(pseRows.map(r => normName(r.atleta)))
  
  const recMissing = rosterNames.filter(n => !recSet.has(normName(n)))
  const pseMissing = rosterNames.filter(n => !pseSet.has(normName(n)))
  
  const exceptions: ExceptionAlert[] = []
  recRows.forEach(r => {
    if (r.readiness !== null && r.readiness < 33) {
      exceptions.push({
        atleta: r.atleta, categoria: roster.find(e => normName(e.nome) === normName(r.atleta))?.categoria || '',
        type: 'readiness', message: `IP: ${r.readiness}%`, severity: 'high'
      })
    }
  })
  
  const readinessAvg = Math.round(avg(recRows.map(r => r.readiness)) || 0)
  
  const radar = [
    avg(recRows.map(r => r.sono)) || 0,
    avg(recRows.map(r => r.stress)) || 0,
    avg(recRows.map(r => r.fadiga)) || 0,
    avg(recRows.map(r => r.dor)) || 0,
    avg(recRows.map(r => r.humor)) || 0,
  ].map(v => Math.max(0, Math.min(5, Number(v.toFixed(1)))))
  
  return {
    updatedAt: map['UPDATED_AT'] ?? '', totalAtletas: rosterNames.length,
    recPendentes: recMissing.length, psePendentes: pseMissing.length,
    recMissing, pseMissing, radar, categorias: cats,
    exceptions: exceptions.sort((a, b) => b.severity === 'high' ? 1 : -1),
    readinessAvg
  }
}

export async function getAtletaHist(atletaNome: string): Promise<HistRow[]> {
  const histMap = await getAllHistory()
  const rows = histMap[normName(atletaNome)] || []
  return rows.map((r, idx, self) => {
    const window = self.slice(Math.max(0, idx - 28), idx + 1)
    const getRange = (fn: (h: HistRow) => number | null) => {
      const vals = window.map(fn).filter((v): v is number => v !== null)
      return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null
    }
    const rPSR = getRange(h => h.psr), rSono = getRange(h => h.sono), rHumor = getRange(h => h.humor)
    const rDor = getRange(h => h.dor), rFadiga = getRange(h => h.fadiga), rStress = getRange(h => h.stress)
    
    const nPSR = normalize(r.psr, rPSR?.min ?? 0, rPSR?.max ?? 10, false)
    const nSono = normalize(r.sono, rSono?.min ?? 1, rSono?.max ?? 5, false)
    const nHumor = normalize(r.humor, rHumor?.min ?? 1, rHumor?.max ?? 5, false)
    const nDor = normalize(r.dor, rDor?.min ?? 1, rDor?.max ?? 5, false)
    const nFadiga = normalize(r.fadiga, rFadiga?.min ?? 1, rFadiga?.max ?? 5, false)
    const nStress = normalize(r.stress, rStress?.min ?? 1, rStress?.max ?? 5, false)
    
    const eixoRec = avg([nPSR, nSono, nHumor, nDor, nFadiga, nStress])
    
    const nWorkload = normalize(r.workload, getRange(h => h.workload)?.min, getRange(h => h.workload)?.max, false)
    const nVFC = normalize(r.vfc, getRange(h => h.vfc)?.min, getRange(h => h.vfc)?.max, false)
    const nSalto = normalize(r.salto, getRange(h => h.salto)?.min, getRange(h => h.salto)?.max, false)
    
    const ip = avg([eixoRec, nVFC, nSalto, nWorkload])
    return { ...r, readiness: ip !== null ? Math.round(ip) : null }
  })
}
