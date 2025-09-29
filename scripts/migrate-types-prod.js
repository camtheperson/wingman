#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Read the items.json file
const dataPath = path.join(process.cwd(), "data", "items.json");
const items = JSON.parse(fs.readFileSync(dataPath, "utf8"));

console.log(`Found ${items.length} items to process for type migration`);

// Use production Convex URL
const prodConvexUrl = "https://bold-puffin-534.convex.cloud";
console.log(`Connecting to production: ${prodConvexUrl}`);

const client = new ConvexHttpClient(prodConvexUrl);

// First, let's create a migration function that only handles type splitting
// This will find existing locationItems and create additional entries for multi-type items
const itemsNeedingTypeMigration = items.filter(item => {
  const typeString = item.type || "meat";
  const types = typeString.split(',').map(t => t.trim().toLowerCase()).filter(t => 
    t === "meat" || t === "vegetarian" || t === "vegan"
  );
  return types.length > 1; // Only items with multiple types need migration
});

console.log(`Found ${itemsNeedingTypeMigration.length} items with multiple types that need migration`);

if (itemsNeedingTypeMigration.length === 0) {
  console.log("No type migration needed - all items already have single types");
  process.exit(0);
}

// Process items to create the type migration data
const typeMigrationData = [];

for (const item of itemsNeedingTypeMigration) {
  const typeString = item.type || "meat";
  const types = typeString.split(',').map(t => t.trim().toLowerCase()).filter(t => 
    t === "meat" || t === "vegetarian" || t === "vegan"
  );
  
  // Add an entry for each additional type (skip the first one as it should already exist)
  for (let i = 1; i < types.length; i++) {
    typeMigrationData.push({
      restaurantName: item.restaurantName,
      itemName: item.itemName,
      description: item.description,
      altDescription: item.altDescription,
      type: types[i],
      glutenFree: item.glutenFree,
      url: item.url,
      image: item.image,
      imageUrl: item.imageUrl,
    });
  }
}

console.log(`Will create ${typeMigrationData.length} additional locationItems for type variants`);

if (typeMigrationData.length === 0) {
  console.log("No additional type entries needed");
  process.exit(0);
}

// Migrate data in batches
const batchSize = 25;
for (let i = 0; i < typeMigrationData.length; i += batchSize) {
  const batch = typeMigrationData.slice(i, i + batchSize);
  console.log(`Migrating type batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(typeMigrationData.length / batchSize)}`);
  
  try {
    await client.mutation("migrations:migrateTypesOnly", {
      items: batch
    });
    console.log(`✓ Type batch ${Math.floor(i / batchSize) + 1} completed`);
  } catch (error) {
    console.error(`✗ Type batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    process.exit(1);
  }
}

console.log("✅ Type migration completed successfully!");
console.log("Run the migration to verify the count matches your dev environment");
process.exit(0);