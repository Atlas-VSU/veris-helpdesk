// features/admin-tickets/components/BulkActionsBar.tsx
// Appears above the table when one or more rows are selected.
// Lets admins update status or delete multiple tickets at once.

"use client";

import { Button } from "@/components/ui/button";
import { Trash2, UserRoundCheck, RefreshCw } from "lucide-react";

import type { BulkActionsBarProps } from "../types/props";

export function BulkActionsBar({
  count,
  onUpdateStatus,
  onAssign,
  onDelete,
}: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${count} ticket${count !== 1 ? "s" : ""} selected`}
      className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-accent/40 px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-2 duration-normal"
    >
      <span className="text-sm font-semibold text-accent-foreground">
        {count} ticket{count !== 1 ? "s" : ""} selected
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAssign}
          className="gap-1.5"
        >
          <UserRoundCheck className="size-3.5" />
          Assign
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUpdateStatus}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Update Status
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-1.5"
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
