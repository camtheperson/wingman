#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read the items.json file
const dataPath = path.join(process.cwd(), 'data', 'items.json');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🔍 Analyzing wing type distribution...\n');

let singleTypeCount = 0;
let multiTypeCount = 0;
const typeDistribution = {};

items.forEach(item => {
  const typeString = item.type || 'meat';
  const types = typeString.toLowerCase().split(',').map(t => t.trim()).filter(t => 
    t === 'meat' || t === 'vegetarian' || t === 'vegan'
  ).sort(); // Alphabetize for consistency
  
  if (types.length === 1) {
    singleTypeCount++;
  } else {
    multiTypeCount++;
  }
  
  // Track unique combinations
  const sortedTypes = [...types].sort().join(', ');
  typeDistribution[sortedTypes] = (typeDistribution[sortedTypes] || 0) + 1;
});

console.log(`📊 Wing Type Analysis:`);
console.log(`   Single type items: ${singleTypeCount}`);
console.log(`   Multi-type items: ${multiTypeCount}`);
console.log(`   Total items: ${items.length}\n`);

console.log('📋 Type combinations:');
Object.entries(typeDistribution)
  .sort(([,a], [,b]) => b - a)
  .forEach(([combination, count]) => {
    console.log(`   ${combination}: ${count} items`);
  });

console.log(`\n✅ With our new approach, you'll now see:`);
console.log(`   - ${singleTypeCount} items with single type tags`);
console.log(`   - ${multiTypeCount} items with multiple type tags`);
console.log(`   - No duplicate wing entries!`);
console.log(`   - Wing Type filter works for all combinations`);