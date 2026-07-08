'use client'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'

interface Props { values: number[] }

const LABELS = ['Sono', 'Estresse', 'Fadiga', 'Dor', 'Humor']

export default function RadarChartComponent({ values }: Props) {
  const data = LABELS.map((label, i) => ({ label, value: values[i] ?? 0 }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} innerRadius="8%">
        <PolarGrid stroke="rgba(15,23,42,.12)" />
        <PolarAngleAxis dataKey="label"
          tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
        <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
        <Radar name="Prontidão" dataKey="value"
          stroke="#D6B25E" fill="#D6B25E" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip formatter={(v: number) => v.toFixed(1)} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
