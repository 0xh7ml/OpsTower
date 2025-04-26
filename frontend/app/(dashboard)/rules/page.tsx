import RulesList from "@/components/rules-list"

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automation Rules</h2>
        <p className="text-muted-foreground">Create rules to automate task management</p>
      </div>

      <RulesList />
    </div>
  )
}
