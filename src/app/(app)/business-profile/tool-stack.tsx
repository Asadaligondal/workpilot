"use client"

import { useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { saveToolStack, type ToolStackItemInput } from "./actions"
import { PlusIcon, Trash2Icon } from "lucide-react"

type ToolItem = {
  id?: string
  name: string
  category: string
  monthlyBudget: number | null
  satisfaction: number | null
  notes: string
}

type ToolStackProps = {
  initialItems: {
    id: string
    name: string
    category: string
    monthlyBudget: number | null
    satisfaction: number | null
    notes: string
  }[]
}

const categories = [
  "CRM",
  "Project Management",
  "Communication",
  "Accounting",
  "Marketing",
  "HR",
  "Development",
  "Design",
  "Other",
]

export function ToolStack({ initialItems }: ToolStackProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ToolItem[]>(
    initialItems.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      monthlyBudget: t.monthlyBudget,
      satisfaction: t.satisfaction,
      notes: t.notes,
    }))
  )

  const totalMonthlySpend = items.reduce(
    (sum, i) => sum + (i.monthlyBudget ?? 0),
    0
  )

  function addTool() {
    setItems((i) => [
      ...i,
      { name: "", category: "", monthlyBudget: null, satisfaction: null, notes: "" },
    ])
  }

  function removeItem(index: number) {
    setItems((i) => i.filter((_, idx) => idx !== index))
  }

  function updateItem(index: number, updates: Partial<ToolItem>) {
    setItems((i) =>
      i.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    )
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const payload: ToolStackItemInput[] = items.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        monthlyBudget: t.monthlyBudget,
        satisfaction: t.satisfaction,
        notes: t.notes,
      }))
      const result = await saveToolStack(payload)
      if (!result.success) {
        setError(result.error ?? "Failed to save")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tools</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTool}
          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
        >
          <PlusIcon className="size-4" />
          Add Tool
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Category</th>
              <th className="px-4 py-2 text-left font-medium">Monthly Budget</th>
              <th className="px-4 py-2 text-left font-medium">Satisfaction</th>
              <th className="px-4 py-2 text-left font-medium">Notes</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id ?? index} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="Tool name"
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={item.category}
                    onChange={(e) =>
                      updateItem(index, { category: e.target.value })
                    }
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.monthlyBudget ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        monthlyBudget: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="0"
                    className="h-8 w-24"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={item.satisfaction ?? ""}
                    onChange={(e) =>
                      updateItem(index, {
                        satisfaction: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                    className="h-8 w-16 rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={item.notes}
                    onChange={(e) => updateItem(index, { notes: e.target.value })}
                    placeholder="Notes"
                    className="h-8 min-w-[120px]"
                  />
                </td>
                <td className="px-2 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="size-8 text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm font-medium">
          Total monthly spend:{" "}
          <span className="text-indigo-600">
            ${totalMonthlySpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button
        onClick={handleSave}
        disabled={isPending}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
