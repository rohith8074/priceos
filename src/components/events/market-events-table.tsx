"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Sparkles, AlertTriangle, ExternalLink, ChevronDown } from "lucide-react";
import { MarketEventRow } from "@/lib/db/schema";
import { useContextStore } from "@/stores/context-store";
import { cn } from "@/lib/utils";

export function MarketEventsTable() {
    const [events, setEvents] = useState<MarketEventRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isExpanded, setIsExpanded] = useState(true);

    // We use the same context that the chat uses so the table updates dynamically 
    // if you switch from Portfolio to Property view.
    const { contextType, propertyId, dateRange, marketRefreshTrigger } = useContextStore();

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (propertyId) params.set("listingId", String(propertyId));
                if (dateRange?.from) params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
                if (dateRange?.to) params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));

                const res = await fetch(`/api/events?${params}`);
                if (!res.ok) throw new Error("Failed to load events");

                const data = await res.json();
                setEvents(data.events || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error loading events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [contextType, propertyId, dateRange, marketRefreshTrigger]);

    if (loading) {
        return (
            <Card className="flex flex-col h-full border-none shadow-none bg-transparent">
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="flex flex-col h-full border-red-100 shadow-none bg-red-50/50">
                <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-2 p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            </Card>
        );
    }

    if (events.length === 0) {
        return (
            <Card className="flex flex-col h-full border-dashed shadow-none bg-transparent">
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 opacity-30" />
                    </div>
                    <div>
                        <p className="font-medium text-sm text-foreground/70">No Market Signals Found</p>
                        <p className="text-xs mt-1 max-w-[250px]">
                            Use the "Setup" button in the chat to scan the internet for events in your date range.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    // Helper to color code the impact badges
    const getImpactBadge = (impact?: string | null) => {
        if (!impact) return <Badge variant="outline" className="text-[10px]">Unknown</Badge>;
        const lower = impact.toLowerCase();
        if (lower.includes("high")) return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold tracking-wider uppercase border-none">High</Badge>;
        if (lower.includes("med")) return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[10px] font-bold tracking-wider uppercase border-none">Medium</Badge>;
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] font-bold tracking-wider uppercase border-none">Low</Badge>;
    };

    return (
        <Card className={cn("flex flex-col rounded-none border-0 shadow-none transition-all duration-300", isExpanded ? "flex-1 min-h-0" : "h-auto shrink-0")}>
            <CardHeader
                className="py-4 px-6 border-b bg-muted/10 sticky top-0 z-10 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <CardTitle className="text-sm font-bold">Latest Market Signals</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] font-medium font-mono">
                            {events.length} records
                        </Badge>
                        <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", isExpanded ? "rotate-180" : "")} />
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="p-0 overflow-auto flex-1">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur shadow-sm z-20">
                            <TableRow className="hover:bg-transparent [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wider [&>th]:text-muted-foreground">
                                <TableHead className="w-[120px] pl-6">Date</TableHead>
                                <TableHead>Event Signal</TableHead>
                                <TableHead>Impact</TableHead>
                                <TableHead className="text-right pr-6">Premium Suggestion</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="[&>tr:last-child]:border-0">
                            {events.map((ev) => {
                                const start = new Date(ev.startDate);
                                const end = new Date(ev.endDate);
                                const isSingleDay = ev.startDate === ev.endDate;

                                const isEvent = ev.eventType === 'event';
                                const isHoliday = ev.eventType === 'holiday';

                                return (
                                    <TableRow key={ev.id} className="hover:bg-muted/30 group transition-colors">
                                        <TableCell className="pl-6 align-top pt-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium whitespace-nowrap">
                                                    {format(start, "MMM d")}
                                                </span>
                                                {!isSingleDay && (
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap opacity-60">
                                                        to {format(end, "MMM d, yy")}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="align-top pt-4">
                                            <div className="flex flex-col gap-1.5 max-w-[300px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {ev.title}
                                                    </span>
                                                    {ev.source && ev.source.startsWith('http') && (
                                                        <a href={ev.source} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                                    {ev.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {isEvent && <Badge variant="outline" className="text-[9px] bg-blue-500/5 text-blue-500 border-blue-500/20">Event</Badge>}
                                                    {isHoliday && <Badge variant="outline" className="text-[9px] bg-purple-500/5 text-purple-500 border-purple-500/20">Holiday</Badge>}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="align-top pt-4">
                                            <div className="flex flex-col gap-2">
                                                {getImpactBadge(ev.expectedImpact || 'medium')}
                                                {ev.confidence ? (
                                                    <div className="flex items-center gap-1.5 border-t border-muted pt-1">
                                                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary/40 rounded-full"
                                                                style={{ width: `${ev.confidence}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[9px] font-mono text-muted-foreground">
                                                            {ev.confidence}%
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right pr-6 align-top pt-4">
                                            {ev.suggestedPremium && Number(ev.suggestedPremium) > 0 ? (
                                                <div className="inline-flex flex-col items-end">
                                                    <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                        +{Math.round(Number(ev.suggestedPremium))}%
                                                    </span>
                                                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                                                        Target Lift
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50 italic">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
    );
}
