"use client"

import { useState, useEffect } from "react"
import { useKanban } from "./kanban-provider"
import type { Column } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ColumnModalProps {
  isOpen: boolean
  onClose: () => void
  column: Column | null
}

const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-orange-500", label: "Orange" },
]

export default function ColumnModal({ isOpen, onClose, column }: ColumnModalProps) {
  const { addColumn, updateColumn } = useKanban()
  const [title, setTitle] = useState("")
  const [color, setColor] = useState("bg-blue-500")

  // Reset form when modal opens/closes or column changes
  useEffect(() => {
    if (isOpen) {
      if (column) {
        setTitle(column.title)
        setColor(column.color)
      } else {
        setTitle("")
        setColor("bg-blue-500")
      }
    }
  }, [isOpen, column])

  const handleSubmit = () => {
    if (!title.trim()) return

    const columnData = {
      title,
      color,
    }

    if (column) {
      updateColumn({ ...columnData, id: column.id })
    } else {
      addColumn(columnData)
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{column ? "Edit Column" : "Create New Column"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Column title" />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <RadioGroup value={color} onValueChange={setColor} className="grid grid-cols-4 gap-2">
              {colorOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <Label
                    htmlFor={option.value}
                    className={`w-full h-8 rounded-md cursor-pointer flex items-center justify-center border-2 ${
                      color === option.value ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${option.value}`}></div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{column ? "Update Column" : "Create Column"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
