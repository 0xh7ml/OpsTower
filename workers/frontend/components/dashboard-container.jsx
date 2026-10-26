"use client"

import { KanbanProvider } from "@/components/kanban-provider"
import dynamic from "next/dynamic"

const ProtectedDashboard = dynamic(() => import("@/components/protected-dashboard"), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
})

export default function DashboardContainer() {
  return (
    <KanbanProvider>
      <ProtectedDashboard />
    </KanbanProvider>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Loading dashboard...</p>
      </div>
    </div>
  )
}
