"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { SeasonalRule } from "@/types/operations";

interface SeasonalRulesTableProps {
  rules: SeasonalRule[];
  listingId: number;
}

export function SeasonalRulesTable({ rules, listingId }: SeasonalRulesTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceModifier, setPriceModifier] = useState(0);
  const [minimumStay, setMinimumStay] = useState<number | undefined>();

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch(`/api/listings/${listingId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, priceModifier, minimumStay, enabled: true }),
      });
      setFormOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setPriceModifier(0);
      setMinimumStay(undefined);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: number) => {
    await fetch(`/api/listings/${listingId}/rules/${ruleId}`, { method: "DELETE" });
    router.refresh();
  };

  const handleToggle = async (rule: SeasonalRule) => {
    await fetch(`/api/listings/${listingId}/rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pricing Rules</h2>
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Rule
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Pricing Rule</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input id="ruleName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Dubai High Season" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ruleStart">Start Date</Label>
                  <Input id="ruleStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruleEnd">End Date</Label>
                  <Input id="ruleEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifier">Price Modifier (%)</Label>
                <Input id="modifier" type="number" value={priceModifier} onChange={(e) => setPriceModifier(Number(e.target.value))} placeholder="+20 or -15" />
                <p className="text-xs text-muted-foreground">Positive = increase, negative = decrease</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStay">Minimum Stay (nights)</Label>
                <Input id="minStay" type="number" min={1} value={minimumStay ?? ""} onChange={(e) => setMinimumStay(e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <Button onClick={handleCreate} disabled={saving || !name || !startDate || !endDate} className="w-full">
                {saving ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No pricing rules configured</p>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Rule</th>
                  <th className="px-4 py-3 text-left font-medium">Dates</th>
                  <th className="px-4 py-3 text-right font-medium">Modifier</th>
                  <th className="px-4 py-3 text-right font-medium">Min Stay</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rule.startDate} &rarr; {rule.endDate}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={rule.priceModifier >= 0 ? "text-green-600" : "text-red-600"}>
                        {rule.priceModifier >= 0 ? "+" : ""}{rule.priceModifier}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{rule.minimumStay ?? "\u2014"}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(rule)}>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
