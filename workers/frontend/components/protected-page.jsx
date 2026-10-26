"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useKanban } from "./kanban-provider"
import AppShell from "./app-shell"

// Auth guard + sidebar layout shared by every signed-in page.
export default function ProtectedPage({ title, actions, children }) {
  const { state, logout } = useKanban()
  const router = useRouter()

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/")
    }
  }, [state.isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell title={title} actions={actions} username={state.user?.username} onLogout={handleLogout}>
      {children}
    </AppShell>
  )
}
