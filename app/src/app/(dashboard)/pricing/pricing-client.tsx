"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Building2, TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";

export type ProposalData = {
    id: number;
    listingId: number;
    date: string;
    currentPrice: string;
    proposedPrice: string | null;
    changePct: number | null;
    reasoning: string | null;
    listingName: string;
};

export function PricingClient({ initialProposals }: { initialProposals: ProposalData[] }) {
    const [proposals, setProposals] = useState<ProposalData[]>(initialProposals);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleSelectAll = () => {
        if (selectedIds.size === proposals.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(proposals.map(p => p.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedIds.size === 0) return;
        setIsProcessing(true);
        const ids = Array.from(selectedIds);
        try {
            const response = await fetch(`/api/proposals/bulk-${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ proposalIds: ids }),
            });
            if (!response.ok) throw new Error(`Failed to ${action} proposals`);

            const { count } = await response.json();
            toast.success(`Successfully ${action}d ${count} proposals! Syncing to PMS in the background...`);

            // Update local UI immediately
            setProposals(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
        } catch (err) {
            console.error(err);
            toast.error(`Error trying to ${action} proposals.`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (proposals.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background border rounded-lg h-full border-dashed shadow-sm">
                <CheckCircle2 className="h-16 w-16 mb-4 text-emerald-500/50" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">All Caught Up!</h3>
                <p className="text-muted-foreground text-sm max-w-sm text-center">
                    You have zero pending pricing proposals. As your AI identifies new market opportunities, they will automatically appear here for your review.
                </p>
            </div>
        );
    }

    return (
        <Card className="flex flex-col flex-1 overflow-hidden border shadow-sm rounded-xl">
            {/* Table Header/Actions Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/10 shrink-0">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-semibold px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {proposals.length} Pending Approvals
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">
                        {selectedIds.size} selected
                    </span>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedIds.size === 0 || isProcessing}
                        onClick={() => handleBulkAction('reject')}
                        className="text-destructive hover:bg-destructive/10"
                    >
                        Reject Selected
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        disabled={selectedIds.size === 0 || isProcessing}
                        onClick={() => handleBulkAction('approve')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                    >
                        {isProcessing ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "Approve Selected"}
                    </Button>
                </div>
            </div>

            {/* Internal Scrollable Table */}
            <div className="flex-1 overflow-auto bg-background">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] text-center">
                                <Checkbox
                                    checked={selectedIds.size === proposals.length && proposals.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead className="text-right">Current Price</TableHead>
                            <TableHead className="text-right">Proposed Price</TableHead>
                            <TableHead className="text-center">Change</TableHead>
                            <TableHead className="max-w-[300px]">AI Reasoning</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposals.map((prop) => (
                            <TableRow key={prop.id} className="cursor-pointer group hover:bg-muted/30" onClick={() => toggleSelect(prop.id)}>
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={selectedIds.has(prop.id)}
                                        onCheckedChange={() => toggleSelect(prop.id)}
                                        onClick={(e) => e.stopPropagation()} // Prevent double trigger
                                        aria-label={`Select row ${prop.id}`}
                                    />
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground opacity-50" />
                                        {prop.listingName}
                                    </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-medium text-muted-foreground">
                                    {format(parseISO(prop.date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="text-right tabular-nums opacity-60">
                                    AED {prop.currentPrice}
                                </TableCell>
                                <TableCell className="text-right font-bold tabular-nums">
                                    AED {prop.proposedPrice}
                                </TableCell>
                                <TableCell className="text-center">
                                    {prop.changePct && prop.changePct !== 0 ? (
                                        <Badge variant="outline" className={`font-semibold bg-transparent ${prop.changePct > 0 ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"}`}>
                                            {prop.changePct > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                            {Math.abs(prop.changePct)}%
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground leading-relaxed max-w-[350px] truncate group-hover:whitespace-normal group-hover:w-[400px]">
                                    {prop.reasoning}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
