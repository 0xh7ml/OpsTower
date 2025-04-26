"use client"

import type React from "react"

import { createContext, useContext, useReducer } from "react"
import type { Task } from "@/lib/types"
import { mockTasks } from "@/lib/mock-data"
import { toast } from "react-hot-toast"

// Define fixed columns
const FIXED_COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "completed", title: "Completed", color: "bg-green-500" },
  { id: "blocked", title: "Blocked", color: "bg-red-500" },
]

type KanbanState = {
  tasks: Task[]
}

type KanbanAction =
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; task: Task }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "MOVE_TASK"; taskId: string; destinationColumn: string }
  | { type: "LOAD_DATA"; data: Task[] }

type KanbanContextType = {
  state: KanbanState
  columns: typeof FIXED_COLUMNS
  addTask: (task: Omit<Task, "id" | "createdAt">) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string) => void
  moveTask: (taskId: string, destinationColumn: string) => void
  saveData: () => void
  loadData: () => void
}

const initialState: KanbanState = {
  tasks: [],
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined)

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.task],
      }
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
    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id === action.taskId) {
            return { ...task, status: action.destinationColumn as Task["status"] }
          }
          return task
        }),
      }
    case "LOAD_DATA":
      return {
        ...state,
        tasks: action.data,
      }
    default:
      return state
  }
}

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, {
    ...initialState,
    tasks: mockTasks,
  })

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...taskData,
    }
    dispatch({ type: "ADD_TASK", task: newTask })
    toast.success("Task added successfully")
  }

  const updateTask = (task: Task) => {
    dispatch({ type: "UPDATE_TASK", task })
    toast.success("Task updated successfully")
  }

  const deleteTask = (taskId: string) => {
    dispatch({ type: "DELETE_TASK", taskId })
    toast.success("Task deleted successfully")
  }

  const moveTask = (taskId: string, destinationColumn: string) => {
    // Validate that the destination column exists
    const destinationColumnExists = FIXED_COLUMNS.some((col) => col.id === destinationColumn)

    if (!destinationColumnExists) {
      toast.error(`Column "${destinationColumn}" does not exist`)
      return
    }

    dispatch({ type: "MOVE_TASK", taskId, destinationColumn })

    const columnTitle = FIXED_COLUMNS.find((c) => c.id === destinationColumn)?.title || destinationColumn
    toast.success(`Task moved to ${columnTitle}`)
  }

  const saveData = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kanban-tasks", JSON.stringify(state.tasks))
      toast.success("Project data saved successfully")
    }
  }

  const loadData = () => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("kanban-tasks")
      if (savedData) {
        dispatch({ type: "LOAD_DATA", data: JSON.parse(savedData) })
        toast.success("Project data loaded successfully")
      } else {
        toast.error("No saved data found")
      }
    }
  }

  return (
    <KanbanContext.Provider
      value={{
        state,
        columns: FIXED_COLUMNS,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        saveData,
        loadData,
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
