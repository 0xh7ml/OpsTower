"use client"

import { KanbanProvider } from "@/components/kanban-provider"
import dynamic from "next/dynamic"

const SignupPage = dynamic(() => import("@/components/auth/signup-page"), {
  ssr: false,
  loading: () => <AuthSkeleton />,
})

export default function SignupContainer() {
  return (
    <KanbanProvider>
      <SignupPage />
    </KanbanProvider>
  )
}

function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
          <div className="h-32 bg-gray-200 rounded w-full mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  )
}
