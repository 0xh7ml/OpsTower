"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

// Shown instead of Next's generic "Application error" so the cause is visible.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const signInAgain = () => {
    try {
      localStorage.removeItem("authToken")
    } catch {}
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground break-words">{error?.message || "Unexpected error"}</p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => reset()}>
            Try again
          </Button>
          <Button onClick={signInAgain}>Sign in again</Button>
        </div>
      </div>
    </div>
  )
}
