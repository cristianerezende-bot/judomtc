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

/**
 * Normaliza um valor dentro de um range de 28 dias (IP 3.0)
 * @param val Valor atual
 * @param min Mínimo do histórico de 28 dias
 * @param max Máximo do histórico de 28 dias
 * @param invert Se true, maior valor = menor prontidão (ex: Carga)
 */
export function normalize(val: number | null, min: number | null, max: number | null, invert = false): number | null {
  if (val === null || min === null || max === null) return null;
  if (max === min) return 100; // Se não houve variação, consideramos pleno
  
  let pct = ((val - min) / (max - min)) * 100;
  if (invert) pct = 100 - pct;
  
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Cálculo de Carga Interna (Session-RPE)
 * Manhã: 60 min | Tarde: 120 min
 */
export function calcWorkload(pseM: number | null, pseT: number | null): number {
  const loadM = (pseM || 0) * 60;
  const loadT = (pseT || 0) * 120;
  return loadM + loadT;
}

/**
 * ACWR (Acute:Chronic Workload Ratio)
 */
export function calcACWR(acute: number, chronic: number): number | null {
  if (chronic === 0) return null;
  return Number((acute / chronic).toFixed(2));
}

export function getACWRStatus(ratio: number | null): 'good' | 'mid' | 'bad' | 'na' {
  if (ratio === null) return 'na';
  if (ratio >= 0.8 && ratio <= 1.3) return 'good';
  if (ratio > 1.3 && ratio <= 1.5) return 'mid';
  return 'bad';
}

/**
 * Calcula a média de um array de números, ignorando nulos.
 */
export function avg(vals: (number | null)[]): number | null {
  const filtered = vals.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}
