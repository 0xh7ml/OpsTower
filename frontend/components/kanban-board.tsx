"use client"

import type React from "react"

import { useState } from "react"
import { useKanban } from "./kanban-provider"
import TaskCard from "./task-card"
import TaskModal from "./task-modal"
import { Button } from "@/components/ui/button"
import { PlusCircle, Save, RotateCcw } from "lucide-react"
import type { Task } from "@/lib/types"

export default function KanbanBoard() {
  const { state, columns, moveTask, saveData, loadData } = useKanban()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task)

    // Set drag image and data
    e.dataTransfer.setData("text/plain", task.id)
    e.dataTransfer.effectAllowed = "move"

    // Add a class to the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add("opacity-50")
    }
  }

  // Handle drag over column
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumnId(columnId)
  }

  // Handle drop on column
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault()

    if (!draggedTask) return

    // Only move if the task is being moved to a different column
    if (draggedTask.status !== columnId) {
      moveTask(draggedTask.id, columnId)
    }

    // Reset drag state
    setDraggedTask(null)
    setDragOverColumnId(null)
  }

  // Handle drag end (cleanup)
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("opacity-50")
    }

    setDraggedTask(null)
    setDragOverColumnId(null)
  }

  const openCreateTaskModal = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={openCreateTaskModal} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveData} variant="outline" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Project
          </Button>
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Load Project
          </Button>
        </div>
      </div>

      <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 snap-x">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`border rounded-lg p-3 bg-muted/30 min-w-[250px] max-w-[280px] flex-shrink-0 snap-start ${
              dragOverColumnId === column.id ? "ring-2 ring-primary/40 bg-accent/10" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            data-column-id={column.id}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
                <h2 className="font-semibold">{column.title}</h2>
                <div className="ml-2 bg-muted rounded-full px-2 py-0.5 text-xs">
                  {state.tasks.filter((task) => task.status === column.id).length}
                </div>
              </div>
            </div>

            <div
              className={`space-y-2 min-h-[200px] p-1.5 rounded-md transition-colors ${
                dragOverColumnId === column.id ? "bg-accent/20 outline outline-2 outline-dashed outline-accent/50" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              data-column-id={column.id}
            >
              {state.tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}>
                    <TaskCard
                      task={task}
                      onEdit={() => openEditTaskModal(task)}
                      isDragging={draggedTask?.id === task.id}
                    />
                  </div>
                ))}

              {/* Empty state for columns with no tasks */}
              {state.tasks.filter((task) => task.status === column.id).length === 0 && (
                <div
                  className={`flex items-center justify-center h-40 border-2 border-dashed rounded-md ${
                    dragOverColumnId === column.id ? "bg-accent/20 border-primary/30" : "border-muted-foreground/20"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                  data-column-id={column.id}
                  data-empty-column="true"
                >
                  <p className="text-sm text-muted-foreground">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskModal isOpen={isTaskModalOpen} onClose={closeTaskModal} task={editingTask} />
    </div>
  )
}
