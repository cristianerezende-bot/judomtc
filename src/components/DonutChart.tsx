'use client'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface Props { 
  percent: number; 
  label: string;
  variant?: 'gold' | 'emerald' | 'rose' | 'slate'
}

export default function DonutChart({ percent, label, variant = 'gold' }: Props) {
  const data = [
    { value: Math.min(100, Math.max(0, percent)) },
    { value: 100 - Math.min(100, Math.max(0, percent)) },
  ]

  const COLORS = {
    gold: '#D6B25E',
    emerald: '#10b981',
    rose: '#f43f5e',
    slate: '#64748b'
  }

  const fillColor = COLORS[variant]

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius="65%"
            outerRadius="95%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={fillColor} cornerRadius={10} />
            <Cell fill="rgba(15,23,42,0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
        <span className="text-3xl font-black text-[#0B1220]">{Math.round(percent)}%</span>
        <span className="text-xs font-black text-slate-500 mt-0.5">{label}</span>
      </div>
    </div>
  )
}
