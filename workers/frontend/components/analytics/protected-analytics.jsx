"use client"

import ProtectedPage from "@/components/protected-page"
import AnalyticsDashboard from "./analytics-dashboard"

export default function ProtectedAnalytics() {
  return (
    <ProtectedPage title="Analytics">
      <AnalyticsDashboard />
    </ProtectedPage>
  )
}
