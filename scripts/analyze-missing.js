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

const prodConvexUrl = "https://bold-puffin-534.convex.cloud";
const devConvexUrl = process.env.VITE_CONVEX_URL;

console.log("🔍 Analyzing missing items between dev and prod...\n");

const devClient = new ConvexHttpClient(devConvexUrl);
const prodClient = new ConvexHttpClient(prodConvexUrl);

try {
  // Get all items from both environments
  const devData = await devClient.query("locations:getAllLocationsWithItems", {});
  const prodData = await prodClient.query("locations:getAllLocationsWithItems", {});
  
  // Create maps for easier comparison
  const devItemsMap = new Map();
  const prodItemsMap = new Map();
  
  // Build dev items map
  devData.forEach(location => {
    if (location.items) {
      location.items.forEach(item => {
        const key = `${location.restaurantName}|${item.itemName}|${item.type}`;
        devItemsMap.set(key, { location: location.restaurantName, item: item.itemName, type: item.type });
      });
    }
  });
  
  // Build prod items map
  prodData.forEach(location => {
    if (location.items) {
      location.items.forEach(item => {
        const key = `${location.restaurantName}|${item.itemName}|${item.type}`;
        prodItemsMap.set(key, { location: location.restaurantName, item: item.itemName, type: item.type });
      });
    }
  });
  
  console.log(`Dev has ${devItemsMap.size} total items`);
  console.log(`Prod has ${prodItemsMap.size} total items\n`);
  
  // Find items that are in dev but not in prod
  const missingInProd = [];
  for (const [key, value] of devItemsMap) {
    if (!prodItemsMap.has(key)) {
      missingInProd.push(value);
    }
  }
  
  console.log(`Found ${missingInProd.length} items missing in prod:\n`);
  
  // Group by restaurant for easier reading
  const missingByRestaurant = {};
  missingInProd.forEach(item => {
    if (!missingByRestaurant[item.location]) {
      missingByRestaurant[item.location] = [];
    }
    missingByRestaurant[item.location].push(`${item.item} (${item.type})`);
  });
  
  // Display missing items
  Object.entries(missingByRestaurant).forEach(([restaurant, items]) => {
    console.log(`🏪 ${restaurant}:`);
    items.forEach(item => {
      console.log(`  - ${item}`);
    });
    console.log('');
  });
  
  // Analyze what types are missing
  const missingTypes = {};
  missingInProd.forEach(item => {
    if (!missingTypes[item.type]) {
      missingTypes[item.type] = 0;
    }
    missingTypes[item.type]++;
  });
  
  console.log("Missing items by type:");
  Object.entries(missingTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} items`);
  });
  
} catch (error) {
  console.error("Error analyzing data:", error);
}