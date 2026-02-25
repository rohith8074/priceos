"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { CreateTaskForm } from "./create-task-form";
import type { OperationalTask } from "@/types/operations";
import type { Listing } from "@/types/hostaway";

interface TaskBoardProps {
  initialTasks: OperationalTask[];
  properties: Listing[];
}

interface KanbanColumn {
  key: OperationalTask["status"];
  label: string;
  bgClass: string;
}

const columns: KanbanColumn[] = [
  {
    key: "todo",
    label: "To Do",
    bgClass: "bg-slate-50 dark:bg-slate-900/50",
  },
  {
    key: "in_progress",
    label: "In Progress",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    key: "done",
    label: "Done",
    bgClass: "bg-green-50 dark:bg-green-950/30",
  },
];

export function TaskBoard({ initialTasks, properties }: TaskBoardProps) {
  const [tasks, setTasks] = useState<OperationalTask[]>(initialTasks);

  const propertyMap = new Map(properties.map((p) => [p.id, p.name]));

  const handleStatusChange = useCallback(
    async (taskId: number, newStatus: OperationalTask["status"]) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          // Revert on failure
          setTasks((prev) =>
            prev.map((t) => {
              const original = initialTasks.find((ot) => ot.id === taskId);
              return t.id === taskId && original
                ? { ...t, status: original.status }
                : t;
            })
          );
        }
      } catch {
        // Revert on error
        setTasks((prev) =>
          prev.map((t) => {
            const original = initialTasks.find((ot) => ot.id === taskId);
            return t.id === taskId && original
              ? { ...t, status: original.status }
              : t;
          })
        );
      }
    },
    [initialTasks]
  );

  const handleTaskCreated = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const freshTasks: OperationalTask[] = await res.json();
        setTasks(freshTasks);
      }
    } catch {
      // Silently fail; user can refresh
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex justify-end">
        <CreateTaskForm properties={properties} onCreated={handleTaskCreated} />
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-lg border ${col.bgClass} p-3 min-h-[300px]`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>

              {/* Task list */}
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2 pr-2">
                  {columnTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        propertyName={
                          propertyMap.get(task.listingMapId) ?? "Unknown"
                        }
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
