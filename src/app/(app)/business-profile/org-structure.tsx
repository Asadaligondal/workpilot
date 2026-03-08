"use client"

import { useTransition, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { saveDepartments, type DepartmentInput } from "./actions"
import { PlusIcon, Trash2Icon } from "lucide-react"

type Role = {
  id?: string
  title: string
  responsibilities: string
  toolsUsed: string
}

type Department = {
  id?: string
  name: string
  headCount: number | null
  manager: string
  roles: Role[]
}

type OrgStructureProps = {
  initialDepartments: {
    id: string
    name: string
    headCount: number | null
    manager: string
    roles: { id: string; title: string; responsibilities: string; toolsUsed: string }[]
  }[]
}

export function OrgStructure({ initialDepartments }: OrgStructureProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>(
    initialDepartments.map((d) => ({
      id: d.id,
      name: d.name,
      headCount: d.headCount,
      manager: d.manager,
      roles: d.roles.map((r) => ({
        id: r.id,
        title: r.title,
        responsibilities: r.responsibilities,
        toolsUsed: r.toolsUsed,
      })),
    }))
  )

  function addDepartment() {
    setDepartments((d) => [
      ...d,
      { name: "", headCount: null, manager: "", roles: [] },
    ])
  }

  function removeDepartment(index: number) {
    setDepartments((d) => d.filter((_, i) => i !== index))
  }

  function updateDepartment(index: number, updates: Partial<Department>) {
    setDepartments((d) =>
      d.map((dept, i) => (i === index ? { ...dept, ...updates } : dept))
    )
  }

  function addRole(deptIndex: number) {
    setDepartments((d) =>
      d.map((dept, i) =>
        i === deptIndex
          ? { ...dept, roles: [...dept.roles, { title: "", responsibilities: "", toolsUsed: "" }] }
          : dept
      )
    )
  }

  function removeRole(deptIndex: number, roleIndex: number) {
    setDepartments((d) =>
      d.map((dept, i) =>
        i === deptIndex
          ? { ...dept, roles: dept.roles.filter((_, ri) => ri !== roleIndex) }
          : dept
      )
    )
  }

  function updateRole(deptIndex: number, roleIndex: number, updates: Partial<Role>) {
    setDepartments((d) =>
      d.map((dept, i) =>
        i === deptIndex
          ? {
              ...dept,
              roles: dept.roles.map((r, ri) =>
                ri === roleIndex ? { ...r, ...updates } : r
              ),
            }
          : dept
      )
    )
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const payload: DepartmentInput[] = departments.map((d) => ({
        id: d.id,
        name: d.name,
        headCount: d.headCount,
        manager: d.manager,
        roles: d.roles.map((r) => ({
          id: r.id,
          title: r.title,
          responsibilities: r.responsibilities,
          toolsUsed: r.toolsUsed,
        })),
      }))
      const result = await saveDepartments(payload)
      if (!result.success) {
        setError(result.error ?? "Failed to save")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Departments</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDepartment}
          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
        >
          <PlusIcon className="size-4" />
          Add Department
        </Button>
      </div>

      <div className="space-y-6">
        {departments.map((dept, deptIndex) => (
          <div
            key={dept.id ?? deptIndex}
            className="rounded-lg border p-4 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Department Name</Label>
                  <Input
                    value={dept.name}
                    onChange={(e) =>
                      updateDepartment(deptIndex, { name: e.target.value })
                    }
                    placeholder="e.g. Operations"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Head Count</Label>
                  <Input
                    type="number"
                    min={0}
                    value={dept.headCount ?? ""}
                    onChange={(e) =>
                      updateDepartment(deptIndex, {
                        headCount: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manager</Label>
                  <Input
                    value={dept.manager}
                    onChange={(e) =>
                      updateDepartment(deptIndex, { manager: e.target.value })
                    }
                    placeholder="Manager name"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeDepartment(deptIndex)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Team Roles</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addRole(deptIndex)}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <PlusIcon className="size-4" />
                  Add Role
                </Button>
              </div>
              <div className="space-y-2">
                {dept.roles.map((role, roleIndex) => (
                  <div
                    key={role.id ?? roleIndex}
                    className="flex gap-2 rounded border bg-muted/30 p-3"
                  >
                    <div className="grid flex-1 gap-2 sm:grid-cols-3">
                      <Input
                        placeholder="Role title"
                        value={role.title}
                        onChange={(e) =>
                          updateRole(deptIndex, roleIndex, {
                            title: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Responsibilities"
                        value={role.responsibilities}
                        onChange={(e) =>
                          updateRole(deptIndex, roleIndex, {
                            responsibilities: e.target.value,
                          })
                        }
                      />
                      <Input
                        placeholder="Tools used (comma-separated)"
                        value={role.toolsUsed}
                        onChange={(e) =>
                          updateRole(deptIndex, roleIndex, {
                            toolsUsed: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRole(deptIndex, roleIndex)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
