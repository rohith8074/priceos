# PriceOS Dashboard Architecture & Data Flow Reference

This document provides an in-depth explanation of the data pipeline that powers the primary `/overview` Revenue Dashboard in PriceOS. It maps exactly where the data comes from at the database layer, how it's aggregated inside the application, and how it directly drives the UI Components on screen.

## High Level Overview

The data starts its journey in the `overview/page.tsx` React Server Component. This server-side function connects directly to Neon/PostgreSQL using Drizzle ORM to fetch the `listings`, `inventory_master` (calendar blocks/rates), and `activity_timeline` (reservations & events) across a forward-looking 30-day window. 

The server aggregates and maps the relational rows into hierarchical JSON tree structures (`PropertyMetric[]`), and hydrates the strongly-typed Client Component `<OverviewClient />`.

---

## 1. Top KPI Cards Details

The first row of the dashboard contains four massive visual KPI cards. They respond to any text search input applied by the operator. 

### A. Total Properties
- **Data Source:** Fetched via SQL from the `listings` table.
- **Calculation:** Represents `filteredProperties.length`. Simple count of all active listings matched against any active UI text filters.
- **UI Element:** Displays inside the top-left KPI Card with a `Building2` Lucide icon.

### B. Avg Occupancy (30D)
- **Data Source:** `inventory_master` table (constrained strictly between `CURRENT_DATE` and `CURRENT_DATE + 30`).
- **Calculation:** Across the entire portfolio cohort, we look at the total number of days mapped out in the array `filteredProperties.flatMap(p => p.calendarDays)`. We count any days where `status === 'reserved'` or `status === 'booked'`.
$$(\text{Total Booked Days} / \text{Total Active Calendar Days}) \times 100$$
- **UI Element:** Represented as a percentage with a trend indicator showing `Real-time availability`.

### C. Avg Daily Rate (ADR)
- **Data Source:** `inventory_master` table's `currentPrice` column.
- **Calculation:** We filter down to all strictly actively listed properties. We take the sum of `currentPrice` for all properties over the 30 day frame, and divide it by the total calendar days. 
- **UI Element:** Displayed with the `AED` unit, localized cleanly into a numeric integer formatted string.

### D. Projected Revenue
- **Data Source:** Primarily sourced from physical reservations (`activity_timeline` where `type='reservation'`), supplemented conditionally by extrapolating the `currentPrice` against the `inventory_master` availability schema.
- **Calculation:** Inside the client code we map through `filteredProperties.reduce((sum, prop) => sum + prop.revenue, 0)`.
- **UI Element:** This is the flagship KPI, rendered with a translucent `amber-500` gradient text clip, ensuring operators know the exact monetary expectation for the future 30-day block.

---

## 2. Dynamic Metric Visualizations

The mid-section contains graphical data representations powered primarily by the `<Recharts />` framework.

### A. Top Drivers by Revenue (Bar Chart)
- **Objective:** Visually isolate the 10 highest-earning assets in the portfolio over the cohort window.
- **Calculation Logic:** We take the `filteredProperties` array and apply `.sort((a, b) => b.revenue - a.revenue)`. We then apply a `.slice(0, 10)` to extract ONLY the top ten records. 
- **UI Mechanism:** We pipe this sorted 10-item array directly into a `<BarChart>` and dynamically map the columns. We apply localized sequential HEX coloring (from the `BAR_COLORS` array like Emerald, Blue, Amber, Violet) so each property is distinctly segregated visually. 
- **Hover:** Uses a custom `CustomTooltip` component injected into the `<Tooltip>` primitive to render stylized AED values upon hover.

### B. Revenue By Channel (Donut Chart)
- **Objective:** Reveal the distribution logic (OTA dependency) for all generated booking revenue.
- **Source Data:** Inside the `activity_timeline` table, all reservations are stored with a heavy JSONB payload called `financials` (which contains `hostPayout`, `totalPrice`, and the string `channelName` / `channel`).
- **Calculation Logic:**
  1. Iterate across all `filteredProperties.forEach(prop => prop.reservations?.forEach(...))`
  2. Normalize the strings. Any string matching `"airbnb"` groups to `Airbnb`. Any string matching `"booking"` groups to `Booking.com`. Everything else defers to `Direct`.
  3. Aggregate the nested `hostPayout` values into a `channelDataMap` hash map.
- **UI Mechanism:** Passed into `<PieChart>` configuring a donut style with `innerRadius={60}` and `outerRadius={80}`. The donut strictly adheres to standard OTA brand colors defined in the `PIE_COLORS` dictionary (`#ef4444` for Airbnb, `#3b82f6` for Booking).

---

## 3. Global Availability Master Calendar

The lower half dominates the screen with an interactive master spreadsheet-like scheduling grid. 

- **Data Alignment:** For every `filteredProperty`, it looks across the unified `next30Days` date iterator. 
- **DB Checkpoint 1 (Inventory Block):** Does the `inventory_master` state this block is "blocked"? If so, render a muted-gray rounded box (`bg-neutral-500/30`).
- **DB Checkpoint 2 (Reserved Check):** The `activity_timeline` records reservations as independent rows with a `startDate` and `endDate`. We execute an interval verification `isWithinInterval(d, { start: parseISO(r.startDate), end: parseISO(r.endDate) })`.
- **Output:** If it is a confirmed reservation, the logic forces the UI box to shade `#rose-500`, injects the `reservation.title` (Guest Name) and `financials` payload into a custom floating Root portal tooltip container that bursts into 3D view upon hover via the Radix UI `<Tooltip>` framework.
- **Future Guest Details Schema:** Note that an upcoming schema upgrade formally designates `guestDetails` (JSONB: name, email, phone) to the `activity_timeline` database layer explicitly linked to the PMS Hostaway integrations, empowering the timeline tooltip with high-fidelity guest profile data in the future!
