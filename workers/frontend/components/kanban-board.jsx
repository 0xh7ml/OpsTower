"use client"

import { useState } from "react"
import { useKanban } from "./kanban-provider"
import TaskCard from "./task-card"
import TaskModal from "./task-modal"
import { Button } from "@/components/ui/button"
import { PlusCircle, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compareByPosition } from "@/lib/utils"

export default function KanbanBoard() {
  const { state, reorderTasks, fetchTasks, checkOverdueTasks } = useKanban()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)
  // where the dragged card would land inside the hovered column (index among the other cards)
  const [dropIndex, setDropIndex] = useState(null)

  // Tasks in manual (drag) order
  const getSortedTasks = (columnId) => {
    return state.tasks
      .filter((task) => task.status === columnId)
      .sort(compareByPosition)
  }

  // Handle drag start
  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  // Handle drag over column: remember the column and where between its cards the pointer is
  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    setDragOverColumnId(columnId)

    const cards = [...e.currentTarget.querySelectorAll("[data-task-id]")].filter(
      (el) => Number(el.dataset.taskId) !== draggedTask?.id,
    )
    let index = cards.length
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect()
      if (e.clientY < rect.top + rect.height / 2) {
        index = i
        break
      }
    }
    setDropIndex(index)
  }

  // Handle drop on column: insert at the hovered slot, renumber, and persist what changed
  const handleDrop = async (e, columnId) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling

    const task = draggedTask
    const targetTasks = getSortedTasks(columnId).filter((t) => t.id !== task?.id)
    const index = Math.min(dropIndex ?? targetTasks.length, targetTasks.length)

    resetDrag()
    if (!task) return

    const ordered = [...targetTasks]
    ordered.splice(index, 0, task)

    const items = []
    ordered.forEach((t, position) => {
      const changed = t.id === task.id ? t.status !== columnId || t.position !== position : t.position !== position
      if (changed) items.push({ id: t.id, status: columnId, position })
    })

    // leaving another column: close the gap there
    if (task.status !== columnId) {
      getSortedTasks(task.status)
        .filter((t) => t.id !== task.id)
        .forEach((t, position) => {
          if (t.position !== position) items.push({ id: t.id, status: t.status, position })
        })
    }

    await reorderTasks(items)
  }

  const resetDrag = () => {
    setDraggedTask(null)
    setDragOverColumnId(null)
    setDropIndex(null)
  }

  // Handle drag end (cleanup)
  const handleDragEnd = resetDrag

  // Cards of a column with the drop indicator slotted in at the hovered position
  const renderColumnTasks = (columnId) => {
    const columnTasks = getSortedTasks(columnId)
    const showIndicator =
      draggedTask && dragOverColumnId === columnId && dropIndex !== null && columnTasks.length > 0
    const nodes = []
    let slot = 0

    columnTasks.forEach((task) => {
      const isDragged = draggedTask?.id === task.id
      if (!isDragged) {
        if (showIndicator && slot === dropIndex) nodes.push(<DropIndicator key="drop-indicator" />)
        slot++
      }
      nodes.push(
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => openEditTaskModal(task)}
          isDragging={isDragged}
          onDragStart={() => handleDragStart(task)}
          onDragEnd={handleDragEnd}
        />,
      )
    })
    if (showIndicator && dropIndex >= slot) nodes.push(<DropIndicator key="drop-indicator" />)
    return nodes
  }

  const openCreateTaskModal = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleRefresh = async () => {
    try {
      await fetchTasks()
      await checkOverdueTasks()
    } catch (error) {
      // Error is handled in the provider
    }
  }

  if (state.loading && state.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={openCreateTaskModal} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            disabled={state.loading}
          >
            <RefreshCw className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={checkOverdueTasks} variant="outline" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Check Overdue
          </Button>
        </div>
      </div>

      <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 snap-x">
        {state.columns.map((column) => (
          <div
            key={column.id}
            className={`border rounded-lg p-3 bg-muted/30 min-w-[280px] max-w-[300px] flex-shrink-0 snap-start ${
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
                  {getSortedTasks(column.id).length}
                </div>
              </div>
            </div>

            <div
              className={`space-y-2 min-h-[200px] p-1.5 rounded-md transition-colors ${
                dragOverColumnId === column.id ? "bg-accent/20 outline outline-2 outline-dashed outline-accent/50" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              data-column-id={column.id}
            >
              {renderColumnTasks(column.id)}

              {/* Empty state for columns with no tasks */}
              {getSortedTasks(column.id).length === 0 && (
                <div
                  className={`flex items-center justify-center h-40 border-2 border-dashed rounded-md ${
                    dragOverColumnId === column.id ? "bg-accent/20 border-primary/30" : "border-muted-foreground/20"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
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

// Takes no layout space (negative margin cancels the list gap) so cards don't jump while dragging
function DropIndicator() {
  return (
    <div className="relative h-0 -mb-2 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-x-0 -top-1 h-0.5 rounded bg-primary" />
    </div>
  )
}
