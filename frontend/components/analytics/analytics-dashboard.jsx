"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { AlertCircle, AlertTriangle, CheckCircle2, CircleDashed, ListTodo, Loader, OctagonX } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const RANGES = [
  { value: "week", label: "Week", hint: "last 7 days" },
  { value: "month", label: "Month", hint: "last 30 days" },
  { value: "year", label: "Year", hint: "last 12 months" },
  { value: "all", label: "All time", hint: "all tasks, last 12 months on the timeline" },
]

const STATUS_META = {
  TODO: { key: "todo", label: "To Do", color: "#3b82f6" },
  "IN PROGRESS": { key: "in_progress", label: "In Progress", color: "#eab308" },
  COMPLETED: { key: "completed", label: "Completed", color: "#22c55e" },
  BLOCKED: { key: "blocked", label: "Blocked", color: "#ef4444" },
}

const PRIORITY_META = {
  LOW: { label: "Low", color: "#94a3b8" },
  MEDIUM: { label: "Medium", color: "#f97316" },
  HIGH: { label: "High", color: "#dc2626" },
}

const statusConfig = Object.fromEntries(
  Object.values(STATUS_META).map((m) => [m.key, { label: m.label, color: m.color }]),
)

const timelineConfig = {
  created: { label: "Created", color: "#3b82f6" },
  completed: { label: "Completed", color: "#22c55e" },
}

const priorityConfig = { count: { label: "Tasks" } }

// "2025-03-07" / "2025-03" -> local Date (avoids the UTC shift of new Date("YYYY-MM-DD"))
const parseKey = (key) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d || 1)
}

const formatTick = (key, granularity) =>
  parseKey(key).toLocaleDateString("en", granularity === "month" ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" })

export default function AnalyticsDashboard() {
  const [range, setRange] = useState("week")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiClient
      .getAnalytics(range)
      .then((res) => {
        if (!cancelled && res) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load analytics")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  const hint = RANGES.find((r) => r.value === range)?.hint

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Project overview</h2>
          <p className="text-sm text-muted-foreground">Tasks created or updated in the {hint}.</p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={range}
          onValueChange={(v) => v && setRange(v)}
          aria-label="Time range"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem key={r.value} value={r.value} className="px-3">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!data && loading ? <AnalyticsSkeleton /> : data && <AnalyticsBody data={data} loading={loading} />}
    </div>
  )
}

function AnalyticsBody({ data, loading }) {
  const { summary, by_status, by_priority, timeline } = data

  const statusData = by_status.map((s) => ({
    key: STATUS_META[s.status].key,
    name: STATUS_META[s.status].label,
    value: s.count,
    fill: `var(--color-${STATUS_META[s.status].key})`,
  }))
  const priorityData = by_priority.map((p) => ({
    name: PRIORITY_META[p.priority].label,
    count: p.count,
    fill: PRIORITY_META[p.priority].color,
  }))
  const points = timeline.points.map((p) => ({ ...p, label: formatTick(p.date, timeline.granularity) }))

  const stats = [
    { label: "Total", value: summary.total, icon: ListTodo, tone: "text-foreground" },
    { label: "To Do", value: summary.todo, icon: CircleDashed, tone: "text-blue-500" },
    { label: "In Progress", value: summary.in_progress, icon: Loader, tone: "text-yellow-500" },
    { label: "Completed", value: summary.completed, icon: CheckCircle2, tone: "text-green-500" },
    { label: "Blocked", value: summary.blocked, icon: OctagonX, tone: "text-red-500" },
    { label: "Overdue", value: summary.overdue, icon: AlertTriangle, tone: "text-orange-500" },
  ]

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <s.icon className={`h-6 w-6 ${s.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
            <CardDescription>{summary.completion_rate}% completed</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.total === 0 ? (
              <EmptyChart />
            ) : (
              <ChartContainer config={statusConfig} className="mx-auto h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
                  <Pie data={statusData} dataKey="value" nameKey="key" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {statusData.map((d) => (
                      <Cell key={d.key} fill={d.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.total === 0 ? (
              <EmptyChart />
            ) : (
              <ChartContainer config={priorityConfig} className="h-[280px] w-full">
                <BarChart data={priorityData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="count" radius={6}>
                    {priorityData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Tasks created vs. completed over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={timelineConfig} className="h-[300px] w-full">
            <AreaChart data={points} margin={{ left: 0, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="created" type="monotone" stroke="var(--color-created)" fill="var(--color-created)" fillOpacity={0.2} />
              <Area dataKey="completed" type="monotone" stroke="var(--color-completed)" fill="var(--color-completed)" fillOpacity={0.2} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
      No tasks in this period
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}
