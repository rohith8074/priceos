"use client";

import type { Listing } from "@/types/hostaway";
import { PropertyCard } from "./property-card";

interface PropertyListProps {
  properties: Listing[];
  detailed?: boolean;
}

export function PropertyList({ properties, detailed = false }: PropertyListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} detailed={detailed} />
      ))}
    </div>
  );
}
