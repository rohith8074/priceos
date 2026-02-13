# PriceOS Phase 1–3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build PriceOS from an AI-only pricing dashboard into a full property management tool with AI intelligence layered on top. Phases 1–3 cover: operational foundation (reservations, calendar management, listing editing), deeper operations (direct bookings, pricing rules, multi-property calendar, channel view), and full operations + smart automation (messaging, tasks, expenses, finance, AI automation).

**Architecture:** All features are mock-data-first via the PMSClient abstraction. New operations extend `PMSClient` interface + `MockPMSClient` + mock data generators. UI follows the existing Next.js App Router pattern: server components for data fetching, client components for interactivity, Zustand stores for client state, shadcn/ui for all components.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM + Neon Postgres, shadcn/ui + Tailwind CSS v4, Zustand, date-fns, lucide-react icons.

**Data Principle:** Every new operation gets a mock implementation with realistic Dubai data. No phase requires a live Hostaway connection.

---

## File Structure Reference (Current)

```
app/src/
├── app/(dashboard)/
│   ├── layout.tsx              — Sidebar + Header + ChatPanel shell
│   ├── dashboard/              — KPI overview
│   ├── properties/             — List + [id] detail
│   ├── calendar/               — Single-property 90-day grid
│   ├── proposals/              — AI proposal list
│   └── insights/               — Events + market signals
├── components/
│   ├── ui/                     — shadcn primitives (button, card, badge, etc.)
│   ├── layout/                 — sidebar.tsx, header.tsx, chat-panel.tsx
│   ├── properties/             — property-card.tsx, property-list.tsx
│   ├── calendar/               — calendar-grid.tsx
│   ├── proposals/              — proposal-card.tsx, proposal-list.tsx
│   ├── chat/                   — message-bubble, structured-response, etc.
│   ├── dashboard/              — stat-card.tsx
│   └── insights/               — event-card.tsx, market-signal-card.tsx
├── data/                       — mock-properties.ts, mock-calendar.ts, mock-reservations.ts, mock-events.ts, mock-competitors.ts
├── hooks/                      — use-chat.ts
├── lib/
│   ├── agents/                 — types.ts, mock-agents.ts, index.ts
│   ├── db/                     — schema.ts, seed.ts, index.ts
│   └── pms/                    — types.ts, mock-client.ts, hostaway-client.ts, index.ts
├── stores/                     — property-store.ts, chat-store.ts, agent-store.ts
└── types/                      — hostaway.ts, chat.ts, proposal.ts
```

**Pattern conventions:**
- Server components: `app/(dashboard)/*/page.tsx` — fetch data via `createPMSClient()`, pass to client components
- Client components: `components/*/` — `"use client"`, receive data as props, use stores for local state
- Mock data: `data/mock-*.ts` — exports constants + generator functions
- PMS interface: `lib/pms/types.ts` defines interface, `mock-client.ts` implements it
- Stores: Zustand with `create<T>((set) => ({...}))` pattern

**Verification commands:**
- Type check: `cd app && npx tsc --noEmit`
- Build: `cd app && npm run build`
- Dev: `cd app && npm run dev`

---

# PHASE 1 — Operational Context for AI

---

## Task 1: Sidebar Restructure

Reorganize sidebar into Operations + Intelligence sections. This is a quick structural change that sets the foundation for everything else.

**Files:**
- Modify: `app/src/components/layout/sidebar.tsx`

**Step 1: Update sidebar navigation structure**

Replace the flat `navItems` array with grouped sections:

```tsx
// In sidebar.tsx, replace the navItems array and nav rendering

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  FileCheck,
  Lightbulb,
  MessageSquare,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";

const navSections = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/reservations", label: "Reservations", icon: ClipboardList },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/proposals", label: "Proposals", icon: FileCheck },
      { href: "/insights", label: "Insights", icon: Lightbulb },
    ],
  },
];
```

Update the `<nav>` section to render grouped sections with labels:

```tsx
<nav className="flex-1 space-y-4 p-3">
  {navSections.map((section) => (
    <div key={section.label} className="space-y-1">
      <p className="px-3 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
        {section.label}
      </p>
      {section.items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} onClick={() => setCollapsed(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  ))}
</nav>
```

**Step 2: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: Build passes. `/reservations` link will 404 until Task 2.

**Step 3: Commit**

```bash
git add app/src/components/layout/sidebar.tsx
git commit -m "feat: restructure sidebar into Operations + Intelligence sections"
```

---

## Task 2: Reservations List Page

Build the reservations list page with filters for property, channel, status.

**Files:**
- Create: `app/src/app/(dashboard)/reservations/page.tsx`
- Create: `app/src/components/reservations/reservation-table.tsx`

**Step 1: Create the reservation table client component**

