import { format, startOfMonth, getDay, endOfMonth, isSameMonth } from "date-fns";

export interface CalendarDayData {
    date: string;
    status: string; // 'available', 'booked', 'reserved', 'blocked'
    price: number;
}

interface CalendarVisualizerProps {
    days: CalendarDayData[];
}

export function CalendarVisualizer({ days }: CalendarVisualizerProps) {
    if (!days || days.length === 0) return null;

    // Group days by month
    const months: { [key: string]: CalendarDayData[] } = {};
    days.forEach((day) => {
        const monthKey = format(new Date(day.date), "yyyy-MM");
        if (!months[monthKey]) months[monthKey] = [];
        months[monthKey].push(day);
    });

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> Blocked</span>
            </div>

            {Object.entries(months).map(([monthKey, monthDays]) => {
                // Calculate padding for the first day of the month
                const firstDayDate = new Date(`${monthKey}-01T12:00:00Z`);
                const startDayOffset = getDay(firstDayDate); // 0 = Sunday, 1 = Monday...
                const blankDays = Array.from({ length: startDayOffset }).map((_, i) => i);

                // Month title
                const monthTitle = format(firstDayDate, "MMMM yyyy");

                // The monthDays only contains days queried. We pad the rest to complete the month if we want, 
                // but for simplicity, we map out the real days according to their exact date number.
                const daysInMonth = parseInt(format(endOfMonth(firstDayDate), "d"));
                const gridDays = Array.from({ length: daysInMonth }).map((_, i) => {
                    const dateNumber = i + 1;
                    const fullDateStr = `${monthKey}-${String(dateNumber).padStart(2, '0')}`;
                    // Find if we have data for this day
                    const foundDay = monthDays.find(d => d.date === fullDateStr);
                    return {
                        dayNum: dateNumber,
                        fullDateStr,
                        data: foundDay
                    }
                });

                return (
                    <div key={monthKey} className="flex flex-col">
                        <h4 className="font-semibold text-sm mb-3 text-foreground">{monthTitle}</h4>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {blankDays.map((b) => (
                                <div key={`blank-${b}`} className="h-10 rounded-md border border-transparent pt-1"></div>
                            ))}
                            {gridDays.map((gridDay) => {
                                let bgClass = "bg-muted/30 text-muted-foreground opacity-50";
                                let tooltip = "Out of range";

                                if (gridDay.data) {
                                    if (gridDay.data.status === 'booked' || gridDay.data.status === 'reserved') {
                                        bgClass = "bg-rose-500 text-white font-bold shadow-sm";
                                    } else if (gridDay.data.status === 'blocked') {
                                        bgClass = "bg-slate-300 dark:bg-slate-700 text-muted-foreground";
                                    } else {
                                        bgClass = "bg-emerald-500 text-white font-bold shadow-sm";
                                    }
                                    tooltip = `${gridDay.data.status.toUpperCase()} \nPrice: ${gridDay.data.price} AED`;
                                }

                                return (
                                    <div
                                        key={gridDay.dayNum}
                                        title={tooltip}
                                        className={`h-10 rounded border border-border/50 flex flex-col items-center justify-center text-xs transition-opacity hover:opacity-80 ${bgClass}`}
                                    >
                                        <span>{gridDay.dayNum}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
