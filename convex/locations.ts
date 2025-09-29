import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all locations with their items and ratings
export const getLocations = query({
  args: {
    neighborhood: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    glutenFree: v.optional(v.boolean()),
    allowMinors: v.optional(v.boolean()),
    allowTakeout: v.optional(v.boolean()),
    allowDelivery: v.optional(v.boolean()),
    isOpenNow: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("meat"), v.literal("vegetarian"), v.literal("vegan"))),
  },
  handler: async (ctx, args) => {
    let locations = await ctx.db.query("locations").collect();
    
    // Apply filters
    if (args.neighborhood) {
      locations = locations.filter(loc => loc.neighborhood === args.neighborhood);
    }
    
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      locations = locations.filter(loc => 
        loc.restaurantName.toLowerCase().includes(term) ||
        loc.neighborhood.toLowerCase().includes(term)
      );
    }
    
    if (args.allowMinors !== undefined) {
      locations = locations.filter(loc => loc.allowMinors === args.allowMinors);
    }
    
    if (args.allowTakeout !== undefined) {
      locations = locations.filter(loc => loc.allowTakeout === args.allowTakeout);
    }
    
    if (args.allowDelivery !== undefined) {
      locations = locations.filter(loc => loc.allowDelivery === args.allowDelivery);
    }
    
    // Get items for each location
    const locationsWithItems = await Promise.all(
      locations.map(async (location) => {
        const items = await ctx.db
          .query("locationItems")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        // Get hours for this location
        const hours = await ctx.db
          .query("locationHours")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        // Calculate average rating and review count for this location's items
        let totalRating = 0;
        let itemCount = 0;
        let totalReviews = 0;
        
        for (const item of items) {
          const ratings = await ctx.db
            .query("itemRatings")
            .withIndex("by_item_id", (q) => q.eq("itemId", item._id))
            .collect();
          
          if (ratings.length > 0) {
            const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            totalRating += avgRating;
            itemCount++;
            totalReviews += ratings.length;
          }
        }
        
        const averageRating = itemCount > 0 ? totalRating / itemCount : 0;
        const reviewCount = totalReviews;
        
        // Apply filters to items
        let filteredItems = items;
        
        if (args.glutenFree) {
          filteredItems = filteredItems.filter(item => item.glutenFree);
        }
        
        if (args.type) {
          filteredItems = filteredItems.filter(item => item.type === args.type);
        }
        
        // Check if open now (simplified - you can enhance this logic)
        const isOpenNow = checkIfOpenNow(hours as Array<{
          dayOfWeek: string;
          date: string;
          hours: string;
          fullDate: string;
        }>);
        
        if (args.isOpenNow && !isOpenNow) {
          return null;
        }
        
        // If filtering by type or glutenFree and no items match, exclude this location
        if ((args.type || args.glutenFree) && filteredItems.length === 0) {
          return null;
        }
        
        return {
          _id: location._id,
          restaurantName: location.restaurantName,
          address: location.address,
          neighborhood: location.neighborhood,
          latitude: location.latitude,
          longitude: location.longitude,
          geocodedAddress: location.geocodedAddress,
          geocodingMethod: location.geocodingMethod,
          allowMinors: location.allowMinors,
          allowTakeout: location.allowTakeout,
          allowDelivery: location.allowDelivery,
          phone: location.phone,
          website: location.website,
          items: filteredItems,
          hours,
          averageRating,
          reviewCount,
          isOpenNow,
        };
      })
    );
    
    return locationsWithItems.filter(Boolean);
  },
});

// Get a single location with full details
export const getLocationById = query({
  args: { id: v.id("locations") },
  handler: async (ctx, { id }) => {
    const location = await ctx.db.get(id);
    if (!location) return null;
    
    const items = await ctx.db
      .query("locationItems")
      .withIndex("by_location_id", (q) => q.eq("locationId", id))
      .collect();
    
    const hours = await ctx.db
      .query("locationHours")
      .withIndex("by_location_id", (q) => q.eq("locationId", id))
      .collect();
    
    // Get ratings for each item
    const itemsWithRatings = await Promise.all(
      items.map(async (item) => {
        const ratings = await ctx.db
          .query("itemRatings")
          .withIndex("by_item_id", (q) => q.eq("itemId", item._id))
          .collect();
        
        const averageRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;
        
        return {
          _id: item._id,
          locationId: item.locationId,
          itemName: item.itemName,
          description: item.description,
          type: item.type,
          glutenFree: item.glutenFree,
          image: item.image,
          averageRating,
          ratingCount: ratings.length,
          ratings,
        };
      })
    );
    
    return {
      _id: location._id,
      restaurantName: location.restaurantName,
      address: location.address,
      neighborhood: location.neighborhood,
      latitude: location.latitude,
      longitude: location.longitude,
      geocodedAddress: location.geocodedAddress,
      geocodingMethod: location.geocodingMethod,
      allowMinors: location.allowMinors,
      allowTakeout: location.allowTakeout,
      allowDelivery: location.allowDelivery,
      phone: location.phone,
      website: location.website,
      items: itemsWithRatings,
      hours,
    };
  },
});

// Get all neighborhoods for filtering
export const getNeighborhoods = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    const neighborhoods = [...new Set(locations.map(l => l.neighborhood))].sort();
    return neighborhoods;
  },
});

// Helper function to check if location is open now
function checkIfOpenNow(hours: Array<{
  dayOfWeek: string;
  date: string;
  hours: string;
  fullDate: string;
}>): boolean {
  if (!hours || hours.length === 0) return false;
  
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find today's hours
  const todayHours = hours.find(h => h.fullDate === currentDate);
  if (!todayHours) return false;
  
  // Parse hours string (simplified - you might need more robust parsing)
  const hoursString = todayHours.hours;
  if (hoursString.toLowerCase().includes('closed')) return false;
  
  // This is a simplified check - you'd want to implement proper time parsing
  return true;
}



// Get locations with items for scraping (includes items with URLs)
export const getLocationsForScraping = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    
    const locationsWithItems = await Promise.all(
      locations.map(async (location) => {
        const items = await ctx.db
          .query("locationItems")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        // Return items that have URLs (either need images or need path updates)
        const itemsWithUrls = items.filter(item => item.url);
        
        return {
          ...location,
          items: itemsWithUrls
        };
      })
    );
    
    // Only return locations that have items with URLs
    return locationsWithItems.filter(location => location.items && location.items.length > 0);
  },
});

// Update an item with image information
export const updateItemImage = mutation({
  args: {
    itemId: v.id("locationItems"),
    imageUrl: v.string(),
    imagePath: v.string()
  },
  handler: async (ctx, { itemId, imageUrl, imagePath }) => {
    await ctx.db.patch(itemId, {
      image: imagePath,
      imageUrl: imageUrl,
      updatedAt: Date.now()
    });
    
    return { success: true };
  },
});