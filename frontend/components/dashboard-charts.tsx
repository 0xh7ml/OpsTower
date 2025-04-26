"use client"

import { useState } from "react"
import { useKanban } from "./kanban-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getTasksByStatus, getCompletionStats, getPriorityStats, getTasksForMonth } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import dynamic from "next/dynamic"

// Dynamically import chart components with no SSR to avoid hydration issues
const DynamicBarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })
const DynamicBar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false })
const DynamicPieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false })
const DynamicPie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false })
const DynamicCell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false })
const DynamicResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), {
  ssr: false,
})
const DynamicXAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false })
const DynamicYAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false })
const DynamicTooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false })
const DynamicLegend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false })

const COLORS = ["#3b82f6", "#eab308", "#22c55e", "#ef4444"]
const COMPLETION_COLORS = ["#22c55e", "#94a3b8"]
const PRIORITY_COLORS = ["#ef4444", "#eab308", "#22c55e"]

export default function DashboardCharts() {
  const { state } = useKanban()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  // Get tasks for the selected month
  const filteredTasks = getTasksForMonth(state.tasks, selectedMonth)

  // Generate chart data
  const statusData = getTasksByStatus(filteredTasks)
  const completionData = getCompletionStats(filteredTasks)
  const priorityData = getPriorityStats(filteredTasks)

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: date.toISOString(),
      label: format(date, "MMMM yyyy"),
    }
  })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Task Status</CardTitle>
            <CardDescription>Distribution of tasks by status</CardDescription>
          </div>
          <div className="w-[160px]">
            <Label htmlFor="month-select" className="sr-only">
              Select Month
            </Label>
            <Select value={selectedMonth.toISOString()} onValueChange={(value) => setSelectedMonth(new Date(value))}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicBarChart data={statusData}>
                <DynamicXAxis dataKey="name" />
                <DynamicYAxis />
                <DynamicTooltip />
                <DynamicLegend />
                <DynamicBar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </DynamicBarChart>
            </DynamicResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Completion</CardTitle>
          <CardDescription>Completed vs. incomplete tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicPieChart>
                <DynamicPie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {completionData.map((entry, index) => (
                    <DynamicCell key={`cell-${index}`} fill={COMPLETION_COLORS[index % COMPLETION_COLORS.length]} />
                  ))}
                </DynamicPie>
                <DynamicTooltip />
                <DynamicLegend />
              </DynamicPieChart>
            </DynamicResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Priority</CardTitle>
          <CardDescription>Distribution of tasks by priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <DynamicResponsiveContainer width="100%" height="100%">
              <DynamicPieChart>
                <DynamicPie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {priorityData.map((entry, index) => (
                    <DynamicCell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </DynamicPie>
                <DynamicTooltip />
                <DynamicLegend />
              </DynamicPieChart>
            </DynamicResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Overview</CardTitle>
          <CardDescription>Summary of all tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{state.tasks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {state.tasks.filter((task) => task.status === "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Tasks</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {state.tasks.filter((task) => task.status !== "completed").length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Tasks</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{state.tasks.filter((task) => task.priority === "high").length}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
