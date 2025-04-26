"use client"

import { useState } from "react"
import { useKanban } from "./kanban-provider"
import RuleModal from "./rule-modal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDate } from "@/lib/utils"
import type { AutomationRule } from "@/lib/types"

export default function RulesList() {
  const { state, deleteRule, toggleRule } = useKanban()
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null)

  const openCreateRuleModal = () => {
    setEditingRule(null)
    setIsRuleModalOpen(true)
  }

  const openEditRuleModal = (rule: AutomationRule) => {
    setEditingRule(rule)
    setIsRuleModalOpen(true)
  }

  const closeRuleModal = () => {
    setIsRuleModalOpen(false)
    setEditingRule(null)
  }

  const confirmDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId)
  }

  const handleDeleteRule = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete)
      setRuleToDelete(null)
    }
  }

  const cancelDeleteRule = () => {
    setRuleToDelete(null)
  }

  const getOperatorText = (operator: AutomationRule["condition"]["operator"]) => {
    switch (operator) {
      case "equals":
        return "equals"
      case "not_equals":
        return "does not equal"
      case "contains":
        return "contains"
      case "not_contains":
        return "does not contain"
      case "starts_with":
        return "starts with"
      case "ends_with":
        return "ends with"
      default:
        return operator
    }
  }

  const getFieldText = (field: string) => {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Automation Rules</h2>
        <Button onClick={openCreateRuleModal} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {state.rules.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">No automation rules created yet.</p>
          <Button onClick={openCreateRuleModal} variant="outline" className="mt-4">
            Create your first rule
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  {getFieldText(rule.condition.field)} {getOperatorText(rule.condition.operator)} "
                  {rule.condition.value}"
                </TableCell>
                <TableCell>
                  Set {getFieldText(rule.action.field)} to "{rule.action.value}"
                </TableCell>
                <TableCell>{formatDate(rule.createdAt)}</TableCell>
                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditRuleModal(rule)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit rule</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDeleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete rule</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RuleModal isOpen={isRuleModalOpen} onClose={closeRuleModal} rule={editingRule} />

      <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && cancelDeleteRule()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this automation rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRule}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
