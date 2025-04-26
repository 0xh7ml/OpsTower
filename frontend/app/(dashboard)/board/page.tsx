import KanbanBoard from "@/components/kanban-board"

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kanban Board</h2>
        <p className="text-muted-foreground">Manage and organize your tasks with drag and drop</p>
      </div>

      <KanbanBoard />
    </div>
  )
}
