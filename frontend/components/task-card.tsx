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
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-slate-500 hover:bg-slate-600"
    }
  }

  return (
    <Card
      draggable
      data-task-id={task.id}
      data-column-id={task.status}
      className={`shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
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
              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
        </Badge>

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
