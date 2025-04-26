"use client"

import { useState } from "react"
import { useKanban } from "./kanban-provider"
import TaskCard from "./task-card"
import TaskModal from "./task-modal"
import { Button } from "@/components/ui/button"
import { PlusCircle, Save, RotateCcw } from "lucide-react"
import type { Task } from "@/lib/types"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToParentElement } from "@dnd-kit/modifiers"
import type { DragEndEvent } from "@dnd-kit/core"

export default function KanbanBoard() {
  const { state, columns, moveTask, saveData, loadData } = useKanban()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const taskId = active.id as string
      const destinationColumn = over.id as string

      // Get the current task
      const task = state.tasks.find((t) => t.id === taskId)

      if (task && task.status !== destinationColumn) {
        moveTask(taskId, destinationColumn)
      }
    }

    setActiveId(null)
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToParentElement]}
        onDragStart={(event) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 snap-x">
          {columns.map((column) => (
            <div
              key={column.id}
              id={column.id}
              className="border rounded-lg p-3 bg-muted/30 min-w-[250px] max-w-[280px] flex-shrink-0 snap-start"
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

              <div className="space-y-2 min-h-[200px] p-1.5 rounded-md transition-colors" data-column-id={column.id}>
                {state.tasks
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => openEditTaskModal(task)}
                      isDragging={activeId === task.id}
                    />
                  ))}

                {/* Empty state for columns with no tasks */}
                {state.tasks.filter((task) => task.status === column.id).length === 0 && (
                  <div
                    className="flex items-center justify-center h-40 border-2 border-dashed rounded-md border-muted-foreground/20"
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
      </DndContext>

      <TaskModal isOpen={isTaskModalOpen} onClose={closeTaskModal} task={editingTask} />
    </div>
  )
}
