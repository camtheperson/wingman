import type { Id } from '../../convex/_generated/dataModel';

export type LocationItem = {
  _id: Id<'locationItems'>;
  locationId: Id<'locations'>;
  itemName: string;
  description?: string;
  type: 'meat' | 'vegetarian' | 'vegan';
  glutenFree: boolean;
  image?: string;
  averageRating?: number;
  ratingCount?: number;
  ratings?: Array<{ _id: Id<'itemRatings'>; [key: string]: unknown }>;
};

export type LocationHour = {
  _id: Id<'locationHours'>;
  locationId: Id<'locations'>;
  dayOfWeek: string;
  date: string;
  hours: string;
  fullDate: string;
};

export type LocationWithItems = {
  _id: Id<'locations'>;
  restaurantName: string;
  address: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  geocodedAddress?: string;
  geocodingMethod?: string;
  allowMinors: boolean;
  allowTakeout: boolean;
  allowDelivery: boolean;
  phone?: string;
  website?: string;
  items?: LocationItem[];
  hours?: LocationHour[];
  averageRating?: number;
  reviewCount?: number;
  isOpenNow?: boolean;
};

// JSON data type for immediate pins
export type JsonLocationPin = {
  restaurantName: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  address: string;
  glutenFree?: boolean;
  allowMinors?: boolean;
  allowTakeout?: boolean;
  allowDelivery?: boolean;
};