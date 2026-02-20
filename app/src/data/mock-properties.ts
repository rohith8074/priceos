import { Listing } from "@/types/hostaway";

/**
 * Mock Dubai Properties
 * 15 diverse units across different areas and types for testing
 */

export const MOCK_PROPERTIES: Listing[] = [
  {
    id: 1001, name: "Marina Heights 1BR", city: "Dubai", countryCode: "AE",
    area: "Dubai Marina", bedroomsNumber: 1, bathroomsNumber: 1, propertyTypeId: 1,
    price: 550, priceFloor: 440, priceCeiling: 825, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Sea View"],
    address: "Marina Heights Tower, Dubai Marina, Dubai, UAE",
    latitude: 25.0800, longitude: 55.1400,
  },
  {
    id: 1002, name: "Downtown Residences 2BR", city: "Dubai", countryCode: "AE",
    area: "Downtown Dubai", bedroomsNumber: 2, bathroomsNumber: 2, propertyTypeId: 1,
    price: 850, priceFloor: 680, priceCeiling: 1275, currencyCode: "AED", personCapacity: 4,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Burj View", "Pool Access"],
    address: "The Residences, Downtown Dubai, Dubai, UAE",
    latitude: 25.1972, longitude: 55.2744,
  },
  {
    id: 1003, name: "JBR Beach Studio", city: "Dubai", countryCode: "AE",
    area: "Jumeirah Beach Residence", bedroomsNumber: 0, bathroomsNumber: 1, propertyTypeId: 4,
    price: 400, priceFloor: 320, priceCeiling: 600, currencyCode: "AED", personCapacity: 1,
    amenities: ["WiFi", "AC", "Kitchenette", "Beach Access", "Pool"],
    address: "Shams 1, JBR, Dubai, UAE",
    latitude: 25.0780, longitude: 55.1340,
  },
  {
    id: 1004, name: "Palm Villa 3BR", city: "Dubai", countryCode: "AE",
    area: "Palm Jumeirah", bedroomsNumber: 3, bathroomsNumber: 3, propertyTypeId: 3,
    price: 2000, priceFloor: 1600, priceCeiling: 3000, currencyCode: "AED", personCapacity: 6,
    amenities: ["WiFi", "AC", "Full Kitchen", "Private Pool", "Garden", "Beach Access", "Maid Room"],
    address: "Frond M, Palm Jumeirah, Dubai, UAE",
    latitude: 25.1124, longitude: 55.1390,
  },
  {
    id: 1005, name: "Bay View 1BR", city: "Dubai", countryCode: "AE",
    area: "Business Bay", bedroomsNumber: 1, bathroomsNumber: 1, propertyTypeId: 1,
    price: 500, priceFloor: 400, priceCeiling: 750, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Bay View", "Gym Access"],
    address: "The Bay Gate, Business Bay, Dubai, UAE",
    latitude: 25.1850, longitude: 55.2650,
  },
  {
    id: 1006, name: "Creek Harbour Studio", city: "Dubai", countryCode: "AE",
    area: "Dubai Creek Harbour", bedroomsNumber: 0, bathroomsNumber: 1, propertyTypeId: 4,
    price: 380, priceFloor: 304, priceCeiling: 570, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchenette", "Pool", "Gym", "Creek View"],
    address: "Harbour Views 1, Dubai Creek Harbour, Dubai, UAE",
    latitude: 25.1970, longitude: 55.3370,
  },
  {
    id: 1007, name: "DIFC Tower 2BR", city: "Dubai", countryCode: "AE",
    area: "DIFC", bedroomsNumber: 2, bathroomsNumber: 2, propertyTypeId: 1,
    price: 1200, priceFloor: 960, priceCeiling: 1800, currencyCode: "AED", personCapacity: 4,
    amenities: ["WiFi", "AC", "Full Kitchen", "Balcony", "City View", "Concierge"],
    address: "Sky Gardens, DIFC, Dubai, UAE",
    latitude: 25.2100, longitude: 55.2800,
  },
  {
    id: 1008, name: "JVC Family 3BR", city: "Dubai", countryCode: "AE",
    area: "Jumeirah Village Circle", bedroomsNumber: 3, bathroomsNumber: 2, propertyTypeId: 5,
    price: 650, priceFloor: 520, priceCeiling: 975, currencyCode: "AED", personCapacity: 6,
    amenities: ["WiFi", "AC", "Full Kitchen", "Garden", "Parking", "Community Pool"],
    address: "Nakheel Townhouses, JVC, Dubai, UAE",
    latitude: 25.0590, longitude: 55.2100,
  },
  {
    id: 1009, name: "Marina Walk Studio", city: "Dubai", countryCode: "AE",
    area: "Dubai Marina", bedroomsNumber: 0, bathroomsNumber: 1, propertyTypeId: 4,
    price: 420, priceFloor: 336, priceCeiling: 630, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchenette", "Marina View", "Gym"],
    address: "Marina Promenade, Dubai Marina, Dubai, UAE",
    latitude: 25.0770, longitude: 55.1380,
  },
  {
    id: 1010, name: "Springs Villa 4BR", city: "Dubai", countryCode: "AE",
    area: "The Springs", bedroomsNumber: 4, bathroomsNumber: 3, propertyTypeId: 3,
    price: 1100, priceFloor: 880, priceCeiling: 1650, currencyCode: "AED", personCapacity: 8,
    amenities: ["WiFi", "AC", "Full Kitchen", "Private Garden", "Community Pool", "Parking", "Lake View"],
    address: "Springs 3, The Springs, Dubai, UAE",
    latitude: 25.0430, longitude: 55.1870,
  },
  {
    id: 1011, name: "City Walk 1BR", city: "Dubai", countryCode: "AE",
    area: "City Walk", bedroomsNumber: 1, bathroomsNumber: 1, propertyTypeId: 1,
    price: 750, priceFloor: 600, priceCeiling: 1125, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Balcony", "Rooftop Pool", "Shopping Access"],
    address: "Building 11, City Walk, Dubai, UAE",
    latitude: 25.2070, longitude: 55.2630,
  },
  {
    id: 1012, name: "Silicon Oasis 2BR", city: "Dubai", countryCode: "AE",
    area: "Dubai Silicon Oasis", bedroomsNumber: 2, bathroomsNumber: 2, propertyTypeId: 1,
    price: 450, priceFloor: 360, priceCeiling: 675, currencyCode: "AED", personCapacity: 4,
    amenities: ["WiFi", "AC", "Kitchen", "Pool", "Gym", "Parking"],
    address: "Le Presidium, Dubai Silicon Oasis, Dubai, UAE",
    latitude: 25.1210, longitude: 55.3780,
  },
  {
    id: 1013, name: "Al Barsha Heights 1BR", city: "Dubai", countryCode: "AE",
    area: "Al Barsha", bedroomsNumber: 1, bathroomsNumber: 1, propertyTypeId: 1,
    price: 350, priceFloor: 280, priceCeiling: 525, currencyCode: "AED", personCapacity: 2,
    amenities: ["WiFi", "AC", "Kitchen", "Gym", "Near MOE"],
    address: "Lakepoint Tower, Al Barsha, Dubai, UAE",
    latitude: 25.1000, longitude: 55.1930,
  },
  {
    id: 1014, name: "Bluewaters 2BR Penthouse", city: "Dubai", countryCode: "AE",
    area: "Bluewaters Island", bedroomsNumber: 2, bathroomsNumber: 2, propertyTypeId: 1,
    price: 1800, priceFloor: 1440, priceCeiling: 2700, currencyCode: "AED", personCapacity: 4,
    amenities: ["WiFi", "AC", "Full Kitchen", "Terrace", "Sea View", "Ain Dubai View", "Private Beach"],
    address: "Apartment 1, Bluewaters Residences, Dubai, UAE",
    latitude: 25.0790, longitude: 55.1190,
  },
  {
    id: 1015, name: "Arabian Ranches 5BR", city: "Dubai", countryCode: "AE",
    area: "Arabian Ranches", bedroomsNumber: 5, bathroomsNumber: 4, propertyTypeId: 3,
    price: 1500, priceFloor: 1200, priceCeiling: 2250, currencyCode: "AED", personCapacity: 10,
    amenities: ["WiFi", "AC", "Full Kitchen", "Private Pool", "Large Garden", "Maid Room", "BBQ Area", "Golf Course Access"],
    address: "Saheel Villa, Arabian Ranches, Dubai, UAE",
    latitude: 25.0560, longitude: 55.2670,
  },
];

export function getMockProperty(id: number): Listing | undefined {
  return MOCK_PROPERTIES.find((p) => p.id === id);
}

export function getMockPropertiesByArea(area: string): Listing[] {
  return MOCK_PROPERTIES.filter((p) => p.area === area);
}
