'use client'
import { KanbanProvider } from "@/components/kanban-provider"
import { Toaster } from "react-hot-toast"
import dynamic from "next/dynamic"

const LoginPage = dynamic(() => import("@/components/auth/login-page"), {
  ssr: false,
  loading: () => <AuthSkeleton />,
})

export default function Login() {
  return (
    <>
      <KanbanProvider>
        <LoginPage />
      </KanbanProvider>
      <Toaster position="bottom-right" />
    </>
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
