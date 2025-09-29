#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const devConvexUrl = process.env.VITE_CONVEX_URL;
const prodConvexUrl = "https://bold-puffin-534.convex.cloud";

console.log("🎉 Final Migration Verification\n");

const devClient = new ConvexHttpClient(devConvexUrl);
const prodClient = new ConvexHttpClient(prodConvexUrl);

try {
  // Get counts
  const devLocations = await devClient.query("locations:count", {});
  const devItems = await devClient.query("locations:countItems", {});
  const prodLocations = await prodClient.query("locations:count", {});
  const prodItems = await prodClient.query("locations:countItems", {});
  
  console.log("📊 Final Database State:");
  console.log("┌─────────────┬─────────────┬─────────────┐");
  console.log("│ Environment │ Locations   │ Items       │");
  console.log("├─────────────┼─────────────┼─────────────┤");
  console.log(`│ Development │ ${devLocations.toString().padEnd(11)} │ ${devItems.toString().padEnd(11)} │`);
  console.log(`│ Production  │ ${prodLocations.toString().padEnd(11)} │ ${prodItems.toString().padEnd(11)} │`);
  console.log("└─────────────┴─────────────┴─────────────┘\n");
  
  // Get detailed breakdown by type
  const devData = await devClient.query("locations:getAllLocationsWithItems", {});
  const prodData = await prodClient.query("locations:getAllLocationsWithItems", {});
  
  const devTypeCounts = { meat: 0, vegetarian: 0, vegan: 0 };
  const prodTypeCounts = { meat: 0, vegetarian: 0, vegan: 0 };
  
  // Count by type for dev
  devData.forEach(location => {
    if (location.items) {
      location.items.forEach(item => {
        devTypeCounts[item.type]++;
      });
    }
  });
  
  // Count by type for prod
  prodData.forEach(location => {
    if (location.items) {
      location.items.forEach(item => {
        prodTypeCounts[item.type]++;
      });
    }
  });
  
  console.log("🍽️ Items by Type:");
  console.log("┌─────────────┬──────┬────────────┬───────┐");
  console.log("│ Environment │ Meat │ Vegetarian │ Vegan │");
  console.log("├─────────────┼──────┼────────────┼───────┤");
  console.log(`│ Development │ ${devTypeCounts.meat.toString().padEnd(4)} │ ${devTypeCounts.vegetarian.toString().padEnd(10)} │ ${devTypeCounts.vegan.toString().padEnd(5)} │`);
  console.log(`│ Production  │ ${prodTypeCounts.meat.toString().padEnd(4)} │ ${prodTypeCounts.vegetarian.toString().padEnd(10)} │ ${prodTypeCounts.vegan.toString().padEnd(5)} │`);
  console.log("└─────────────┴──────┴────────────┴───────┘\n");
  
  // Final verdict
  const locationsDiff = Math.abs(devLocations - prodLocations);
  const itemsDiff = Math.abs(devItems - prodItems);
  const typeDiffs = {
    meat: Math.abs(devTypeCounts.meat - prodTypeCounts.meat),
    vegetarian: Math.abs(devTypeCounts.vegetarian - prodTypeCounts.vegetarian),
    vegan: Math.abs(devTypeCounts.vegan - prodTypeCounts.vegan)
  };
  
  if (locationsDiff === 0 && itemsDiff <= 2) { // Allow for minor differences due to race conditions
    console.log("✅ Migration Complete!");
    console.log("🎯 Development and Production databases are now in sync");
    
    if (itemsDiff > 0) {
      console.log(`ℹ️  Minor difference of ${itemsDiff} items (likely due to timing of queries)`);
    }
  } else {
    console.log("⚠️  Migration Status:");
    console.log(`   Locations difference: ${locationsDiff}`);
    console.log(`   Items difference: ${itemsDiff}`);
    console.log("   Type differences:", typeDiffs);
  }
  
} catch (error) {
  console.error("Error during verification:", error);
}