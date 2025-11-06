'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface GaugeChartComponentProps {
  value: number
  min?: number
  max?: number
  label?: string
  unit?: string
}

export function GaugeChartComponent({
  value,
  min = 0,
  max = 100,
  label = 'Value',
  unit = '',
}: GaugeChartComponentProps) {
  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage))

  // Determine color based on percentage
  const getColor = (pct: number) => {
    if (pct < 33) return '#ef4444' // red
    if (pct < 66) return '#f59e0b' // orange
    return '#22c55e' // green
  }

  const color = getColor(clampedPercentage)

  // Data for gauge (semi-circle)
  const gaugeData = [
    { value: clampedPercentage },
    { value: 100 - clampedPercentage },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="90%"
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#333" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col items-center -mt-8">
        <div className="text-3xl font-bold" style={{ color }}>
          {value.toLocaleString()}{unit}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {min} - {max}
        </div>
      </div>
    </div>
  )
}
