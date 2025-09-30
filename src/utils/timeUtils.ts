// Time utility functions for client-side use (adapted from Convex timeUtils)

export interface LocationHours {
  dayOfWeek: string;
  date: string;
  hours: string;
  fullDate: string;
}

// Helper function to check if location is open now
export function checkIfOpenNow(hours: Array<LocationHours>): boolean {
  if (!hours || hours.length === 0) return false;

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
  const todayDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Find today's hours
  const todaysHours = hours.find(hour => 
    hour.dayOfWeek === currentDay || 
    hour.date === todayDate
  );

  if (!todaysHours) return false;

  // Parse hours like "12–10 pm" or "11:30 am–9 pm"
  const hoursText = todaysHours.hours.toLowerCase();
  
  // Check for "closed"
  if (hoursText.includes('closed')) return false;

  try {
    // Extract open and close times
    const timeRange = hoursText.split('–');
    if (timeRange.length !== 2) return false;

    const openTime = parseTime(timeRange[0].trim());
    const closeTime = parseTime(timeRange[1].trim());
    
    if (!openTime || !closeTime) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Handle times that cross midnight
    if (closeTime < openTime) {
      return currentMinutes >= openTime || currentMinutes <= closeTime;
    } else {
      return currentMinutes >= openTime && currentMinutes <= closeTime;
    }
  } catch (error) {
    console.warn('Error parsing hours:', hoursText, error);
    return false;
  }
}

// Parse time string like "12 pm" or "11:30 am" to minutes since midnight
function parseTime(timeStr: string): number | null {
  try {
    const match = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '0', 10);
    const period = match[3].toLowerCase();

    // Convert to 24-hour format
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  } catch {
    return null;
  }
}