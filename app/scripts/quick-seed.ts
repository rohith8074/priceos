/**
 * Quick seed script - inserts data without truncating
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db';
import { listings, calendarDays, reservations } from '../src/lib/db';
import { addDays, format } from 'date-fns';

async function quickSeed() {
  console.log('🌱 Quick seeding database...\n');

  try {
    // Check if listings exist
    const existingListings = await db.select().from(listings);

    if (existingListings.length > 0) {
      console.log(`✅ Found ${existingListings.length} existing listings`);
      console.log('✅ Database already seeded!');
      return;
    }

    console.log('📝 Inserting listings...');

    const newListings = await db.insert(listings).values([
      {
        hostawayId: '1001',
        name: 'Marina Heights 1BR',
        area: 'Dubai Marina',
        bedroomsNumber: 1,
        bathroomsNumber: 1,
        propertyType: 'Apartment',
        price: '750',
        priceFloor: '500',
        priceCeiling: '1200',
        personCapacity: 2,
        amenities: ['WiFi', 'Pool', 'Gym', 'Sea View'],
      },
      {
        hostawayId: '1002',
        name: 'Downtown Residences 2BR',
        area: 'Downtown Dubai',
        bedroomsNumber: 2,
        bathroomsNumber: 2,
        propertyType: 'Apartment',
        price: '950',
        priceFloor: '700',
        priceCeiling: '1500',
        personCapacity: 4,
        amenities: ['WiFi', 'Pool', 'Gym', 'City View'],
      },
      {
        hostawayId: '1003',
        name: 'JBR Beach Studio',
        area: 'JBR',
        bedroomsNumber: 0,
        bathroomsNumber: 1,
        propertyType: 'Studio',
        price: '600',
        priceFloor: '400',
        priceCeiling: '900',
        personCapacity: 2,
        amenities: ['WiFi', 'Beach Access', 'Pool'],
      },
      {
        hostawayId: '1004',
        name: 'Palm Villa 3BR',
        area: 'Palm Jumeirah',
        bedroomsNumber: 3,
        bathroomsNumber: 3,
        propertyType: 'Villa',
        price: '1800',
        priceFloor: '1200',
        priceCeiling: '3000',
        personCapacity: 6,
        amenities: ['WiFi', 'Private Pool', 'Beach Access', 'Garden'],
      },
      {
        hostawayId: '1005',
        name: 'Bay View 1BR',
        area: 'Business Bay',
        bedroomsNumber: 1,
        bathroomsNumber: 1,
        propertyType: 'Apartment',
        price: '700',
        priceFloor: '450',
        priceCeiling: '1100',
        personCapacity: 2,
        amenities: ['WiFi', 'Pool', 'Gym'],
      },
    ]).returning();

    console.log(`✅ Inserted ${newListings.length} listings`);

    // Insert calendar days for next 30 days
    console.log('\n📅 Inserting calendar data...');
    const today = new Date();
    const calendarData = [];

    for (const listing of newListings) {
      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        calendarData.push({
          listingId: listing.id,
          date: format(date, 'yyyy-MM-dd'),
          status: Math.random() > 0.3 ? ('available' as const) : ('booked' as const),
          price: listing.price,
          minimumStay: 1,
          maximumStay: 30,
        });
      }
    }

    await db.insert(calendarDays).values(calendarData);
    console.log(`✅ Inserted ${calendarData.length} calendar days`);

    console.log('\n✅ Quick seed complete!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

quickSeed()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
