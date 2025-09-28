import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

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
        
        // Apply gluten-free filter to items
        const filteredItems = args.glutenFree 
          ? items.filter(item => item.glutenFree)
          : items;
        
        // Check if open now (simplified - you can enhance this logic)
        const isOpenNow = checkIfOpenNow(hours);
        
        if (args.isOpenNow && !isOpenNow) {
          return null;
        }
        
        return {
          ...location,
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
          ...item,
          averageRating,
          ratingCount: ratings.length,
          ratings,
        };
      })
    );
    
    return {
      ...location,
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

// Get user's favorites
export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    // Get full item details for each favorite
    const favoritesWithItems = await Promise.all(
      favorites.map(async (fav) => {
        const item = await ctx.db.get(fav.itemId);
        if (!item) return null;
        
        const location = await ctx.db.get(item.locationId);
        return {
          ...fav,
          item,
          location,
        };
      })
    );
    
    return favoritesWithItems.filter(Boolean);
  },
});

// Add to favorites
export const addToFavorites = mutation({
  args: { itemId: v.id("locationItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be logged in to add favorites");
    
    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .unique();
    
    if (existing) return existing._id;
    
    return await ctx.db.insert("favorites", {
      userId,
      itemId,
      createdAt: Date.now(),
    });
  },
});

// Remove from favorites
export const removeFromFavorites = mutation({
  args: { itemId: v.id("locationItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .unique();
    
    if (favorite) {
      await ctx.db.delete(favorite._id);
    }
  },
});

// Rate an item
export const rateItem = mutation({
  args: { 
    itemId: v.id("locationItems"), 
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, rating, review }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be logged in to rate items");
    
    // Validate rating (0-5 in 0.5 increments)
    if (rating < 0 || rating > 5 || (rating * 2) % 1 !== 0) {
      throw new Error("Rating must be between 0-5 in 0.5 increments");
    }
    
    // Check if user already rated this item
    const existing = await ctx.db
      .query("itemRatings")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .unique();
    
    if (existing) {
      // Update existing rating
      return await ctx.db.patch(existing._id, {
        rating,
        review,
        updatedAt: Date.now(),
      });
    } else {
      // Create new rating
      return await ctx.db.insert("itemRatings", {
        userId,
        itemId,
        rating,
        review,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get user's rating for an item
export const getUserRating = query({
  args: { itemId: v.id("locationItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("itemRatings")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .unique();
  },
});

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