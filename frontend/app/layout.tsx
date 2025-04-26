import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/components/auth-provider"
import { KanbanProvider } from "@/components/kanban-provider"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kanban Task Manager",
  description: "A simple kanban board for task management",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <KanbanProvider>
              {children}
              <Toaster position="bottom-right" />
            </KanbanProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
