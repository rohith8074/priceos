"use client";

import { useMemo } from "react";
import { format, parseISO, eachDayOfInterval, isWeekend, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type DayData = {
    price?: string;
    proposedPrice?: string;
    status?: string;
};

export type PropertyRow = {
    id: number;
    name: string;
    days: Record<string, DayData>;
};

export function TapeChartClient({
    properties,
    startDateStr,
    endDateStr
}: {
    properties: PropertyRow[],
    startDateStr: string,
    endDateStr: string
}) {
    const daysArray = useMemo(() => {
        return eachDayOfInterval({
            start: parseISO(startDateStr),
            end: parseISO(endDateStr)
        });
    }, [startDateStr, endDateStr]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "available": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
            case "booked": return "bg-blue-500/10 text-blue-700 border-blue-500/20";
            case "blocked": return "bg-slate-500/10 text-slate-700 border-slate-500/20";
            default: return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <Card className="flex flex-col flex-1 overflow-hidden border shadow-sm rounded-xl">
            <ScrollArea className="h-full w-full rounded-md border">
                <div className="w-max min-w-full">
                    {/* Header Row: Dates */}
                    <div className="flex border-b bg-muted/30 sticky top-0 z-20 w-fit min-w-full">
                        <div className="w-64 shrink-0 border-r bg-muted/30 p-4 sticky left-0 z-30 font-semibold text-sm">
                            Properties
                        </div>
                        {daysArray.map((date, idx) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const today = isToday(date);
                            const weekend = isWeekend(date);

                            return (
                                <div
                                    key={idx}
                                    className={`w-28 shrink-0 p-3 flex flex-col items-center justify-center border-r font-medium text-xs
                    ${today ? "bg-amber-500/10 border-amber-500/20" : ""}
                    ${weekend && !today ? "bg-muted/50" : ""}
                  `}
                                >
                                    <span className={`uppercase tracking-wider opacity-60 text-[10px] ${today ? "text-amber-600 font-bold" : ""}`}>
                                        {format(date, "EEE")}
                                    </span>
                                    <span className={`text-base ${today ? "text-amber-600 font-bold" : "text-foreground"}`}>
                                        {format(date, "dd")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Body Rows: Properties & Prices */}
                    <div className="flex flex-col w-fit min-w-full">
                        {properties.map((prop) => (
                            <div key={prop.id} className="flex border-b hover:bg-muted/10 transition-colors w-fit min-w-full">
                                {/* Fixed Property Name Column */}
                                <div className="w-64 shrink-0 border-r bg-background/95 backdrop-blur p-4 sticky left-0 z-10 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <Building2 className="h-4 w-4 text-muted-foreground opacity-50 shrink-0" />
                                        <span className="truncate">{prop.name}</span>
                                    </div>
                                </div>

                                {/* Day Cells corresponding to this property */}
                                {daysArray.map((date, idx) => {
                                    const dateStr = format(date, "yyyy-MM-dd");
                                    const dayData = prop.days[dateStr] || {};
                                    const isAvailable = dayData.status === "available";

                                    return (
                                        <div
                                            key={idx}
                                            className={`w-28 shrink-0 p-2 border-r flex flex-col justify-center items-center group relative cursor-pointer
                        ${getStatusColor(dayData.status)}
                      `}
                                            title={`${format(date, "MMM dd")} - ${dayData.status || 'unknown'}`}
                                        >
                                            {/* Price Data */}
                                            {dayData.price ? (
                                                <>
                                                    <div className={`text-sm font-semibold ${!isAvailable ? 'opacity-40' : ''}`}>
                                                        AED {dayData.price}
                                                    </div>
                                                    {dayData.proposedPrice && isAvailable && (
                                                        <div className="text-[10px] text-amber-600 font-bold mt-1 bg-background/80 px-1 rounded absolute bottom-1 right-1 shadow-sm">
                                                            AI: {dayData.proposedPrice}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-muted-foreground opacity-30 text-xs">—</div>
                                            )}

                                            {/* Status Overlay */}
                                            {!isAvailable && dayData.status && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
                                                    <span className="text-xs uppercase font-bold tracking-widest opacity-60">
                                                        {dayData.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </Card>
    );
}
