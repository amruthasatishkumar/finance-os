'use client'

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Shared tooltip style ──────────────────────────────────────────────────────

function ChartTooltipContent({ active, payload, label, currency = false }: TooltipProps<number, string> & { currency?: boolean }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 shadow-xl min-w-[140px]">
      {label && <p className="text-xs text-[#64748B] font-medium mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-[#94A3B8]">{entry.name}:</span>
          <span className="text-xs font-semibold text-[#F8FAFC] tabular-nums">
            {currency ? formatCurrency(Number(entry.value)) : formatNumber(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Net Worth / Portfolio Area Chart ─────────────────────────────────────────

interface AreaChartData {
  label: string
  [key: string]: string | number
}

interface FinanceAreaChartProps {
  data: AreaChartData[]
  lines: Array<{ key: string; label: string; color: string }>
  height?: number
  currency?: boolean
  className?: string
}

export function FinanceAreaChart({ data, lines, height = 280, currency = true, className }: FinanceAreaChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {lines.map((l) => (
              <linearGradient key={l.key} id={`grad-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={l.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={l.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency ? `$${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<ChartTooltipContent currency={currency} />} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />}
          {lines.map((l) => (
            <Area
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              fill={`url(#grad-${l.key})`}
              dot={false}
              activeDot={{ r: 4, fill: l.color, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Multi-line chart ─────────────────────────────────────────────────────────

export function FinanceLineChart({ data, lines, height = 280, currency = true, className }: FinanceAreaChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency ? `$${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<ChartTooltipContent currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
          {lines.map((l, i) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: l.color, strokeWidth: 0 }}
              strokeDasharray={i === 0 ? undefined : i === 1 ? '5 5' : '2 2'}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarChartData {
  label: string
  [key: string]: string | number
}

interface FinanceBarChartProps {
  data: BarChartData[]
  bars: Array<{ key: string; label: string; color: string }>
  height?: number
  currency?: boolean
  stacked?: boolean
  className?: string
}

export function FinanceBarChart({ data, bars, height = 240, currency = true, stacked = false, className }: FinanceBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => currency ? `$${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip content={<ChartTooltipContent currency={currency} />} />
          {bars.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />}
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.label}
              fill={b.color}
              radius={[3, 3, 0, 0]}
              stackId={stacked ? 'a' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  size?: number
  innerRadius?: number
  outerRadius?: number
  centerLabel?: string
  centerSubLabel?: string
  className?: string
}

export function DonutChart({
  data,
  size = 200,
  innerRadius = 65,
  outerRadius = 90,
  centerLabel,
  centerSubLabel,
  className,
}: DonutChartProps) {
  return (
    <div className={cn('relative inline-block', className)}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2}
          cy={size / 2}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          strokeWidth={0}
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0]
            return (
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-2.5 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color }} />
                  <span className="text-xs text-[#94A3B8]">{d.name}:</span>
                  <span className="text-xs font-semibold text-[#F8FAFC]">{d.value}%</span>
                </div>
              </div>
            )
          }}
        />
      </PieChart>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && <span className="text-base font-bold text-[#F8FAFC] tabular-nums">{centerLabel}</span>}
          {centerSubLabel && <span className="text-[10px] text-[#64748B] text-center leading-tight mt-0.5">{centerSubLabel}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  className?: string
}

export function Sparkline({ data, color = '#6366F1', height = 40, width = 100, className }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
