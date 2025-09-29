import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const migrateWingData = mutation({
  args: {
    items: v.array(v.object({
      restaurantName: v.string(),
      neighborhood: v.string(),
      itemName: v.string(),
      url: v.optional(v.string()),
      description: v.optional(v.string()),
      altDescription: v.optional(v.string()),
      type: v.string(),
      glutenFree: v.boolean(),
      allowMinors: v.boolean(),
      allowTakeout: v.boolean(),
      purchaseLimits: v.boolean(),
      allowDelivery: v.boolean(),
      address: v.string(),
      hours: v.optional(v.array(v.object({
        dayOfWeek: v.string(),
        date: v.string(),
        hours: v.string(),
        fullDate: v.string(),
      }))),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      geocoded_address: v.optional(v.string()),
      geocoding_method: v.optional(v.string()),
    }))
  },
  handler: async (ctx, { items }) => {
    const locationMap = new Map();
    
    for (const item of items) {
      // Check if location already exists
      let location = locationMap.get(item.restaurantName);
      
      if (!location) {
        // Create new location
        const locationId = await ctx.db.insert("locations", {
          restaurantName: item.restaurantName,
          address: item.address,
          neighborhood: item.neighborhood,
          latitude: item.latitude,
          longitude: item.longitude,
          geocodedAddress: item.geocoded_address,
          geocodingMethod: item.geocoding_method,
          allowMinors: item.allowMinors,
          allowTakeout: item.allowTakeout,
          allowDelivery: item.allowDelivery,
          purchaseLimits: item.purchaseLimits,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        
        location = { _id: locationId };
        locationMap.set(item.restaurantName, location);
        
        // Add hours for this location
        if (item.hours && item.hours.length > 0) {
          for (const hour of item.hours) {
            await ctx.db.insert("locationHours", {
              locationId,
              dayOfWeek: hour.dayOfWeek,
              date: hour.date,
              hours: hour.hours,
              fullDate: hour.fullDate,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
      }
      
      // Create location items - handle multiple types if comma-separated
      const typeString = item.type || "meat";
      const types = typeString.split(',').map(t => t.trim().toLowerCase()).filter(t => 
        t === "meat" || t === "vegetarian" || t === "vegan"
      );
      
      // If no valid types found, default to meat
      if (types.length === 0) {
        types.push("meat");
      }
      
      // Create a separate item for each type (or just one if single type)
      for (const itemType of types) {
        await ctx.db.insert("locationItems", {
          locationId: location._id,
          itemName: item.itemName,
          description: item.description,
          altDescription: item.altDescription,
          type: itemType as "meat" | "vegetarian" | "vegan",
          glutenFree: item.glutenFree,
          url: item.url,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    
    return { success: true, processed: items.length };
  },
});

// Migrate only image data for existing items
export const migrateImagesOnly = mutation({
  args: {
    items: v.array(v.object({
      restaurantName: v.string(),
      itemName: v.string(),
      image: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
    }))
  },
  handler: async (ctx, { items }) => {
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const item of items) {
      // Skip items without image data
      if (!item.image && !item.imageUrl) {
        continue;
      }
      
      // Find the location by restaurant name
      const location = await ctx.db
        .query("locations")
        .filter((q) => q.eq(q.field("restaurantName"), item.restaurantName))
        .first();
      
      if (!location) {
        console.log(`Location not found: ${item.restaurantName}`);
        notFoundCount++;
        continue;
      }
      
      // Find the specific item within that location
      const locationItem = await ctx.db
        .query("locationItems")
        .filter((q) => 
          q.and(
            q.eq(q.field("locationId"), location._id),
            q.eq(q.field("itemName"), item.itemName)
          )
        )
        .first();
      
      if (!locationItem) {
        console.log(`Item not found: ${item.restaurantName} - ${item.itemName}`);
        notFoundCount++;
        continue;
      }
      
      // Update the item with image data
      await ctx.db.patch(locationItem._id, {
        image: item.image,
        imageUrl: item.imageUrl,
        updatedAt: Date.now(),
      });
      
      updatedCount++;
      console.log(`Updated: ${item.restaurantName} - ${item.itemName}`);
    }
    
    return { 
      success: true, 
      updated: updatedCount,
      notFound: notFoundCount,
      total: items.length
    };
  },
});