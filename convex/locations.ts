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
    favoritesOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()), // Add pagination
    offset: v.optional(v.number()),
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
    
    // Get user's favorites if filtering by favorites only
    let favoriteItemIds = new Set<string>();
    if (args.favoritesOnly) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const favorites = await ctx.db
          .query("favorites")
          .filter((q) => q.eq(q.field("userId"), identity.subject))
          .collect();
        favoriteItemIds = new Set(favorites.map(f => f.itemId));
      }
    }

    // Get ALL items and hours for ALL locations in batch
    const locationIds = locations.map(l => l._id);
    const allItems = await ctx.db.query("locationItems").collect();
    const allHours = await ctx.db.query("locationHours").collect();
    const allRatings = await ctx.db.query("itemRatings").collect();
    
    // Group data by location ID for efficient lookup
    const itemsByLocation = new Map<string, typeof allItems>();
    const hoursByLocation = new Map<string, typeof allHours>();
    const ratingsByItem = new Map<string, typeof allRatings>();
    
    allItems.forEach(item => {
      if (locationIds.includes(item.locationId)) {
        if (!itemsByLocation.has(item.locationId)) {
          itemsByLocation.set(item.locationId, []);
        }
        itemsByLocation.get(item.locationId)!.push(item);
      }
    });
    
    allHours.forEach(hour => {
      if (locationIds.includes(hour.locationId)) {
        if (!hoursByLocation.has(hour.locationId)) {
          hoursByLocation.set(hour.locationId, []);
        }
        hoursByLocation.get(hour.locationId)!.push(hour);
      }
    });
    
    allRatings.forEach(rating => {
      if (!ratingsByItem.has(rating.itemId)) {
        ratingsByItem.set(rating.itemId, []);
      }
      ratingsByItem.get(rating.itemId)!.push(rating);
    });

    // Process locations with pre-fetched data
    const locationsWithItems = locations.map((location) => {
      let items = itemsByLocation.get(location._id) || [];
      
      // Apply favorites filter first if needed
      if (args.favoritesOnly) {
        items = items.filter(item => favoriteItemIds.has(item._id));
      }
      
      // Get hours for this location
      const hours = hoursByLocation.get(location._id) || [];
      
      // Calculate average rating and review count using pre-fetched ratings
      let totalRating = 0;
      let itemCount = 0;
      let totalReviews = 0;
      
      for (const item of items) {
        const ratings = ratingsByItem.get(item._id) || [];
        
        if (ratings.length > 0) {
          const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
          totalRating += avgRating;
          itemCount++;
          totalReviews += ratings.length;
        }
      }
        
        const averageRating = itemCount > 0 ? totalRating / itemCount : 0;
        const reviewCount = totalReviews;
        
        // Apply additional filters to the already filtered items
        let filteredItems = items; // items already has favorites filter applied if needed
        
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
        
        // If filtering by type, glutenFree, or favorites and no items match, exclude this location
        if ((args.type || args.glutenFree || args.favoritesOnly) && filteredItems.length === 0) {
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
          purchaseLimits: location.purchaseLimits,
          phone: location.phone,
          website: location.website,
          items: filteredItems,
          hours,
          averageRating,
          reviewCount,
          isOpenNow,
        };
    });
    
    const filteredLocations = locationsWithItems.filter(Boolean);
    
    // Apply pagination if specified
    if (args.limit !== undefined) {
      const offset = args.offset || 0;
      return filteredLocations.slice(offset, offset + args.limit);
    }
    
    return filteredLocations;
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
    
    // Get ALL ratings in one query and group by item
    const allRatings = await ctx.db.query("itemRatings").collect();
    const ratingsByItem = new Map<string, typeof allRatings>();
    
    allRatings.forEach(rating => {
      const itemIds = items.map(item => item._id);
      if (itemIds.includes(rating.itemId)) {
        if (!ratingsByItem.has(rating.itemId)) {
          ratingsByItem.set(rating.itemId, []);
        }
        ratingsByItem.get(rating.itemId)!.push(rating);
      }
    });
    
    // Process items with pre-fetched ratings
    const itemsWithRatings = items.map((item) => {
      const ratings = ratingsByItem.get(item._id) || [];
      
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
          _id: item._id,
          locationId: item.locationId,
          itemName: item.itemName,
          description: item.description,
          altDescription: item.altDescription,
          type: item.type,
          glutenFree: item.glutenFree,
          image: item.image,
          averageRating,
          ratingCount: ratings.length,
          ratings,
        };
    });
    
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
      purchaseLimits: location.purchaseLimits,
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
  
  // Get current time in Pacific Time (Portland timezone)
  // UTC-8 (PST) or UTC-7 (PDT) - since it's September, it's still PDT (UTC-7)
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pacificOffset = -7; // PDT is UTC-7
  const pacificTime = new Date(utcTime + (pacificOffset * 3600000));
  const currentDate = pacificTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Find today's hours
  const todayHours = hours.find(h => h.fullDate === currentDate);
  if (!todayHours) return false;
  
  // Parse hours string (e.g., "12–10 pm", "11 am–11 pm", "Closed")
  const hoursStr = todayHours.hours;
  if (hoursStr.toLowerCase().includes('closed')) return false;
  
  try {
    // Extract start and end times - handle formats like "4–10 pm", "11 am–9 pm", "11:30 am–9 pm"
    let timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
    let match = hoursStr.match(timeRegex);
    let startHour, startMin, startAmPm, endHour, endMin, endAmPm;
    
    if (match) {
      [, startHour, startMin = '0', startAmPm, endHour, endMin = '0', endAmPm] = match;
    } else {
      // Try simplified format like "4–10 pm" or "12–8 pm" where start time inherits am/pm from end time
      timeRegex = /(\d{1,2})(?::(\d{2}))?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
      match = hoursStr.match(timeRegex);
      if (match) {
        [, startHour, startMin = '0', endHour, endMin = '0', endAmPm] = match;
        // For simplified format, assume start time is in same period as end time unless it's clearly different
        startAmPm = endAmPm;
      } else {
        return false;
      }
    }
    
    // Convert to 24-hour format
    let start24 = parseInt(startHour);
    let end24 = parseInt(endHour);
    
    if (startAmPm.toLowerCase() === 'pm' && start24 !== 12) start24 += 12;
    if (startAmPm.toLowerCase() === 'am' && start24 === 12) start24 = 0;
    if (endAmPm.toLowerCase() === 'pm' && end24 !== 12) end24 += 12;
    if (endAmPm.toLowerCase() === 'am' && end24 === 12) end24 = 0;
    
    const startTime = start24 * 60 + parseInt(startMin);
    const endTime = end24 * 60 + parseInt(endMin);
    const currentTime = pacificTime.getHours() * 60 + pacificTime.getMinutes();
    
    // Handle overnight hours (e.g., 11 PM - 2 AM)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  } catch {
    return false;
  }
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

