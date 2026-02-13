import { Listing } from "@/types/hostaway";

/**
 * Mock Dubai Properties
 * 5 diverse units across different areas and types for testing
 */

export const MOCK_PROPERTIES: Listing[] = [
  {
    id: 1001,
    name: "Marina Heights 1BR",
    city: "Dubai",
    countryCode: "AE",
    area: "Dubai Marina",
    bedroomsNumber: 1,
    bathroomsNumber: 1,
    propertyType: "Apartment",
    price: 550,
    currencyCode: "AED",
    priceFloor: 400,
    priceCeiling: 800,
    personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Sea View"],
  },
  {
    id: 1002,
    name: "Downtown Residences 2BR",
    city: "Dubai",
    countryCode: "AE",
    area: "Downtown Dubai",
    bedroomsNumber: 2,
    bathroomsNumber: 2,
    propertyType: "Apartment",
    price: 850,
    currencyCode: "AED",
    priceFloor: 600,
    priceCeiling: 1200,
    personCapacity: 4,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Burj View", "Pool Access"],
  },
  {
    id: 1003,
    name: "JBR Beach Studio",
    city: "Dubai",
    countryCode: "AE",
    area: "Jumeirah Beach Residence",
    bedroomsNumber: 0,
    bathroomsNumber: 1,
    propertyType: "Studio",
    price: 400,
    currencyCode: "AED",
    priceFloor: 300,
    priceCeiling: 600,
    personCapacity: 1,
    amenities: ["WiFi", "AC", "Kitchenette", "Beach Access", "Pool"],
  },
  {
    id: 1004,
    name: "Palm Villa 3BR",
    city: "Dubai",
    countryCode: "AE",
    area: "Palm Jumeirah",
    bedroomsNumber: 3,
    bathroomsNumber: 3,
    propertyType: "Villa",
    price: 2000,
    currencyCode: "AED",
    priceFloor: 1500,
    priceCeiling: 3000,
    personCapacity: 6,
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
    name: "Bay View 1BR",
    city: "Dubai",
    countryCode: "AE",
    area: "Business Bay",
    bedroomsNumber: 1,
    bathroomsNumber: 1,
    propertyType: "Apartment",
    price: 500,
    currencyCode: "AED",
    priceFloor: 350,
    priceCeiling: 700,
    personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Bay View", "Gym Access"],
  },
];

export function getMockProperty(id: number): Listing | undefined {
  return MOCK_PROPERTIES.find((p) => p.id === id);
}

export function getMockPropertiesByArea(area: string): Listing[] {
  return MOCK_PROPERTIES.filter((p) => p.area === area);
}