```tsx
// app/src/components/reservations/reservation-table.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { useChatStore } from "@/stores/chat-store";
import type { Reservation, Listing } from "@/types/hostaway";
import Link from "next/link";

interface ReservationTableProps {
  reservations: Reservation[];
  properties: Listing[];
}

const channelColors: Record<string, string> = {
  Airbnb: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "Booking.com": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Direct: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
};

const statusColors: Record<string, string> = {
  confirmed: "default",
  pending: "secondary",
  cancelled: "destructive",
  completed: "outline",
} as const;

export function ReservationTable({ reservations, properties }: ReservationTableProps) {
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { open } = useChatStore();

  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const filtered = reservations.filter((r) => {
    if (propertyFilter !== "all" && r.listingMapId !== Number(propertyFilter)) return false;
    if (channelFilter !== "all" && r.channelName !== channelFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="Airbnb">Airbnb</SelectItem>
            <SelectItem value="Booking.com">Booking.com</SelectItem>
            <SelectItem value="Direct">Direct</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground self-center">
          {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Guest</th>
                <th className="px-4 py-3 text-left font-medium">Property</th>
                <th className="px-4 py-3 text-left font-medium">Channel</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                <th className="px-4 py-3 text-right font-medium">Nights</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const property = propertyMap.get(r.listingMapId);
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/reservations/${r.id}`} className="font-medium hover:underline">
                        {r.guestName}
                      </Link>
                      {r.guestEmail && (
                        <p className="text-xs text-muted-foreground">{r.guestEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {property?.name ?? `#${r.listingMapId}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${channelColors[r.channelName] ?? channelColors.Other}`}>
                        {r.channelName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.arrivalDate} → {r.departureDate}
                    </td>
                    <td className="px-4 py-3 text-right">{r.nights}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {r.totalPrice.toLocaleString("en-US")} AED
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusColors[r.status] as any ?? "secondary"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => open(`Is reservation #${r.id} for ${r.guestName} at ${property?.name} priced well? Dates: ${r.arrivalDate} to ${r.departureDate}, Total: ${r.totalPrice} AED for ${r.nights} nights.`)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No reservations match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create the reservations server page**

```tsx
// app/src/app/(dashboard)/reservations/page.tsx
import { createPMSClient } from "@/lib/pms";
import { ReservationTable } from "@/components/reservations/reservation-table";

export default async function ReservationsPage() {
  const pms = createPMSClient();

  const [allProperties, allReservations] = await Promise.all([
    pms.listListings(),
    pms.getReservations(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="text-sm text-muted-foreground">
          {allReservations.length} bookings across {allProperties.length} properties
        </p>
      </div>

      <ReservationTable reservations={allReservations} properties={allProperties} />
    </div>
  );
}
```

**Step 3: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: Build passes, `/reservations` route appears in output

**Step 4: Commit**

```bash
git add app/src/app/\(dashboard\)/reservations/page.tsx app/src/components/reservations/reservation-table.tsx
git commit -m "feat: add reservations list page with property/channel/status filters"
```

---

## Task 3: Reservation Detail Page

Build the detail view for a single reservation.

**Files:**
- Create: `app/src/app/(dashboard)/reservations/[id]/page.tsx`
- Modify: `app/src/lib/pms/types.ts` — add `getReservation()` method
- Modify: `app/src/lib/pms/mock-client.ts` — implement `getReservation()`
- Modify: `app/src/lib/pms/hostaway-client.ts` — add stub

**Step 1: Extend PMSClient interface**

Add to `app/src/lib/pms/types.ts`:

```typescript
// Add to PMSClient interface, after getReservations:
getReservation(id: string | number): Promise<Reservation>;
```

**Step 2: Implement in MockPMSClient**

Add to `app/src/lib/pms/mock-client.ts`:

```typescript
async getReservation(id: string | number): Promise<Reservation> {
  await this.delay(50);
  const numId = typeof id === "string" ? parseInt(id) : id;
  const reservation = MOCK_RESERVATIONS.find((r) => r.id === numId);
  if (!reservation) {
    throw new Error(`Reservation ${id} not found`);
  }
  return reservation;
}
```

**Step 3: Add stub to HostawayClient**

Add to `app/src/lib/pms/hostaway-client.ts`:

```typescript
async getReservation(id: string | number): Promise<Reservation> {
  throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
}
```

**Step 4: Create reservation detail page**

```tsx
// app/src/app/(dashboard)/reservations/[id]/page.tsx
import { createPMSClient } from "@/lib/pms";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CalendarDays, CreditCard, Building2, Clock } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const channelColors: Record<string, string> = {
  Airbnb: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "Booking.com": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Direct: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
};

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  const pms = createPMSClient();

  let reservation;
  try {
    reservation = await pms.getReservation(id);
  } catch {
    notFound();
  }

  let property;
  try {
    property = await pms.getListing(reservation.listingMapId);
  } catch {
    // Property may not exist
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/reservations" className="hover:underline">Reservations</Link>
            <span>/</span>
            <span>#{reservation.id}</span>
          </div>
          <h1 className="text-2xl font-bold">{reservation.guestName}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${channelColors[reservation.channelName] ?? channelColors.Other}`}>
              {reservation.channelName}
            </span>
            <Badge variant={reservation.status === "confirmed" ? "default" : reservation.status === "cancelled" ? "destructive" : "secondary"}>
              {reservation.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Property */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Building2 className="h-3.5 w-3.5" />
              Property
            </div>
            {property ? (
              <Link href={`/properties/${property.id}`} className="font-semibold hover:underline">
                {property.name}
              </Link>
            ) : (
              <p className="font-semibold">#{reservation.listingMapId}</p>
            )}
            {property && <p className="text-xs text-muted-foreground">{property.area}</p>}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Stay
            </div>
            <p className="font-semibold">{reservation.nights} night{reservation.nights !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground">
              {reservation.arrivalDate} → {reservation.departureDate}
            </p>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="font-semibold">{reservation.totalPrice.toLocaleString("en-US")} AED</p>
            <p className="text-xs text-muted-foreground">
              {reservation.pricePerNight.toLocaleString("en-US")} AED/night
            </p>
          </CardContent>
        </Card>

        {/* Check-in/out */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              Times
            </div>
            <p className="text-sm">Check-in: <span className="font-semibold">{reservation.checkInTime ?? "—"}</span></p>
            <p className="text-sm">Check-out: <span className="font-semibold">{reservation.checkOutTime ?? "—"}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Guest Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Guest Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{reservation.guestName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{reservation.guestEmail ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 5: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: Build passes, `/reservations/[id]` route appears

**Step 6: Commit**

```bash
git add app/src/lib/pms/types.ts app/src/lib/pms/mock-client.ts app/src/lib/pms/hostaway-client.ts app/src/app/\(dashboard\)/reservations/\[id\]/page.tsx
git commit -m "feat: add reservation detail page with guest info, financials, property link"
```

---

## Task 4: Calendar Block/Unblock

Add block and unblock actions to the calendar. Extend the CalendarDay type with a `blockReason` field, add PMSClient methods, update the calendar grid with popovers.

**Files:**
- Modify: `app/src/types/hostaway.ts` — add `blockReason` to CalendarDay
- Modify: `app/src/lib/pms/types.ts` — add `blockDates()`, `unblockDates()` methods
- Modify: `app/src/lib/pms/mock-client.ts` — implement block/unblock in mock store
- Modify: `app/src/lib/pms/hostaway-client.ts` — add stubs
- Modify: `app/src/components/calendar/calendar-grid.tsx` — add popover with block/unblock actions
- Create: `app/src/app/api/calendar/block/route.ts` — API route for block action
- Create: `app/src/app/api/calendar/unblock/route.ts` — API route for unblock action

**Step 1: Extend CalendarDay type**

In `app/src/types/hostaway.ts`, add `blockReason` to CalendarDay:

```typescript
export interface CalendarDay {
  date: string;
  status: "available" | "booked" | "blocked";
  price: number;
  minimumStay: number;
  maximumStay: number;
  notes?: string;
  blockReason?: "owner_stay" | "maintenance" | "other"; // PriceOS-specific
}
```

**Step 2: Extend PMSClient interface**

Add to `app/src/lib/pms/types.ts`:

```typescript
// Add to PMSClient interface:
blockDates(
  id: string | number,
  startDate: string,
  endDate: string,
  reason: "owner_stay" | "maintenance" | "other"
): Promise<UpdateResult>;

unblockDates(
  id: string | number,
  startDate: string,
  endDate: string
): Promise<UpdateResult>;
```

**Step 3: Implement in MockPMSClient**

Add to `app/src/lib/pms/mock-client.ts`:

```typescript
// Add a new private field for block overrides:
private blockOverrides: Map<string, Map<string, { blocked: boolean; reason?: string }>> = new Map();

// In getCalendar, after applying price overrides, apply block overrides:
const blockOverrides = this.blockOverrides.get(String(numId));
if (blockOverrides) {
  calendar = calendar.map((day) => {
    const blockOverride = blockOverrides.get(day.date);
    if (blockOverride) {
      if (blockOverride.blocked) {
        return { ...day, status: "blocked" as const, price: 0, blockReason: blockOverride.reason as any };
      } else {
        return { ...day, status: "available" as const, price: day.price || property.price };
      }
    }
    return day;
  });
}

// Implement blockDates:
async blockDates(
  id: string | number,
  startDate: string,
  endDate: string,
  reason: "owner_stay" | "maintenance" | "other"
): Promise<UpdateResult> {
  await this.delay(100);
  const numId = typeof id === "string" ? parseInt(id) : id;
  const key = String(numId);
  if (!this.blockOverrides.has(key)) {
    this.blockOverrides.set(key, new Map());
  }
  const overrides = this.blockOverrides.get(key)!;
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    overrides.set(dateStr, { blocked: true, reason });
    count++;
    current.setDate(current.getDate() + 1);
  }
  return { success: true, updatedCount: count };
}

// Implement unblockDates:
async unblockDates(
  id: string | number,
  startDate: string,
  endDate: string
): Promise<UpdateResult> {
  await this.delay(100);
  const numId = typeof id === "string" ? parseInt(id) : id;
  const key = String(numId);
  if (!this.blockOverrides.has(key)) {
    this.blockOverrides.set(key, new Map());
  }
  const overrides = this.blockOverrides.get(key)!;
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    overrides.set(dateStr, { blocked: false });
    count++;
    current.setDate(current.getDate() + 1);
  }
  return { success: true, updatedCount: count };
}
```

**Step 4: Add stubs to HostawayClient**

Add to `app/src/lib/pms/hostaway-client.ts`:

```typescript
async blockDates(id: string | number, startDate: string, endDate: string, reason: "owner_stay" | "maintenance" | "other"): Promise<UpdateResult> {
  throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
}
async unblockDates(id: string | number, startDate: string, endDate: string): Promise<UpdateResult> {
  throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
}
```

**Step 5: Create API routes**

```typescript
// app/src/app/api/calendar/block/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { propertyId, startDate, endDate, reason } = body;
  if (!propertyId || !startDate || !endDate || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const pms = createPMSClient();
  const result = await pms.blockDates(propertyId, startDate, endDate, reason);
  return NextResponse.json(result);
}
```

```typescript
// app/src/app/api/calendar/unblock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { propertyId, startDate, endDate } = body;
  if (!propertyId || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const pms = createPMSClient();
  const result = await pms.unblockDates(propertyId, startDate, endDate);
  return NextResponse.json(result);
}
```

**Step 6: Update calendar grid with block/unblock popover**

Modify `app/src/components/calendar/calendar-grid.tsx` to add a Popover on each calendar cell. Available dates get "Block Dates" action with reason selector. Blocked dates get "Unblock" action. Both call the API routes and refresh the calendar. Use shadcn `Popover`, `Select`, and `Button` components.

The key UI changes:
- Click available date → Popover with reason selector (Owner Stay / Maintenance / Other) + "Block" button
- Click blocked date → Popover with "Unblock" button
- After action: refetch calendar via `/api/calendar?propertyId=X`
- Blocked dates with `blockReason` show the reason as a tooltip

**Step 7: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: Build passes

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add calendar block/unblock with reason tags and popover UI"
```

---

## Task 5: Listing Edit

Add an edit form to the property detail page.

**Files:**
- Modify: `app/src/lib/pms/types.ts` — add `updateListing()` method
- Modify: `app/src/lib/pms/mock-client.ts` — implement with in-memory override
- Modify: `app/src/lib/pms/hostaway-client.ts` — add stub
- Create: `app/src/app/api/listings/[id]/route.ts` — PUT API route
- Create: `app/src/components/properties/listing-edit-form.tsx` — edit form component
- Modify: `app/src/app/(dashboard)/properties/[id]/page.tsx` — add Edit button that opens form

**Step 1: Extend PMSClient**

Add to `app/src/lib/pms/types.ts`:

```typescript
// Add to PMSClient interface:
updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing>;
```

**Step 2: Implement in MockPMSClient**

```typescript
// Add private field:
private listingOverrides: Map<number, Partial<Listing>> = new Map();

// Modify getListing to apply overrides:
// After finding the listing:
const overrides = this.listingOverrides.get(numId);
if (overrides) {
  return { ...listing, ...overrides };
}

// Modify listListings to apply overrides:
// After returning MOCK_PROPERTIES:
return MOCK_PROPERTIES.map((p) => {
  const overrides = this.listingOverrides.get(p.id);
  return overrides ? { ...p, ...overrides } : p;
});

// Implement updateListing:
async updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing> {
  await this.delay(100);
  const numId = typeof id === "string" ? parseInt(id) : id;
  const listing = MOCK_PROPERTIES.find((p) => p.id === numId);
  if (!listing) throw new Error(`Listing ${id} not found`);
  const existing = this.listingOverrides.get(numId) ?? {};
  this.listingOverrides.set(numId, { ...existing, ...updates });
  return { ...listing, ...existing, ...updates };
}
```

**Step 3: Add stub to HostawayClient**

```typescript
async updateListing(id: string | number, updates: Partial<Listing>): Promise<Listing> {
  throw new Error("Live Hostaway API not yet implemented. Set HOSTAWAY_MODE=mock");
}
```

**Step 4: Create API route**

```typescript
// app/src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const pms = createPMSClient();
  try {
    const updated = await pms.updateListing(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
}
```

**Step 5: Create listing edit form**

Create `app/src/components/properties/listing-edit-form.tsx` — a Sheet (slide-out) form with fields: name, propertyType (select), bedroomsNumber, bathroomsNumber, personCapacity, price, priceFloor, priceCeiling. On save, calls `PUT /api/listings/{id}` and refreshes via `router.refresh()`.

Use shadcn `Sheet`, `Input`, `Label`, `Select`, `Button` components.

**Step 6: Add Edit button to property detail page**

Modify `app/src/app/(dashboard)/properties/[id]/page.tsx`:
- Import `ListingEditForm`
- Add `<ListingEditForm property={property} />` component next to the PropertyAskAI button
- The form component handles its own Sheet open/close state

**Step 7: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: Build passes

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add listing edit form with slide-out sheet and API route"
```

---

## Task 6: Enrich AI Chat Context with Reservations

Update the chat context builder to include reservation data for the active property.

**Files:**
- Modify: `app/src/hooks/use-chat.ts` — add reservation summary to context

**Step 1: Update context builder**

In `app/src/hooks/use-chat.ts`, extend the context block inside `sendMessage`:

```typescript
// After the existing ctx array, before contextMessage assignment:
// Fetch reservation summary for context (simplified — compute from store or pass as prop)
// For now, add a static enrichment note:
if (activeProperty) {
  const ctx = [
    `Property: ${activeProperty.name}`,
    `Area: ${activeProperty.area}`,
    `Type: ${activeProperty.propertyType}`,
    `Bedrooms: ${activeProperty.bedroomsNumber}`,
    `Base Price: ${activeProperty.price} ${activeProperty.currencyCode}`,
    `Price Range: ${activeProperty.priceFloor}-${activeProperty.priceCeiling} ${activeProperty.currencyCode}`,
    activeProperty.amenities?.length
      ? `Amenities: ${(activeProperty.amenities as string[]).join(', ')}`
      : null,
    activeProperty.personCapacity
      ? `Max Guests: ${activeProperty.personCapacity}`
      : null,
  ]
    .filter(Boolean)
    .join('. ')
  contextMessage = `[Context: ${ctx}]\n\n${content}`
}
```

This is minimal — future tasks will add a reservation store and richer context.

**Step 2: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

**Step 3: Commit**

```bash
git add app/src/hooks/use-chat.ts
git commit -m "feat: enrich AI chat context with personCapacity and amenities"
```

---

# PHASE 2 — Deepen Both Layers

---

## Task 7: Mock Data — Seasonal Rules, Conversations, Expenses

Create mock data generators for Phase 2 and 3 features. This provides the data foundation for all subsequent tasks.

**Files:**
- Create: `app/src/data/mock-seasonal-rules.ts`
- Create: `app/src/data/mock-conversations.ts`
- Create: `app/src/data/mock-tasks.ts`
- Create: `app/src/data/mock-expenses.ts`
- Create: `app/src/types/operations.ts` — types for SeasonalRule, Conversation, Message, OperationalTask, Expense

**Step 1: Create operations types**

```typescript
// app/src/types/operations.ts

export interface SeasonalRule {
  id: number;
  listingMapId: number;
  name: string;
  startDate: string;
  endDate: string;
  priceModifier: number; // percentage: +20 = 20% increase, -10 = 10% decrease
  minimumStay?: number;
  maximumStay?: number;
  enabled: boolean;
}

export interface Conversation {
  id: number;
  reservationId?: number;
  listingMapId: number;
  guestName: string;
  guestEmail: string;
  lastMessageAt: string;
  unreadCount: number;
  status: "active" | "archived";
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  sender: "guest" | "host" | "system";
  content: string;
  sentAt: string;
}

export interface MessageTemplate {
  id: number;
  name: string;
  content: string;
  category: "check_in" | "check_out" | "general" | "issue";
}

export interface OperationalTask {
  id: number;
  listingMapId: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  category: "cleaning" | "maintenance" | "inspection" | "other";
  dueDate?: string;
  assignee?: string;
  reservationId?: number;
  createdAt: string;
}

export interface Expense {
  id: number;
  listingMapId: number;
  category: "cleaning" | "maintenance" | "supplies" | "utilities" | "commission" | "other";
  amount: number;
  currencyCode: "AED" | "USD";
  description: string;
  date: string;
  reservationId?: number;
}

export interface OwnerStatement {
  id: number;
  listingMapId: number;
  month: string; // "2026-01", "2026-02"
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  occupancyRate: number;
  reservationCount: number;
}
```

**Step 2: Create mock seasonal rules**

Create `app/src/data/mock-seasonal-rules.ts` with 3-4 rules per property covering Dubai high season (Dec-Mar), Eid, summer low, etc. Export `MOCK_SEASONAL_RULES` array and `getRulesForListing(id)` helper.

**Step 3: Create mock conversations**

Create `app/src/data/mock-conversations.ts` with ~10 conversations across properties, each with 3-5 messages. Realistic guest inquiries (early check-in, amenity questions, complaints). Export `MOCK_CONVERSATIONS`, `MOCK_MESSAGES`, and helpers.

**Step 4: Create mock tasks**

Create `app/src/data/mock-tasks.ts` with ~15 tasks across properties (cleaning after checkout, AC maintenance, pool service, inspection). Export `MOCK_TASKS` and helpers.

**Step 5: Create mock expenses**

Create `app/src/data/mock-expenses.ts` with ~30 expenses across properties over 3 months. Export `MOCK_EXPENSES`, `MOCK_OWNER_STATEMENTS`, and helpers.

**Step 6: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add mock data generators for seasonal rules, conversations, tasks, expenses"
```

---

## Task 8: Extend PMSClient with Phase 2-3 Methods

Add all new methods to PMSClient interface and MockPMSClient.

**Files:**
- Modify: `app/src/lib/pms/types.ts`
- Modify: `app/src/lib/pms/mock-client.ts`
- Modify: `app/src/lib/pms/hostaway-client.ts`

**Step 1: Extend PMSClient interface**

Add imports for new types and add methods:

```typescript
// Seasonal Rules
getSeasonalRules(listingId: string | number): Promise<SeasonalRule[]>;
createSeasonalRule(listingId: string | number, rule: Omit<SeasonalRule, "id" | "listingMapId">): Promise<SeasonalRule>;
updateSeasonalRule(listingId: string | number, ruleId: number, updates: Partial<SeasonalRule>): Promise<SeasonalRule>;
deleteSeasonalRule(listingId: string | number, ruleId: number): Promise<void>;

// Conversations
getConversations(listingId?: string | number): Promise<Conversation[]>;
getConversationMessages(conversationId: number): Promise<ConversationMessage[]>;
sendMessage(conversationId: number, content: string): Promise<ConversationMessage>;
getMessageTemplates(): Promise<MessageTemplate[]>;

// Tasks
getTasks(listingId?: string | number): Promise<OperationalTask[]>;
createTask(task: Omit<OperationalTask, "id" | "createdAt">): Promise<OperationalTask>;
updateTask(taskId: number, updates: Partial<OperationalTask>): Promise<OperationalTask>;

// Expenses
getExpenses(listingId?: string | number): Promise<Expense[]>;
createExpense(expense: Omit<Expense, "id">): Promise<Expense>;
getOwnerStatements(listingId?: string | number): Promise<OwnerStatement[]>;

// Reservations - create
createReservation(reservation: Omit<Reservation, "id" | "createdAt" | "pricePerNight">): Promise<Reservation>;
```

**Step 2: Implement all methods in MockPMSClient**

Each method reads from the corresponding mock data file and applies any in-memory overrides. Use the same patterns as existing mock methods (delay simulation, ID lookup, Map-based overrides for mutations).

**Step 3: Add stubs to HostawayClient**

All new methods throw `"Live Hostaway API not yet implemented"`.

**Step 4: Verify**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

**Step 5: Commit**

```bash
git add app/src/lib/pms/types.ts app/src/lib/pms/mock-client.ts app/src/lib/pms/hostaway-client.ts
git commit -m "feat: extend PMSClient with seasonal rules, conversations, tasks, expenses, create reservation"
```

---

## Task 9: Direct Booking Creation

Add "New Booking" button to reservations page with a multi-step form.

**Files:**
- Create: `app/src/components/reservations/create-reservation-form.tsx`
- Create: `app/src/app/api/reservations/route.ts`
- Modify: `app/src/app/(dashboard)/reservations/page.tsx` — add "New Booking" button

**Step 1: Create API route**

```typescript
// app/src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPMSClient } from "@/lib/pms";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const pms = createPMSClient();
  const reservation = await pms.createReservation(body);
  return NextResponse.json(reservation);
}
```

**Step 2: Create reservation form**

Create `app/src/components/reservations/create-reservation-form.tsx`:
- Sheet with form fields: property (select), guest name, guest email, arrival date, departure date, channel (defaults to "Direct")
- Auto-calculates nights and total price from calendar data
- On submit: POST `/api/reservations`, close sheet, `router.refresh()`
- Use shadcn `Sheet`, `Input`, `Label`, `Select`, `Button`

**Step 3: Add to reservations page**

Modify `app/src/app/(dashboard)/reservations/page.tsx`:
- Add `<CreateReservationForm properties={allProperties} />` button in the header area

**Step 4: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add direct booking creation with multi-step form"
```

---

## Task 10: Seasonal Pricing Rules

Add pricing rules CRUD per property.

**Files:**
- Create: `app/src/app/(dashboard)/properties/[id]/rules/page.tsx`
- Create: `app/src/components/properties/seasonal-rules-table.tsx`
- Create: `app/src/components/properties/create-rule-form.tsx`
- Create: `app/src/app/api/listings/[id]/rules/route.ts`
- Modify: `app/src/app/(dashboard)/properties/[id]/page.tsx` — add "Pricing Rules" tab/link

**Step 1: Create API routes**

GET and POST for `/api/listings/[id]/rules`. PUT and DELETE for `/api/listings/[id]/rules/[ruleId]`.

**Step 2: Create rules table component**

Table showing: name, date range, price modifier (%), min/max stay, enabled toggle. Edit and delete buttons per row.

**Step 3: Create rule form**

Sheet form: name, start date, end date, price modifier percentage, minimum stay, maximum stay.

**Step 4: Create rules page**

Server component that fetches rules via PMSClient and renders the table + create form.

**Step 5: Link from property detail**

Add a "Pricing Rules" link/tab on the property detail page.

**Step 6: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add seasonal pricing rules CRUD per property"
```

---

## Task 11: Channel Performance View

Add channel breakdown stats to the dashboard.

**Files:**
- Create: `app/src/components/dashboard/channel-breakdown.tsx`
- Modify: `app/src/app/(dashboard)/dashboard/page.tsx` — add channel section

**Step 1: Create channel breakdown component**

Client component that receives reservations and computes:
- Revenue per channel (Airbnb, Booking.com, Direct)
- Booking count per channel
- Average nightly rate per channel
- Display as horizontal bar chart or stat cards with channel-colored badges

**Step 2: Add to dashboard**

Pass reservations to the component from the dashboard server page. Add section below properties grid.

**Step 3: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add channel performance breakdown to dashboard"
```

---

## Task 12: Multi-Property Calendar (Gantt View)

Replace the single-property calendar with a multi-property timeline.

**Files:**
- Create: `app/src/components/calendar/multi-property-calendar.tsx`
- Modify: `app/src/app/(dashboard)/calendar/page.tsx` — fetch all properties' calendars
- Modify: `app/src/app/(dashboard)/calendar/calendar-content.tsx` — add view toggle

**Step 1: Create multi-property calendar**

Client component:
- Rows = properties (left column with property name)
- Columns = next 30 days (scrollable)
- Each cell: color-coded (green=available, red=booked, gray=blocked)
- Hover cell: tooltip with price, status, min stay
- Click available cell: open block popover
- Reservation blocks: span multiple cells, show guest name on hover
- Channel color-coding on reservation blocks

**Step 2: Add view toggle**

In calendar-content.tsx, add a toggle between "Single Property" (existing grid) and "Multi-Property" (new Gantt view).

**Step 3: Fetch all calendars**

In calendar page server component, fetch calendars for all properties (first 30 days for Gantt view).

**Step 4: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add multi-property Gantt calendar view with view toggle"
```

---

## Task 13: Enhanced AI Proposals

Add batch actions and richer context to proposals.

**Files:**
- Modify: `app/src/components/proposals/proposal-list.tsx` — add "Approve All Low-Risk" button
- Modify: `app/src/components/proposals/proposal-card.tsx` — show reservation context snippet

**Step 1: Add batch approve**

In proposal-list.tsx, add a "Approve All Low-Risk" button above the tabs that approves all pending proposals with `riskLevel === "low"`.

**Step 2: Add reservation context to proposal cards**

In proposal-card.tsx, add a small context line showing the property's area and current booking velocity if available.

**Step 3: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add batch approve and reservation context to proposals"
```

---

# PHASE 3 — Full Operations + Smart Automation

---

## Task 14: Guest Messaging Inbox

Build the inbox page with conversation list and message thread view.

**Files:**
- Create: `app/src/app/(dashboard)/inbox/page.tsx`
- Create: `app/src/components/inbox/conversation-list.tsx`
- Create: `app/src/components/inbox/message-thread.tsx`
- Create: `app/src/app/api/conversations/[id]/messages/route.ts`
- Modify: `app/src/components/layout/sidebar.tsx` — add Inbox to Operations section

**Step 1: Add Inbox to sidebar**

Add `{ href: "/inbox", label: "Inbox", icon: Mail }` to the Operations section in sidebar.tsx (import `Mail` from lucide-react).

**Step 2: Create conversation list component**

Client component showing list of conversations with: guest name, property name, last message preview, unread badge, timestamp. Click to select conversation.

**Step 3: Create message thread component**

Client component showing messages in a chat-style thread. Input at bottom to send new message. Message templates dropdown for quick replies.

**Step 4: Create inbox page**

Server component that fetches conversations. Client layout: conversation list on left (1/3), message thread on right (2/3). Mobile: full-screen list → tap to open thread.

**Step 5: Create messages API route**

GET to fetch messages for a conversation. POST to send a new message.

**Step 6: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add guest messaging inbox with conversation list and thread view"
```

---

## Task 15: Task Management

Build a task board for cleaning, maintenance, and other operational tasks.

**Files:**
- Create: `app/src/app/(dashboard)/tasks/page.tsx`
- Create: `app/src/components/tasks/task-board.tsx`
- Create: `app/src/components/tasks/task-card.tsx`
- Create: `app/src/components/tasks/create-task-form.tsx`
- Create: `app/src/app/api/tasks/route.ts`
- Create: `app/src/app/api/tasks/[id]/route.ts`
- Modify: `app/src/components/layout/sidebar.tsx` — add Tasks to Operations section

**Step 1: Add Tasks to sidebar**

Add `{ href: "/tasks", label: "Tasks", icon: CheckSquare }` to Operations section.

**Step 2: Create task card**

Card showing: title, property name, category badge (cleaning/maintenance/inspection), priority indicator, due date, assignee. Drag handle for kanban (or click to change status).

**Step 3: Create task board**

Three-column layout: To Do | In Progress | Done. Each column renders filtered task cards. "New Task" button opens create form.

**Step 4: Create task form**

Sheet form: property (select), title, description, category, priority, due date, assignee.

**Step 5: Create API routes and page**

Standard CRUD pattern. Server page fetches tasks, passes to board component.

**Step 6: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add task management board with kanban columns"
```

---

## Task 16: Expense Tracking

Add expense tracking per property and a summary view.

**Files:**
- Create: `app/src/app/(dashboard)/finance/page.tsx`
- Create: `app/src/components/finance/expense-table.tsx`
- Create: `app/src/components/finance/create-expense-form.tsx`
- Create: `app/src/components/finance/owner-statement-card.tsx`
- Create: `app/src/app/api/expenses/route.ts`
- Modify: `app/src/components/layout/sidebar.tsx` — add Finance to Intelligence section

**Step 1: Add Finance to sidebar**

Add `{ href: "/finance", label: "Finance", icon: Wallet }` to Intelligence section.

**Step 2: Create expense table**

Table with: date, property, category, description, amount. Filters by property and category. "Add Expense" button.

**Step 3: Create owner statement cards**

Per-property summary: total revenue, total expenses, net income, occupancy rate. Displayed as a grid of cards or a table.

**Step 4: Create finance page**

Tabs: "Expenses" (table) and "Statements" (per-property P&L cards).

**Step 5: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add finance page with expense tracking and owner statements"
```

---

## Task 17: AI Automation Settings

Add auto-approve toggle and revenue forecasting.

**Files:**
- Create: `app/src/stores/settings-store.ts` — automation settings
- Modify: `app/src/components/proposals/proposal-list.tsx` — auto-approve toggle
- Create: `app/src/components/dashboard/revenue-forecast.tsx` — 30/60/90 day projections
- Modify: `app/src/app/(dashboard)/dashboard/page.tsx` — add forecast section

**Step 1: Create settings store**

```typescript
// app/src/stores/settings-store.ts
import { create } from "zustand";

interface SettingsStore {
  autoApproveLowRisk: boolean;
  setAutoApproveLowRisk: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  autoApproveLowRisk: false,
  setAutoApproveLowRisk: (value) => set({ autoApproveLowRisk: value }),
}));
```

**Step 2: Add auto-approve toggle**

In proposal-list.tsx, add a toggle switch above the tabs: "Auto-approve low-risk proposals". When enabled, new low-risk proposals are automatically set to "approved" status.

**Step 3: Create revenue forecast component**

Client component that takes calendar + reservation data and projects:
- 30-day revenue (based on booked nights × prices)
- 60-day revenue
- 90-day revenue
- Display as stat cards with trend indicators

**Step 4: Add to dashboard**

Add `<RevenueForecast>` section to dashboard page between KPI cards and properties grid.

**Step 5: Verify & Commit**

```bash
cd app && npx tsc --noEmit && npm run build
git add -A
git commit -m "feat: add AI automation settings and revenue forecasting"
```

---

## Task 18: Final Sidebar + Polish

Ensure sidebar matches the target state and all pages are linked.

**Files:**
- Modify: `app/src/components/layout/sidebar.tsx`

**Target sidebar:**

```
OPERATIONS
  Dashboard
  Properties
  Reservations
  Calendar
  Inbox
  Tasks

INTELLIGENCE
  Proposals
  Insights
  Finance

---
Agents (status)
Ask AI
```

**Step 1: Verify all routes work**

Run dev server and manually verify each page loads:
- `/dashboard` — KPIs + channel breakdown + revenue forecast + properties
- `/properties` — listing grid with edit capability
- `/properties/[id]` — detail with edit form + pricing rules link
- `/reservations` — filterable table + new booking button
- `/reservations/[id]` — detail page
- `/calendar` — single + multi-property views with block/unblock
- `/inbox` — conversation list + thread
- `/tasks` — kanban board
- `/proposals` — proposals with batch approve + auto-approve toggle
- `/insights` — events + market signals
- `/finance` — expenses + owner statements

**Step 2: Final type check and build**

Run: `cd app && npx tsc --noEmit`
Expected: Zero errors

Run: `cd app && npm run build`
Expected: All routes in build output, zero errors

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: finalize sidebar structure and verify all Phase 1-3 pages"
```

---

## Verification Checklist (All Phases)

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — passes
- [ ] `npm run dev` — all pages render
- [ ] Sidebar: Operations and Intelligence sections visible
- [ ] Dashboard: KPIs, channel breakdown, revenue forecast, properties grid
- [ ] Properties: list, detail, edit form, pricing rules
- [ ] Reservations: filterable table, detail page, create booking
- [ ] Calendar: single-property grid, multi-property Gantt, block/unblock
- [ ] Inbox: conversation list, message thread, quick replies
- [ ] Tasks: kanban board, create task
- [ ] Proposals: approve/reject, batch approve, auto-approve toggle
- [ ] Insights: events, market signals
- [ ] Finance: expenses table, owner statements
- [ ] AI Chat: context includes property details + capacity
- [ ] All data powered by mock store (no live API dependency)
