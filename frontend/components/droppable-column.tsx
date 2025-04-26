"use client"

import { useDroppable } from "@dnd-kit/core"
import type { Column, Task } from "@/lib/types"
import TaskCard from "./task-card"

interface DroppableColumnProps {
  column: Column
  tasks: Task[]
  onEditTask: (task: Task) => void
  activeTaskId: string | null
}

export default function DroppableColumn({ column, tasks, onEditTask, activeTaskId }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  })

  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-[200px] p-1 ${isOver ? "bg-accent/50 rounded-md" : ""}`}>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task)} isDragging={activeTaskId === task.id} />
      ))}

      {/* Empty space to ensure column is always a valid drop target */}
      <div className="h-full min-h-[50px] w-full"></div>
    </div>
  )
}
