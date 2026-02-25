"use client";

import * as React from "react";
import { format, addDays, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
    className?: string;
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
    className,
    date,
    setDate,
}: DateRangePickerProps) {
    // Today (start of day) is the minimum selectable date.
    // Max selectable date is 2 weeks (14 days) from today.
    const today = startOfDay(new Date());
    const maxDate = addDays(today, 14);

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-amber-500" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Select date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={today}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        fromDate={today}
                        toDate={maxDate}
                        disabled={[
                            { before: today },
                            { after: maxDate },
                        ]}
                    />
                    <div className="px-3 pb-3 pt-0 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">
                            Selectable range: today to{" "}
                            <span className="text-amber-500 font-bold">
                                {format(maxDate, "LLL dd, y")}
                            </span>{" "}
                            (2 weeks max)
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