// Get count of locations
export const count = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    return locations.length;
  },
});

// Get count of location items
export const countItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("locationItems").collect();
    return items.length;
  },
});

// OPTIMIZED: Lightweight query for map pins (no ratings or detailed items)
export const getLocationPins = query({
  args: {
    neighborhood: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    glutenFree: v.optional(v.boolean()),
    allowMinors: v.optional(v.boolean()),
    allowTakeout: v.optional(v.boolean()),
    allowDelivery: v.optional(v.boolean()),
    type: v.optional(v.union(v.literal("meat"), v.literal("vegetarian"), v.literal("vegan"))),
  },
  handler: async (ctx, args) => {
    let locations = await ctx.db.query("locations").collect();
    
    // Apply location-level filters
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
    
    // Only get items if we need to filter by item properties
    if (args.glutenFree || args.type) {
      const allItems = await ctx.db.query("locationItems").collect();
      const itemsByLocation = new Map<string, typeof allItems>();
      
      allItems.forEach(item => {
        if (!itemsByLocation.has(item.locationId)) {
          itemsByLocation.set(item.locationId, []);
        }
        itemsByLocation.get(item.locationId)!.push(item);
      });
      
      locations = locations.filter(location => {
        const items = itemsByLocation.get(location._id) || [];
        return items.some(item => {
          const matchesGlutenFree = !args.glutenFree || item.glutenFree;
          const matchesType = !args.type || item.type === args.type;
          return matchesGlutenFree && matchesType;
        });
      });
    }
    
    return locations
      .filter(loc => loc.latitude && loc.longitude)
      .map(loc => ({
        _id: loc._id,
        restaurantName: loc.restaurantName,
        neighborhood: loc.neighborhood,
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: loc.address,
      }));
  },
});

// Get all locations with their items for analysis
export const getAllLocationsWithItems = query({
  args: {},
  handler: async (ctx) => {
    const locations = await ctx.db.query("locations").collect();
    
    const locationsWithItems = await Promise.all(
      locations.map(async (location) => {
        const items = await ctx.db
          .query("locationItems")
          .withIndex("by_location_id", (q) => q.eq("locationId", location._id))
          .collect();
        
        return {
          ...location,
          items
        };
      })
    );
    
    return locationsWithItems;
  },
});