"use client"

import type React from "react"

import { createContext, useContext, useReducer, useCallback } from "react"
import type { Task, AutomationRule } from "@/lib/types"
import { mockTasks, mockRules } from "@/lib/mock-data"
import { toast } from "react-hot-toast"

// Define fixed columns
const FIXED_COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-primary" },
  { id: "in-progress", title: "In Progress", color: "bg-warning" },
  { id: "completed", title: "Completed", color: "bg-success" },
  { id: "blocked", title: "Blocked", color: "bg-destructive" },
]

type KanbanState = {
  tasks: Task[]
  rules: AutomationRule[]
}

type KanbanAction =
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; task: Task }
  | { type: "DELETE_TASK"; taskId: string }
  | { type: "MOVE_TASK"; taskId: string; destinationColumn: string }
  | { type: "ADD_RULE"; rule: AutomationRule }
  | { type: "UPDATE_RULE"; rule: AutomationRule }
  | { type: "DELETE_RULE"; ruleId: string }
  | { type: "TOGGLE_RULE"; ruleId: string }
  | { type: "LOAD_DATA"; data: { tasks: Task[]; rules: AutomationRule[] } }

type KanbanContextType = {
  state: KanbanState
  columns: typeof FIXED_COLUMNS
  addTask: (task: Omit<Task, "id" | "createdAt">) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string) => void
  moveTask: (taskId: string, destinationColumn: string) => void
  addRule: (rule: Omit<AutomationRule, "id" | "createdAt">) => void
  updateRule: (rule: AutomationRule) => void
  deleteRule: (ruleId: string) => void
  toggleRule: (ruleId: string) => void
  saveData: () => void
  loadData: () => void
  applyRules: (task: Task) => Task
}

const initialState: KanbanState = {
  tasks: [],
  rules: [],
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
    case "ADD_RULE":
      return {
        ...state,
        rules: [...state.rules, action.rule],
      }
    case "UPDATE_RULE":
      return {
        ...state,
        rules: state.rules.map((rule) => (rule.id === action.rule.id ? action.rule : rule)),
      }
    case "DELETE_RULE":
      return {
        ...state,
        rules: state.rules.filter((rule) => rule.id !== action.ruleId),
      }
    case "TOGGLE_RULE":
      return {
        ...state,
        rules: state.rules.map((rule) => (rule.id === action.ruleId ? { ...rule, enabled: !rule.enabled } : rule)),
      }
    case "LOAD_DATA":
      return action.data
    default:
      return state
  }
}

export function KanbanProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(kanbanReducer, {
    ...initialState,
    tasks: mockTasks,
    rules: mockRules,
  })

  // Apply automation rules to a task
  const applyRules = useCallback(
    (task: Task): Task => {
      let updatedTask = { ...task }

      // Only apply enabled rules
      const enabledRules = state.rules.filter((rule) => rule.enabled)

      for (const rule of enabledRules) {
        const { condition, action } = rule
        const taskValue = updatedTask[condition.field]

        let conditionMet = false

        switch (condition.operator) {
          case "equals":
            conditionMet = taskValue === condition.value
            break
          case "not_equals":
            conditionMet = taskValue !== condition.value
            break
          case "contains":
            conditionMet = typeof taskValue === "string" && taskValue.includes(condition.value)
            break
          case "not_contains":
            conditionMet = typeof taskValue === "string" && !taskValue.includes(condition.value)
            break
          case "starts_with":
            conditionMet = typeof taskValue === "string" && taskValue.startsWith(condition.value)
            break
          case "ends_with":
            conditionMet = typeof taskValue === "string" && taskValue.endsWith(condition.value)
            break
        }

        if (conditionMet) {
          updatedTask = {
            ...updatedTask,
            [action.field]: action.value,
          }
        }
      }

      return updatedTask
    },
    [state.rules],
  )

  const addTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...taskData,
    }

    // Apply rules before adding
    const processedTask = applyRules(newTask)

    dispatch({ type: "ADD_TASK", task: processedTask })
    toast.success("Task added successfully")
  }

  const updateTask = (task: Task) => {
    // Apply rules before updating
    const processedTask = applyRules(task)

    dispatch({ type: "UPDATE_TASK", task: processedTask })
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

    // Find the task
    const task = state.tasks.find((t) => t.id === taskId)

    if (task) {
      // Update the task status to match the column
      const updatedTask = {
        ...task,
        status: destinationColumn as Task["status"],
      }

      // Apply rules after updating status
      const processedTask = applyRules(updatedTask)

      // If the rules changed the status, we need to update the task with the new status
      if (processedTask.status !== destinationColumn) {
        dispatch({ type: "UPDATE_TASK", task: processedTask })

        const columnTitle = FIXED_COLUMNS.find((c) => c.id === processedTask.status)?.title || processedTask.status
        toast.info(`Task moved to ${columnTitle} based on automation rules`)
      } else {
        dispatch({ type: "MOVE_TASK", taskId, destinationColumn })

        const columnTitle = FIXED_COLUMNS.find((c) => c.id === destinationColumn)?.title || destinationColumn
        toast.success(`Task moved to ${columnTitle}`)
      }
    }
  }

  const addRule = (ruleData: Omit<AutomationRule, "id" | "createdAt">) => {
    const newRule: AutomationRule = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...ruleData,
    }
    dispatch({ type: "ADD_RULE", rule: newRule })
    toast.success("Rule added successfully")
  }

  const updateRule = (rule: AutomationRule) => {
    dispatch({ type: "UPDATE_RULE", rule })
    toast.success("Rule updated successfully")
  }

  const deleteRule = (ruleId: string) => {
    dispatch({ type: "DELETE_RULE", ruleId })
    toast.success("Rule deleted successfully")
  }

  const toggleRule = (ruleId: string) => {
    dispatch({ type: "TOGGLE_RULE", ruleId })
    const rule = state.rules.find((r) => r.id === ruleId)
    if (rule) {
      toast.success(`Rule ${rule.enabled ? "disabled" : "enabled"} successfully`)
    }
  }

  const saveData = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "kanban-data",
        JSON.stringify({
          tasks: state.tasks,
          rules: state.rules,
        }),
      )
      toast.success("Project data saved successfully")
    }
  }

  const loadData = () => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("kanban-data")
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
        addRule,
        updateRule,
        deleteRule,
        toggleRule,
        saveData,
        loadData,
        applyRules,
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
