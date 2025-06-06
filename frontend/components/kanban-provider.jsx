"use client"

import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import { apiClient, getAuthToken, removeAuthToken, setAuthToken } from "@/lib/api"
import { getOverdueTasks, mapApiStatus, mapDisplayStatus, mapApiPriority, mapDisplayPriority } from "@/lib/utils"
import { toast } from "react-hot-toast"

const fixedColumns = [
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
  { id: "blocked", title: "Blocked", color: "bg-red-500" },
]

const initialState = {
  tasks: [],
  columns: fixedColumns,
  loading: false,
  error: null,
  user: null,
  isAuthenticated: false,
}

const KanbanContext = createContext(undefined)

function kanbanReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading }
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false }
    case "SET_TASKS":
      return { ...state, tasks: action.tasks, loading: false, error: null }
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] }
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.task.id ? action.task : task)),
      }
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
      }
    case "MOVE_TASK_TO_BLOCKED":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          const blockedTask = action.tasks.find((t) => t.id === task.id)
          return blockedTask ? blockedTask : task
        }),
      }
    case "SET_USER":
      return { ...state, user: action.user, isAuthenticated: true }
    case "LOGOUT":
      return { ...state, user: null, isAuthenticated: false, tasks: [] }
    default:
      return state
  }
}

// Transform API task to display format
function transformApiTask(apiTask) {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    status: mapApiStatus(apiTask.status),
    priority: mapApiPriority(apiTask.priority),
    due_date: apiTask.due_date,
    assigned_to: apiTask.assigned_to,
    created_at: apiTask.created_at,
    updated_at: apiTask.updated_at,
  }
}

// Transform display task to API format
function transformDisplayTask(displayTask) {
  return {
    title: displayTask.title,
    description: displayTask.description,
    status: mapDisplayStatus(displayTask.status),
    priority: mapDisplayPriority(displayTask.priority),
    due_date: displayTask.due_date,
    assigned_to: displayTask.assigned_to || "system", // Default value
  }
}

export function KanbanProvider({ children }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState)

  const fetchTasks = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", loading: true })
      const apiTasks = await apiClient.getTasks()
      const transformedTasks = apiTasks.map(transformApiTask)
      dispatch({ type: "SET_TASKS", tasks: transformedTasks })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch tasks"
      dispatch({ type: "SET_ERROR", error: errorMessage })
      toast.error(errorMessage)
    }
  }, [])

  const addTask = async (taskData) => {
    try {
      const apiTaskData = transformDisplayTask(taskData)
      const newApiTask = await apiClient.createTask(apiTaskData)
      const newTask = transformApiTask(newApiTask)
      dispatch({ type: "ADD_TASK", task: newTask })
      toast.success("Task created successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task"
      toast.error(errorMessage)
      throw error
    }
  }

  const updateTask = async (task) => {
    try {
      const apiTaskData = transformDisplayTask(task)
      const updatedApiTask = await apiClient.updateTask(task.id, apiTaskData)
      const updatedTask = transformApiTask(updatedApiTask)
      dispatch({ type: "UPDATE_TASK", task: updatedTask })
      toast.success("Task updated successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task"
      toast.error(errorMessage)
      throw error
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await apiClient.deleteTask(taskId)
      dispatch({ type: "DELETE_TASK", taskId })
      toast.success("Task deleted successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task"
      toast.error(errorMessage)
      throw error
    }
  }

  const moveTask = async (taskId, newStatus) => {
    try {
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return

      const updatedTask = { ...task, status: newStatus }
      const apiTaskData = transformDisplayTask(updatedTask)
      const updatedApiTask = await apiClient.updateTask(taskId, apiTaskData)
      const transformedTask = transformApiTask(updatedApiTask)

      dispatch({ type: "UPDATE_TASK", task: transformedTask })

      const columnTitle = fixedColumns.find((c) => c.id === newStatus)?.title || newStatus
      toast.success(`Task moved to ${columnTitle}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to move task"
      toast.error(errorMessage)
      throw error
    }
  }

  const checkOverdueTasks = useCallback(async () => {
    try {
      const overdueTasks = getOverdueTasks(state.tasks)

      if (overdueTasks.length > 0) {
        const blockedTasks = []

        for (const task of overdueTasks) {
          try {
            const updatedTask = { ...task, status: "blocked" }
            const apiTaskData = transformDisplayTask(updatedTask)
            const updatedApiTask = await apiClient.updateTask(task.id, apiTaskData)
            const transformedTask = transformApiTask(updatedApiTask)
            blockedTasks.push(transformedTask)
          } catch (error) {
            console.error(`Failed to move overdue task ${task.id} to blocked:`, error)
          }
        }

        if (blockedTasks.length > 0) {
          dispatch({ type: "MOVE_TASK_TO_BLOCKED", tasks: blockedTasks })
          toast.success(`${blockedTasks.length} overdue task(s) moved to Blocked`)
        }
      }
    } catch (error) {
      console.error("Error checking overdue tasks:", error)
    }
  }, [state.tasks])

  const login = async (username, password) => {
    try {
      dispatch({ type: "SET_LOADING", loading: true })
      const response = await apiClient.login(username, password)
      setAuthToken(response.access)
      // You might want to fetch user info here if your API provides it
      dispatch({ type: "SET_USER", user: { username } })
      await fetchTasks()
      toast.success("Login successful")
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"
      dispatch({ type: "SET_ERROR", error: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  const signup = async (email, password, firstName, lastName) => {
    try {
      dispatch({ type: "SET_LOADING", loading: true })
      const response = await apiClient.signup(email, password, firstName, lastName)
      toast.success("Account created successfully. Please login.")
      dispatch({ type: "SET_LOADING", loading: false })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed"
      dispatch({ type: "SET_ERROR", error: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = () => {
    removeAuthToken()
    dispatch({ type: "LOGOUT" })
    toast.success("Logged out successfully")
  }

  // Fetch tasks on mount - only on client side
  useEffect(() => {
    if (typeof window === "undefined") return

    const token = getAuthToken()
    if (token) {
      dispatch({ type: "SET_USER", user: { username: "User" } })
      fetchTasks()
    }
  }, [fetchTasks])

  // Check for overdue tasks - only on client side and when tasks change
  useEffect(() => {
    if (typeof window === "undefined") return
    if (state.tasks.length === 0) return

    // Run once immediately
    checkOverdueTasks()

    // Then set up interval
    const interval = setInterval(checkOverdueTasks, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [checkOverdueTasks])

  return (
    <KanbanContext.Provider
      value={{
        state,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        checkOverdueTasks,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </KanbanContext.Provider>
  )
}

export function useKanban() {
  const context = useContext(KanbanContext)
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider")
  }
  return context
}
