"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"

export function MainNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/board",
      label: "Kanban Board",
      active: pathname === "/board",
    },
    {
      href: "/rules",
      label: "Automation Rules",
      active: pathname === "/rules",
    },
    {
      href: "/profile",
      label: "Profile",
      active: pathname === "/profile",
    },
  ]

  return (
    <div className="mr-4 flex">
      <nav className="flex items-center space-x-4 lg:space-x-6">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>
      {user && (
        <Button variant="ghost" onClick={logout} className="ml-4">
          Logout
        </Button>
      )}
    </div>
  )
}
