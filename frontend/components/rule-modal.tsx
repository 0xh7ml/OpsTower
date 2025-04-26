"use client"

import { useState, useEffect } from "react"
import { useKanban } from "./kanban-provider"
import type { AutomationRule } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  rule: AutomationRule | null
}

export default function RuleModal({ isOpen, onClose, rule }: RuleModalProps) {
  const { addRule, updateRule } = useKanban()
  const [name, setName] = useState("")
  const [conditionField, setConditionField] = useState<string>("status")
  const [conditionOperator, setConditionOperator] = useState<AutomationRule["condition"]["operator"]>("equals")
  const [conditionValue, setConditionValue] = useState("")
  const [actionField, setActionField] = useState<string>("status")
  const [actionValue, setActionValue] = useState("")
  const [enabled, setEnabled] = useState(true)

  // Reset form when modal opens/closes or rule changes
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        setName(rule.name)
        setConditionField(rule.condition.field)
        setConditionOperator(rule.condition.operator)
        setConditionValue(rule.condition.value)
        setActionField(rule.action.field)
        setActionValue(rule.action.value)
        setEnabled(rule.enabled)
      } else {
        setName("")
        setConditionField("status")
        setConditionOperator("equals")
        setConditionValue("")
        setActionField("status")
        setActionValue("")
        setEnabled(true)
      }
    }
  }, [isOpen, rule])

  const handleSubmit = () => {
    if (!name.trim() || !conditionValue.trim() || !actionValue.trim()) return

    const ruleData = {
      name,
      condition: {
        field: conditionField as keyof AutomationRule["condition"]["field"],
        operator: conditionOperator,
        value: conditionValue,
      },
      action: {
        field: actionField as keyof AutomationRule["action"]["field"],
        value: actionValue,
      },
      enabled,
    }

    if (rule) {
      updateRule({ ...ruleData, id: rule.id, createdAt: rule.createdAt })
    } else {
      addRule(ruleData)
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Rule" : "Create New Rule"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Rule Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" />
          </div>

          <div className="grid gap-2">
            <Label>Condition</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={conditionField} onValueChange={setConditionField}>
                <SelectTrigger>
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={conditionOperator}
                onValueChange={(value) => setConditionOperator(value as AutomationRule["condition"]["operator"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not_contains">Not Contains</SelectItem>
                  <SelectItem value="starts_with">Starts With</SelectItem>
                  <SelectItem value="ends_with">Ends With</SelectItem>
                </SelectContent>
              </Select>

              {conditionField === "status" ? (
                <Select value={conditionValue} onValueChange={setConditionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              ) : conditionField === "priority" ? (
                <Select value={conditionValue} onValueChange={setConditionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={conditionValue} onChange={(e) => setConditionValue(e.target.value)} placeholder="Value" />
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Action</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={actionField} onValueChange={setActionField}>
                <SelectTrigger>
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                </SelectContent>
              </Select>

              {actionField === "status" ? (
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              ) : actionField === "priority" ? (
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="Value" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="enabled">Rule Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{rule ? "Update Rule" : "Create Rule"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
