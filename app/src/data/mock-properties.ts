import { Listing } from "@/types/hostaway";

/**
 * Mock Dubai Properties
 * 5 diverse units across different areas and types for testing
 */

export const MOCK_PROPERTIES: Listing[] = [
  {
    id: 1001,
    hostawayListingId: "LIST-1001",
    name: "Marina Heights 1BR",
    address: {
      city: "Dubai",
      area: "Dubai Marina",
      country: "AE",
    },
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    basePrice: 550,
    currency: "AED",
    priceFloor: 400,
    priceCeiling: 800,
    maximumGuests: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Sea View"],
  },
  {
    id: 1002,
    hostawayListingId: "LIST-1002",
    name: "Downtown Residences 2BR",
    address: {
      city: "Dubai",
      area: "Downtown Dubai",
      country: "AE",
    },
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Apartment",
    basePrice: 850,
    currency: "AED",
    priceFloor: 600,
    priceCeiling: 1200,
    maximumGuests: 4,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Burj View", "Pool Access"],
  },
  {
    id: 1003,
    hostawayListingId: "LIST-1003",
    name: "JBR Beach Studio",
    address: {
      city: "Dubai",
      area: "Jumeirah Beach Residence",
      country: "AE",
    },
    bedrooms: 0,
    bathrooms: 1,
    propertyType: "Studio",
    basePrice: 400,
    currency: "AED",
    priceFloor: 300,
    priceCeiling: 600,
    maximumGuests: 1,
    amenities: ["WiFi", "AC", "Kitchenette", "Beach Access", "Pool"],
  },
  {
    id: 1004,
    hostawayListingId: "LIST-1004",
    name: "Palm Villa 3BR",
    address: {
      city: "Dubai",
      area: "Palm Jumeirah",
      country: "AE",
    },
    bedrooms: 3,
    bathrooms: 3,
    propertyType: "Villa",
    basePrice: 2000,
    currency: "AED",
    priceFloor: 1500,
    priceCeiling: 3000,
    maximumGuests: 6,
    amenities: [
      "WiFi",
      "AC",
      "Full Kitchen",
      "Private Pool",
      "Garden",
      "Beach Access",
      "Maid Room",
    ],
  },
  {
    id: 1005,
    hostawayListingId: "LIST-1005",
    name: "Bay View 1BR",
    address: {
      city: "Dubai",
      area: "Business Bay",
      country: "AE",
    },
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    basePrice: 500,
    currency: "AED",
    priceFloor: 350,
    priceCeiling: 700,
    maximumGuests: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Bay View", "Gym Access"],
  },
];

export function getMockProperty(id: number): Listing | undefined {
  return MOCK_PROPERTIES.find((p) => p.id === id);
}

export function getMockPropertiesByArea(area: string): Listing[] {
  return MOCK_PROPERTIES.filter((p) => p.address.area === area);
}
