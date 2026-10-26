"use client"

import KanbanBoard from "./kanban-board"
import ProtectedPage from "./protected-page"

export default function ProtectedDashboard() {
  return (
    <ProtectedPage title="Task Management">
      <KanbanBoard />
    </ProtectedPage>
  )
}
