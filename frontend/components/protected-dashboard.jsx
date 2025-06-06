"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useKanban } from "./kanban-provider"
import KanbanBoard from "./kanban-board"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProtectedDashboard() {
  const { state, logout } = useKanban()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!state.isAuthenticated) {
      router.push("/")
    }
  }, [state.isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Show loading while checking authentication
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
    <main className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            API: {process.env.NEXT_PUBLIC_API_BASE_URL || "127.0.0.1:8000"}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <KanbanBoard />
    </main>
  )
}
