import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Get current user authentication status
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    
    // If no userId, user is not authenticated
    if (!userId) {
      return null;
    }
    
    // User is authenticated - return a simple user object
    // The presence of userId means they're logged in
    return {
      _id: userId,
      email: "user@authenticated.com", // Placeholder since we don't need actual email for UI
      name: "Authenticated User"
    };
  },
});



// Rate an item
export const rateItem = mutation({
  args: {
    itemId: v.id("locationItems"),
    rating: v.number(), // 0-5 in 0.5 increments
    review: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, rating, review }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    // Validate rating range
    if (rating < 0 || rating > 5 || (rating * 2) % 1 !== 0) {
      throw new Error("Rating must be between 0-5 in 0.5 increments");
    }
    
    // Check if user already rated this item
    const existingRating = await ctx.db
      .query("itemRatings")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();
    
    const now = Date.now();
    
    if (existingRating) {
      // Update existing rating
      return await ctx.db.patch(existingRating._id, {
        rating,
        review,
        updatedAt: now,
      });
    } else {
      // Create new rating
      return await ctx.db.insert("itemRatings", {
        userId,
        itemId,
        rating,
        review,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Toggle favorite status for an item
export const toggleFavorite = mutation({
  args: {
    itemId: v.id("locationItems"),
  },
  handler: async (ctx, { itemId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    // Check if item is already favorited
    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_item", (q) => q.eq("userId", userId).eq("itemId", itemId))
      .first();
    
    if (existingFavorite) {
      // Remove from favorites
      await ctx.db.delete(existingFavorite._id);
      return { isFavorite: false };
    } else {
      // Add to favorites
      await ctx.db.insert("favorites", {
        userId,
        itemId,
        createdAt: Date.now(),
      });
      return { isFavorite: true };
    }
  },
});

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
    
    return favorites.map(f => f.itemId);
  },
});

// Get user's ratings
export const getUserRatings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("itemRatings")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
  },
});