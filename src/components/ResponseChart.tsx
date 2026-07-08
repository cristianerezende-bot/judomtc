'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ResponseChartProps {
  data: { dayBr: string; recOk: boolean; pseOk: boolean }[]
}

export default function ResponseChart({ data }: ResponseChartProps) {
  const chartData = data.map(r => ({ dayBr: r.dayBr, REC: r.recOk ? 1 : 0, PSE: r.pseOk ? 1 : 0 }))
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="dayBr"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, 1]}
            ticks={[0, 1]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
            formatter={(value: number, name: string) => [value ? 'Respondeu' : 'Não respondeu', name]}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
          <Bar dataKey="REC" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="PSE" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
