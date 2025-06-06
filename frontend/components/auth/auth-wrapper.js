"use client"

import { useState, useEffect } from "react"
import { useKanban } from "../kanban-provider"
import LoginForm from "./login-form"
import SignupForm from "./signup-form"
import KanbanBoard from "../kanban-board"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AuthWrapper() {
  const { state, logout } = useKanban()
  const [showSignup, setShowSignup] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure this only runs on the client to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login/signup forms if not authenticated
  if (!state.isAuthenticated) {
    return showSignup ? (
      <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginForm onSwitchToSignup={() => setShowSignup(true)} />
    )
  }

  // Show main app if authenticated
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">API: 127.0.0.1:8000</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={logout}>
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
