import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString) {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  } catch (error) {
    return "Invalid date"
  }
}

export function isTaskOverdue(task) {
  try {
    const dueDate = new Date(task.due_date)
    const now = new Date()
    // Remove time component for comparison
    dueDate.setHours(23, 59, 59, 999)
    now.setHours(0, 0, 0, 0)
    return dueDate < now && task.status !== "completed" && task.status !== "blocked"
  } catch (error) {
    return false
  }
}

export function getOverdueTasks(tasks) {
  return tasks.filter(isTaskOverdue)
}

// Map API status to display status
export function mapApiStatus(apiStatus) {
  const statusMap = {
    TODO: "todo",
    "IN PROGRESS": "in-progress",
    COMPLETED: "completed",
    BLOCKED: "blocked",
  }
  return statusMap[apiStatus] || "todo"
}

// Map display status to API status
export function mapDisplayStatus(displayStatus) {
  const statusMap = {
    todo: "TODO",
    "in-progress": "IN PROGRESS",
    completed: "COMPLETED",
    blocked: "BLOCKED",
  }
  return statusMap[displayStatus] || "TODO"
}

// Map API priority to display priority
export function mapApiPriority(apiPriority) {
  return apiPriority ? apiPriority.toLowerCase() : "medium"
}

// Map display priority to API priority
export function mapDisplayPriority(displayPriority) {
  return displayPriority.toUpperCase()
}
