"use client"

import { KanbanProvider } from "@/components/kanban-provider"
import dynamic from "next/dynamic"

const ProtectedAnalytics = dynamic(() => import("@/components/analytics/protected-analytics"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Loading analytics...</p>
      </div>
    </div>
  ),
})

export default function AnalyticsContainer() {
  return (
    <KanbanProvider>
      <ProtectedAnalytics />
    </KanbanProvider>
  )
}
