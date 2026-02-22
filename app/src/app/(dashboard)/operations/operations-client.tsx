"use client";

import { useState } from "react";
import { format, parseISO, isPast, isToday } from "date-fns";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Sparkles, Clock, MapPin, CheckSquare, MessageCircle, AlertCircle
} from "lucide-react";

export type CleaningTask = {
    id: number;
    listingId: number | null;
    propertyName: string;
    startDate: string;
    endDate: string;
    guestDetails: any;
    financials: any;
    type: string;
};

export function OperationsClient({ reservations }: { reservations: CleaningTask[] }) {
    const [tasks, setTasks] = useState<CleaningTask[]>(reservations);
    const [assignedTasks, setAssignedTasks] = useState<Set<number>>(new Set());

    const handleAssignCleaner = (id: number) => {
        setAssignedTasks(prev => new Set(prev).add(id));
        toast.success("SMS checklist dispatched to Cleaning Crew!");
    };

    const getStatus = (dateStr: string, id: number) => {
        if (assignedTasks.has(id)) return { label: "Dispatched", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30", icon: CheckSquare };
        const date = parseISO(dateStr);
        if (isPast(date) && !isToday(date)) return { label: "Needs Review", color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle };
        if (isToday(date)) return { label: "Clean Today!", color: "bg-amber-500/10 text-amber-500 border-amber-500/30", icon: Sparkles };
        return { label: "Upcoming", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Clock };
    };

    if (tasks.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background border rounded-lg h-full border-dashed shadow-sm">
                <Sparkles className="h-16 w-16 mb-4 text-primary/50" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Upcoming Cleans</h3>
                <p className="text-muted-foreground text-sm max-w-sm text-center">
                    As new reservations clear through the PMS, cleaning blocks will automatically generate here based on checkout dates.
                </p>
            </div>
        );
    }

    return (
        <Card className="flex flex-col flex-1 overflow-hidden border shadow-sm rounded-xl">
            <div className="flex items-center justify-between p-4 border-b bg-muted/10 shrink-0">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-semibold px-3 py-1 bg-primary/10 text-primary border-primary/20">
                        {tasks.length} Cleans Required
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Property</TableHead>
                            <TableHead>Check-out Date (Clean Day)</TableHead>
                            <TableHead className="text-center">Turnaround Window</TableHead>
                            <TableHead className="text-center">Cleaning Fee (budget)</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => {
                            const status = getStatus(task.endDate, task.id);
                            const StatusIcon = status.icon;
                            return (
                                <TableRow key={task.id} className="hover:bg-muted/30">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground opacity-50" />
                                            {task.propertyName}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-foreground">
                                        {format(parseISO(task.endDate), "EEEE, MMM dd")}
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-muted-foreground">
                                        11:00 AM - 3:00 PM <span className="opacity-50">(4h window)</span>
                                    </TableCell>
                                    <TableCell className="text-center font-medium tabular-nums opacity-80">
                                        AED {task.financials?.cleaningFee || 150}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`font-semibold bg-transparent ${status.color}`}>
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!assignedTasks.has(task.id) ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAssignCleaner(task.id)}
                                                className="h-8 border-primary/20 hover:bg-primary hover:text-primary-foreground gap-1.5"
                                            >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                                <span className="text-xs">Dispatch SMS</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled
                                                className="h-8 text-emerald-500 gap-1.5 opacity-100 bg-emerald-500/10"
                                            >
                                                <CheckSquare className="h-3.5 w-3.5" />
                                                <span className="text-xs">Assigned</span>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
