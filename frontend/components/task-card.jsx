"use client"

import { Calendar, MoreHorizontal, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useKanban } from "./kanban-provider"
import { formatDate, isTaskOverdue } from "@/lib/utils"

export default function TaskCard({ task, onEdit, isDragging = false, onDragStart, onDragEnd }) {
  const { deleteTask } = useKanban()
  const isOverdue = isTaskOverdue(task)

  const getPriorityColor = (priority) => {
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

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(task.id)
      } catch (error) {
        // Error is handled in the provider
      }
    }
  }

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-task-id={task.id}
      data-column-id={task.status}
      className={`shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      } ${isOverdue ? "border-red-300 bg-red-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{task.title}</h3>
            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" title="Overdue task" />}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
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
          <div className={`flex items-center ${isOverdue ? "text-red-600 font-medium" : ""}`}>
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(task.due_date)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
