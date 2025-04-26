"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("kanban-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if user exists in mock data
    const foundUser = mockUsers.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("kanban-user", JSON.stringify(foundUser))
      toast.success("Logged in successfully")
      return true
    } else {
      toast.error("Invalid email or password")
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if user already exists
    const userExists = mockUsers.some((u) => u.email === email)

    if (userExists) {
      toast.error("User with this email already exists")
      return false
    }

    // Create new user
    const newUser: User = {
      id: `user-${mockUsers.length + 1}`,
      name,
      email,
      password,
    }

    // Add to mock users (in a real app, this would be an API call)
    mockUsers.push(newUser)

    // Set as current user
    setUser(newUser)
    localStorage.setItem("kanban-user", JSON.stringify(newUser))

    toast.success("Registration successful")
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("kanban-user")
    router.push("/login")
    toast.success("Logged out successfully")
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!user) {
      toast.error("You must be logged in to update your profile")
      return false
    }

    // Update user data
    const updatedUser = { ...user, ...data }

    // Update in mock users
    const userIndex = mockUsers.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser
    }

    // Update current user
    setUser(updatedUser)
    localStorage.setItem("kanban-user", JSON.stringify(updatedUser))

    toast.success("Profile updated successfully")
    return true
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
