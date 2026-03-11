"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchIcon, LayoutGrid, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"

export function OpportunityFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get("type") ?? "all"
  const status = searchParams.get("status") ?? "all"
  const quadrant = searchParams.get("quadrant") ?? "all"
  const searchFromUrl = searchParams.get("search") ?? ""
  const view = (searchParams.get("view") ?? "grid") as "grid" | "table"
  const [search, setSearch] = useState(searchFromUrl)

  useEffect(() => {
    setSearch(searchFromUrl)
  }, [searchFromUrl])

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value && (value !== "all" || key === "view")) {
        next.set(key, value)
      } else if (key !== "view") {
        next.delete(key)
      }
      router.push(`/opportunities?${next.toString()}`)
    },
    [router, searchParams]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = search.trim()
      const currentSearch = searchParams.get("search") ?? ""
      if (trimmed === currentSearch) return
      const next = new URLSearchParams(searchParams.toString())
      if (trimmed) {
        next.set("search", trimmed)
      } else {
        next.delete("search")
      }
      router.push(`/opportunities?${next.toString()}`)
    }, 300)
    return () => clearTimeout(t)
  }, [search, router, searchParams])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select value={type} onValueChange={(v) => setParam("type", v || "")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="AUTOMATE">Automate</SelectItem>
          <SelectItem value="AUGMENT">Augment</SelectItem>
          <SelectItem value="OPTIMIZE">Optimize</SelectItem>
          <SelectItem value="NO_CHANGE">No change</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(v) => setParam("status", v || "")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="NEW">New</SelectItem>
          <SelectItem value="REVIEWED">Reviewed</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="DISMISSED">Dismissed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={quadrant} onValueChange={(v) => setParam("quadrant", v || "")}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Quadrant" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All quadrants</SelectItem>
          <SelectItem value="quick_win">Quick Win</SelectItem>
          <SelectItem value="strategic">Strategic</SelectItem>
          <SelectItem value="optional">Optional</SelectItem>
          <SelectItem value="deprioritize">Deprioritize</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none",
            view === "grid" && "bg-muted"
          )}
          onClick={() => setParam("view", "grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none",
            view === "table" && "bg-muted"
          )}
          onClick={() => setParam("view", "table")}
        >
          <Table2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
