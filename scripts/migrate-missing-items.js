#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// The specific missing items we identified
const missingItems = [
  { restaurantName: "Fire on the Mountain", itemName: "El Guapo", type: "vegan" },
  { restaurantName: "Fire on the Mountain", itemName: "Marionberry Habanero", type: "vegetarian" },
  { restaurantName: "Fire on the Mountain", itemName: "Szechuan Peppercorn", type: "vegetarian" },
  { restaurantName: "Grand Fir Brewing", itemName: "Szechuan Orange Glazed Smoked Chicken Wings", type: "vegetarian" },
  { restaurantName: "Hungry Tiger", itemName: "Vegan Mango & Habanero Wings", type: "vegetarian" },
  { restaurantName: "Hunny Beez", itemName: "Garlic Stingin' Wings", type: "vegetarian" },
  { restaurantName: "Moreland Ale House", itemName: "Wing and a prayer", type: "vegan" },
  { restaurantName: "Sad Valley", itemName: "Firestarters", type: "vegetarian" },
  { restaurantName: "The Sports Bra", itemName: "Power Play Wings", type: "vegan" },
];

// Read the full items.json to get complete data for these items
const dataPath = path.join(process.cwd(), "data", "items.json");
const allItems = JSON.parse(fs.readFileSync(dataPath, "utf8"));

console.log(`🔍 Creating targeted migration for ${missingItems.length} missing items...`);

// Find the complete data for each missing item
const completeItemsToMigrate = [];

for (const missingItem of missingItems) {
  const fullItem = allItems.find(item => 
    item.restaurantName === missingItem.restaurantName && 
    item.itemName === missingItem.itemName
  );
  
  if (fullItem) {
    completeItemsToMigrate.push({
      restaurantName: fullItem.restaurantName,
      itemName: fullItem.itemName,
      description: fullItem.description,
      altDescription: fullItem.altDescription,
      type: missingItem.type, // Use the specific type we need
      glutenFree: fullItem.glutenFree,
      url: fullItem.url,
      image: fullItem.image,
      imageUrl: fullItem.imageUrl,
    });
  } else {
    console.log(`⚠️  Could not find full data for: ${missingItem.restaurantName} - ${missingItem.itemName}`);
  }
}

console.log(`📦 Found complete data for ${completeItemsToMigrate.length} items`);

// Use production Convex URL
const prodConvexUrl = "https://bold-puffin-534.convex.cloud";
console.log(`🚀 Connecting to production: ${prodConvexUrl}`);

const client = new ConvexHttpClient(prodConvexUrl);

try {
  console.log("🔄 Running targeted type migration...");
  
  const result = await client.mutation("migrations:migrateTypesOnly", {
    items: completeItemsToMigrate
  });
  
  console.log("✅ Targeted migration completed!");
  console.log(`Created: ${result.created} items`);
  console.log(`Skipped: ${result.skipped} items`);
  console.log(`Not found: ${result.notFound} items`);
  console.log(`Total processed: ${result.total} items`);
  
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
}

process.exit(0);