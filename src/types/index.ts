export interface RosterEntry { nome: string; categoria: string }

export interface RecRow {
  atleta: string
  psr: number | null; be: number | null; fadiga: number | null
  sono: number | null; dor: number | null; stress: number | null
  humor: number | null; tsOrigem: string
  readiness?: number | null // Adicionado para o DSS
}

export interface PseRow {
  atleta: string
  pseManha: number | null; pseTarde: number | null
  qtd: number | null; ultimaAtualizacao: string
  workload?: number // Adicionado para o DSS
}

export interface ExceptionAlert {
  atleta: string
  categoria: string
  type: 'readiness' | 'acwr' | 'missing'
  message: string
  severity: 'high' | 'medium'
}

export interface HomeData {
  updatedAt: string; totalAtletas: number
  recPendentes: number; psePendentes: number
  recMissing: string[]; pseMissing: string[]
  radar: number[]; categorias: string[]
  exceptions?: ExceptionAlert[] // Adicionado para o DSS
  readinessAvg?: number // Adicionado para o DSS
}

export interface HistRow {
  data: string; atleta: string; categoria: string
  recOk: boolean; pseOk: boolean
  psr: number | null; be: number | null; dor: number | null
  fadiga: number | null; sono: number | null; stress: number | null
  humor: number | null; pseManha: number | null; pseTarde: number | null
  workload: number | null; ac: number | null; vfc: number | null
  salto: number | null; menstruada: string; localDor: string
  readiness?: number | null // Adicionado para o DSS
}

export interface DayRow {
  dayKey: string; dayBr: string; recOk: boolean; pseOk: boolean
  psr: number | null; be: number | null; dor: number | null
  fadiga: number | null; stress: number | null; humor: number | null
  sono: number | null; workload: number | null; ac: number | null
  vfc: number | null; salto: number | null
  pseM: number | null; pseT: number | null
  menstruada: string; localDor: string
  readiness?: number | null // Adicionado para o DSS
}

export interface Adherence {
  rec7Ok: number; pse7Ok: number; rec7Miss: number; pse7Miss: number; total7Miss: number
  rec14Ok: number; pse14Ok: number; rec14Miss: number; pse14Miss: number; total14Miss: number
  rec7Pct: number; pse7Pct: number; rec14Pct: number; pse14Pct: number
}

export interface CardItem {
  label: string; value: number | string | null
  status: { label: string; cls: 'good' | 'mid' | 'bad' | 'na' }
}

export interface AthleteReport {
  athlete: string; categoria: string; windowDays: number; todayKey: string
  dayKeys: string[]; rows: DayRow[]; adherence: Adherence
}
