#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get both dev and prod URLs
const devConvexUrl = process.env.VITE_CONVEX_URL; // Should be dev deployment
const prodConvexUrl = "https://bold-puffin-534.convex.cloud";

console.log("📊 Checking database counts...\n");

let devLocations = 0;
let devLocationItems = 0;
let prodLocations = 0;
let prodLocationItems = 0;

// Check dev environment
console.log("🔧 Development Environment:");
console.log(`URL: ${devConvexUrl}`);
const devClient = new ConvexHttpClient(devConvexUrl);

try {
  devLocations = await devClient.query("locations:count", {});
  devLocationItems = await devClient.query("locations:countItems", {});
  console.log(`📍 Locations: ${devLocations}`);
  console.log(`🍗 Location Items: ${devLocationItems}\n`);
} catch (error) {
  console.error("Error querying dev environment:", error);
}

// Check prod environment
console.log("🚀 Production Environment:");
console.log(`URL: ${prodConvexUrl}`);
const prodClient = new ConvexHttpClient(prodConvexUrl);

try {
  prodLocations = await prodClient.query("locations:count", {});
  prodLocationItems = await prodClient.query("locations:countItems", {});
  console.log(`📍 Locations: ${prodLocations}`);
  console.log(`🍗 Location Items: ${prodLocationItems}\n`);
} catch (error) {
  console.error("Error querying prod environment:", error);
}

// Show comparison
console.log("📊 Comparison:");
console.log(`Location Items Difference: ${devLocationItems - prodLocationItems}`);

if (devLocationItems === prodLocationItems) {
  console.log("✅ Counts match! Migration was successful.");
} else {
  console.log(`⚠️  Counts still differ. Dev has ${devLocationItems - prodLocationItems} more items than prod.`);
}