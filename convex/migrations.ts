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
      
      // Create location item
      const itemType = item.type === "meat" ? "meat" : 
                      item.type === "vegetarian" ? "vegetarian" : 
                      item.type === "vegan" ? "vegan" : "meat";
      
      await ctx.db.insert("locationItems", {
        locationId: location._id,
        itemName: item.itemName,
        description: item.description,
        altDescription: item.altDescription,
        type: itemType,
        glutenFree: item.glutenFree,
        url: item.url,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true, processed: items.length };
  },
});