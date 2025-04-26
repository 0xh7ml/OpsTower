"use client"

import type { Task } from "@/lib/types"
import { Calendar, User, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useKanban } from "./kanban-provider"
import { formatDate } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: () => void
  isDragging?: boolean
}

export default function TaskCard({ task, onEdit, isDragging = false }: TaskCardProps) {
  const { deleteTask } = useKanban()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "low":
        return "bg-success text-success-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-primary text-primary-foreground"
      case "in-progress":
        return "bg-warning text-warning-foreground"
      case "completed":
        return "bg-success text-success-foreground"
      case "blocked":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card
      data-task-id={task.id}
      data-column-id={task.status}
      className={`shadow-sm hover:shadow-md transition-shadow ${isDragging ? "opacity-40" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium">{task.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>

          <Badge variant="outline" className={getStatusColor(task.status)}>
            {task.status === "todo"
              ? "To Do"
              : task.status === "in-progress"
                ? "In Progress"
                : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </Badge>
        </div>

        <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(task.dueDate)}
          </div>
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            {task.assignee}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
