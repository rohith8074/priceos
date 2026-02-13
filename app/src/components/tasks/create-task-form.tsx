"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Listing } from "@/types/hostaway";

interface CreateTaskFormProps {
  properties: Listing[];
  onCreated: () => void;
}

export function CreateTaskForm({ properties, onCreated }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [listingMapId, setListingMapId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");

  const canSubmit = listingMapId && title && category;

  const resetForm = () => {
    setListingMapId("");
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("medium");
    setDueDate("");
    setAssignee("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingMapId: Number(listingMapId),
          title,
          description: description || undefined,
          category,
          priority,
          status: "todo",
          dueDate: dueDate || undefined,
          assignee: assignee || undefined,
        }),
      });
      if (res.ok) {
        setOpen(false);
        resetForm();
        onCreated();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Task</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {/* Property */}
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={listingMapId} onValueChange={setListingMapId}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Title</Label>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Description</Label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about this task"
              rows={3}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="taskDueDate">Due Date</Label>
            <Input
              id="taskDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="taskAssignee">Assignee</Label>
            <Input
              id="taskAssignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Name (optional)"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className="w-full"
          >
            {saving ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
