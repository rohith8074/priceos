"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Listing, Reservation } from "@/types/hostaway";

interface BookingsDataTableProps {
  reservations: Reservation[];
  properties: Listing[];
}

function getPropertyName(
  listingMapId: number,
  properties: Listing[]
): string {
  return properties.find((p) => p.id === listingMapId)?.name ?? `#${listingMapId}`;
}

function getChannelVariant(channel: string) {
  switch (channel) {
    case "Airbnb":
      return "default";
    case "Booking.com":
      return "secondary";
    case "Direct":
      return "outline";
    default:
      return "outline";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "completed":
      return "outline";
    default:
      return "outline";
  }
}

export function BookingsDataTable({
  reservations,
  properties,
}: BookingsDataTableProps) {
  const columns: ColumnDef<Reservation>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "guestName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Guest
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "listingMapId",
      header: "Property",
      cell: ({ row }) =>
        getPropertyName(row.getValue("listingMapId"), properties),
    },
    {
      accessorKey: "channelName",
      header: "Channel",
      cell: ({ row }) => (
        <Badge variant={getChannelVariant(row.getValue("channelName")) as "default" | "secondary" | "outline" | "destructive"}>
          {row.getValue("channelName")}
        </Badge>
      ),
    },
    {
      accessorKey: "arrivalDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Check-in
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "departureDate",
      header: "Check-out",
    },
    {
      accessorKey: "nights",
      header: "Nights",
    },
    {
      accessorKey: "totalPrice",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("totalPrice") as number;
        return `${amount.toLocaleString("en-US")} AED`;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.getValue("status")) as "default" | "secondary" | "outline" | "destructive"}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Link href={`/reservations/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={reservations}
      searchKey="guestName"
      searchPlaceholder="Search guests..."
    />
  );
}
