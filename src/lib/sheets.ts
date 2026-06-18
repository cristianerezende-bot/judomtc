import { google } from 'googleapis'
import type { RosterEntry, RecRow, PseRow, HomeData, HistRow, ExceptionAlert } from '@/types'
import { normName, num, calcWorkload, normalize, avg } from './utils'

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

async function readSheet(name: string, spreadsheetId: string = SS_PRIMARY) {
  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() })
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId, range: name,
    })
    const values = (res.data.values ?? []) as string[][]
    if (values.length < 2) return { headers: [] as string[], rows: [] as string[][] }
    return {
      headers: values[0].map(normH),
      rows: values.slice(1).filter(r => r.some(c => c !== ''))
    }
  } catch (err) {
    console.error(`Erro ao ler planilha ${spreadsheetId}:`, err)
    return { headers: [] as string[], rows: [] as string[][] }
  }
}

function s(v: unknown) { return String(v ?? '').trim() }

export async function getRoster(categoria?: string): Promise<RosterEntry[]> {
  const [res1, res2] = await Promise.all([
    readSheet('CACHE_ROSTER', SS_PRIMARY),
    readSheet('CACHE_ROSTER', SS_SECONDARY)
  ]);
  function parseRoster(headers: string[], rows: string[][]) {
    const iN = col(headers, ['ATLETA', 'NOME']), iC = col(headers, ['CATEGORIA'])
    return rows.map(r => ({ nome: s(r[iN]), categoria: s(r[iC]) })).filter(e => e.nome)
  }
  const entries1 = parseRoster(res1.headers, res1.rows), entries2 = parseRoster(res2.headers, res2.rows);
  const map = new Map<string, RosterEntry>();
  [...entries1, ...entries2].forEach(e => map.set(normName(e.nome), e));
  let allEntries = Array.from(map.values());
  if (categoria) {
    const cat = normName(categoria)
    allEntries = allEntries.filter(e => normName(e.categoria) === cat)
  }
  return allEntries.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getAllHistory(): Promise<Record<string, HistRow[]>> {
  const [res1, res2] = await Promise.all([
    readSheet('CACHE_ATLETA_HIST_30D', SS_PRIMARY),
    readSheet('CACHE_ATLETA_HIST_30D', SS_SECONDARY)
  ]);
  const grouped: Record<string, HistRow[]> = {}
  function processHist(headers: string[], rows: string[][]) {
    if (!rows.length) return;
    const i = (names: string[]) => col(headers, names);
    const iA = i(['ATLETA']), iD = i(['DATA']), iC = i(['CATEGORIA']), iRO = i(['REC_OK']), iPO = i(['PSE_OK']), iPSR = i(['PSR']);
    const iBE = i(['BE','BEM_ESTAR']), iDOR = i(['DOR']), iF = i(['FADIGA']), iS = i(['SONO']), iST = i(['STRESS','ESTRESSE']), iH = i(['HUMOR']);
    const iPM = i(['PSE_MANHA']), iPT = i(['PSE_TARDE']), iW = i(['WORKLOAD']), iAC = i(['AC']), iV = i(['VFC']), iSA = i(['SALTO']);
    const iM = i(['MENSTRUADA']), iLD = i(['LOCAL_DOR']);
    rows.forEach(r => {
      const name = s(r[iA]), key = normName(name);
      if (!grouped[key]) grouped[key] = [];
      const pseM = num(r[iPM]), pseT = num(r[iPT]);
      grouped[key].push({
        data: s(r[iD]), atleta: name, categoria: s(r[iC]), recOk: Number(r[iRO] ?? 0) === 1, pseOk: Number(r[iPO] ?? 0) === 1,
        psr: num(r[iPSR]), be: num(r[iBE]), dor: num(r[iDOR]), fadiga: num(r[iF]), sono: num(r[iS]), stress: num(r[iST]), humor: num(r[iH]),
        pseManha: pseM, pseTarde: pseT, workload: num(r[iW]) ?? calcWorkload(pseM, pseT), ac: num(r[iAC]), vfc: num(r[iV]), salto: num(r[iSA]),
        menstruada: s(r[iM]), localDor: s(r[iLD]),
      });
    });
  }
  processHist(res1.headers, res1.rows);
  processHist(res2.headers, res2.rows);
  Object.keys(grouped).forEach(k => {
    const days = new Map<string, HistRow>();
    grouped[k].sort((a,b) => a.data.localeCompare(b.data)).forEach(r => days.set(r.data, r));
    grouped[k] = Array.from(days.values());
  });
  return grouped;
}

export async function getRecHoje(categoria?: string): Promise<RecRow[]> {
  const [res1, res2] = await Promise.all([
    readSheet('CACHE_REC_HOJE', SS_PRIMARY),
    readSheet('CACHE_REC_HOJE', SS_SECONDARY)
  ]);
  const histMap = await getAllHistory();
  function parseRec(headers: string[], rows: string[][]) {
    const iA = col(headers, ['ATLETA','NOME']), iP = col(headers, ['PSR']), iB = col(headers, ['BE','BEM_ESTAR']), iF = col(headers, ['FADIGA']);
    const iS = col(headers, ['SONO']), iD = col(headers, ['DOR']), iSt = col(headers, ['STRESS','ESTRESSE']), iH = col(headers, ['HUMOR']), iT = col(headers, ['TS_ORIGEM']);
    return rows.map(r => ({
      atleta: s(r[iA]), psr: num(r[iP]), be: num(r[iB]), fadiga: num(r[iF]), sono: num(r[iS]), dor: num(r[iD]), stress: num(r[iSt]), humor: num(r[iH]), tsOrigem: s(r[iT]),
    })).filter(r => r.atleta)
  }
  const map = new Map<string, any>();
  [...parseRec(res1.headers, res1.rows), ...parseRec(res2.headers, res2.rows)].forEach(r => map.set(normName(r.atleta), r));

  let result = Array.from(map.values()).map(d => {
    const hist = histMap[normName(d.atleta)] || [];
    const getRange = (fn: (h: HistRow) => number | null) => {
      const vals = hist.map(fn).filter((v): v is number => v !== null);
      return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
    }
    const rPSR = getRange(h => h.psr), rSono = getRange(h => h.sono), rHumor = getRange(h => h.humor);
    const rDor = getRange(h => h.dor), rFadiga = getRange(h => h.fadiga), rStress = getRange(h => h.stress);

    // IP 4.0: TODAS as variáveis de Bem Estar: maior = melhor (esclarecido pelo usuário)
    const nPSR = normalize(d.psr, rPSR?.min ?? 0, rPSR?.max ?? 10, false);
    const nSono = normalize(d.sono, rSono?.min ?? 1, rSono?.max ?? 5, false);
    const nHumor = normalize(d.humor, rHumor?.min ?? 1, rHumor?.max ?? 5, false);
    const nDor = normalize(d.dor, rDor?.min ?? 1, rDor?.max ?? 5, false);
    const nFadiga = normalize(d.fadiga, rFadiga?.min ?? 1, rFadiga?.max ?? 5, false);
    const nStress = normalize(d.stress, rStress?.min ?? 1, rStress?.max ?? 5, false);

    const eixoRec = avg([nPSR, nSono, nHumor, nDor, nFadiga, nStress]);
    return { ...d, readiness: eixoRec !== null ? Math.round(eixoRec) : null };
  });

  if (categoria) {
    const roster = await getRoster(categoria), nomes = new Set(roster.map(e => normName(e.nome)));
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getPseHoje(categoria?: string): Promise<PseRow[]> {
  const [res1, res2] = await Promise.all([
    readSheet('CACHE_PSE_HOJE', SS_PRIMARY),
    readSheet('CACHE_PSE_HOJE', SS_SECONDARY)
  ]);
  function parsePse(headers: string[], rows: string[][]) {
    const iA = col(headers, ['ATLETA','NOME']), iM = col(headers, ['PSE_MANHA']), iT = col(headers, ['PSE_TARDE']), iQ = col(headers, ['QTD_REGISTROS','QTD']), iU = col(headers, ['ULTIMA_ATUALIZACAO'])
    return rows.map(r => {
      const pseM = num(r[iM]), pseT = num(r[iT]);
      return { atleta: s(r[iA]), pseManha: pseM, pseTarde: pseT, qtd: num(r[iQ]), ultimaAtualizacao: s(r[iU]), workload: calcWorkload(pseM, pseT) }
    }).filter(r => r.atleta)
  }
  const map = new Map<string, PseRow>();
  [...parsePse(res1.headers, res1.rows), ...parsePse(res2.headers, res2.rows)].forEach(r => map.set(normName(r.atleta), r));
  let result = Array.from(map.values());
  if (categoria) {
    const roster = await getRoster(categoria), nomes = new Set(roster.map(e => normName(e.nome)));
    result = result.filter(r => nomes.has(normName(r.atleta)))
  }
  return result.sort((a, b) => a.atleta.localeCompare(b.atleta, 'pt-BR'))
}

export async function getHomeData(categoria?: string): Promise<HomeData> {
  const [res1, res2] = await Promise.all([
    readSheet('CACHE_HOME', SS_PRIMARY),
    readSheet('CACHE_HOME', SS_SECONDARY)
  ]);
  const map: Record<string, string> = {}
  res1.rows.forEach(r => { if (r[0]) map[s(r[0])] = s(r[1]) }); res2.rows.forEach(r => { if (r[0]) map[s(r[0])] = s(r[1]) });
  let cats: string[] = []; try { cats = Array.from(new Set([...JSON.parse(map['CATEGORIAS_JSON'] || '[]')])).sort() } catch { }
  const roster = await getRoster(categoria), recRows = await getRecHoje(categoria), pseRows = await getPseHoje(categoria);
  const rosterNames = roster.map(e => e.nome), recSet = new Set(recRows.map(r => normName(r.atleta))), pseSet = new Set(pseRows.map(r => normName(r.atleta)));
  const recMissing = rosterNames.filter(n => !recSet.has(normName(n))), pseMissing = rosterNames.filter(n => !pseSet.has(normName(n)));

  const exceptions: ExceptionAlert[] = []
  recRows.forEach(r => {
    if (r.readiness !== null && r.readiness < 33) {
      exceptions.push({
        atleta: r.atleta, categoria: roster.find(e => normName(e.nome) === normName(r.atleta))?.categoria || '',
        type: 'readiness', message: `Prontidão Crítica (IP 4.0): ${r.readiness}%`, severity: 'high'
      })
    }
  })
  const readinessAvg = Math.round(avg(recRows.map(r => r.readiness)) || 0)
  
  // Radar: Todas as escalas maior = melhor
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
  const histMap = await getAllHistory();
  const rows = histMap[normName(atletaNome)] || [];
  return rows.map((r, idx, self) => {
    const window = self.slice(Math.max(0, idx - 28), idx + 1);
    const getRange = (fn: (h: HistRow) => number | null) => {
      const vals = window.map(fn).filter((v): v is number => v !== null);
      return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null;
    }
    const rPSR = getRange(h => h.psr), rSono = getRange(h => h.sono), rHumor = getRange(h => h.humor), rDor = getRange(h => h.dor), rFadiga = getRange(h => h.fadiga), rStress = getRange(h => h.stress);
    const nPSR = normalize(r.psr, rPSR?.min ?? 0, rPSR?.max ?? 10, false);
    const nSono = normalize(r.sono, rSono?.min ?? 1, rSono?.max ?? 5, false);
    const nHumor = normalize(r.humor, rHumor?.min ?? 1, rHumor?.max ?? 5, false);
    const nDor = normalize(r.dor, rDor?.min ?? 1, rDor?.max ?? 5, false);
    const nFadiga = normalize(r.fadiga, rFadiga?.min ?? 1, rFadiga?.max ?? 5, false);
    const nStress = normalize(r.stress, rStress?.min ?? 1, rStress?.max ?? 5, false);
    const eixoRec = avg([nPSR, nSono, nHumor, nDor, nFadiga, nStress]);
    
    // PSE alta é bom (esclarecido pelo usuário)
    const nWorkload = normalize(r.workload, getRange(h => h.workload)?.min, getRange(h => h.workload)?.max, false);
    const nVFC = normalize(r.vfc, getRange(h => h.vfc)?.min, getRange(h => h.vfc)?.max, false);
    const nSalto = normalize(r.salto, getRange(h => h.salto)?.min, getRange(h => h.salto)?.max, false);
    
    const ip = avg([eixoRec, nVFC, nSalto, nWorkload]);
    return { ...r, readiness: ip !== null ? Math.round(ip) : null }
  });
}
