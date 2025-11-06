'use client'

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'

interface ScatterChartComponentProps {
  data: any[]
  xKey: string
  yKey: string
  title?: string
}

export function ScatterChartComponent({ data, xKey, yKey, title }: ScatterChartComponentProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data to display</p>
      </div>
    )
  }

  // Transform data for scatter chart (recharts expects x, y, z format)
  const scatterData = data.map(item => ({
    x: item[xKey],
    y: item[yKey],
    name: item[xKey],
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          type="number"
          dataKey="x"
          name={xKey}
          stroke="#888"
          tick={{ fill: '#888', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yKey}
          stroke="#888"
          tick={{ fill: '#888', fontSize: 12 }}
        />
        <ZAxis range={[100, 100]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
          }}
        />
        <Legend wrapperStyle={{ color: '#888' }} />
        <Scatter
          name={yKey}
          data={scatterData}
          fill="#3b82f6"
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
