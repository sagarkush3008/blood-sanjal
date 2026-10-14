// Utilities for parsing, formatting, and guaranteeing clean human-readable Nepal location names (never coordinates)

export interface NepalHub {
  name: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export const NEPAL_MAJOR_HUBS: NepalHub[] = [
  // Kathmandu Valley
  { name: 'Maharajgunj, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7358, lng: 85.3308 },
  { name: 'Ratnapark, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7050, lng: 85.3140 },
  { name: 'Thamel, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7154, lng: 85.3123 },
  { name: 'New Baneshwor, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.6890, lng: 85.3420 },
  { name: 'Kalanki, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.6934, lng: 85.2815 },
  { name: 'Chabahil, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7174, lng: 85.3496 },
  { name: 'Koteshwor, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.6756, lng: 85.3484 },
  { name: 'Lagankhel, Lalitpur', city: 'Lalitpur', province: 'Bagmati', lat: 27.6685, lng: 85.3216 },
  { name: 'Jawalakhel, Lalitpur', city: 'Lalitpur', province: 'Bagmati', lat: 27.6740, lng: 85.3130 },
  { name: 'Pulchowk, Lalitpur', city: 'Lalitpur', province: 'Bagmati', lat: 27.6785, lng: 85.3170 },
  { name: 'Suryabinayak, Bhaktapur', city: 'Bhaktapur', province: 'Bagmati', lat: 27.6698, lng: 85.4243 },
  { name: 'Durbar Square, Bhaktapur', city: 'Bhaktapur', province: 'Bagmati', lat: 27.6722, lng: 85.4285 },

  // Gandaki
  { name: 'Lakeside, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2096, lng: 83.9595 },
  { name: 'Ramghat, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2144, lng: 83.9995 },
  { name: 'Prithvi Chowk, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2045, lng: 83.9875 },
  { name: 'Gorkha Bazaar, Gorkha', city: 'Gorkha', province: 'Gandaki', lat: 28.0050, lng: 84.6280 },

  // Bagmati / Narayani
  { name: 'Bharatpur, Chitwan', city: 'Bharatpur', province: 'Bagmati', lat: 27.6713, lng: 84.4361 },
  { name: 'Narayangarh, Chitwan', city: 'Bharatpur', province: 'Bagmati', lat: 27.6980, lng: 84.4280 },
  { name: 'Main Road, Hetauda', city: 'Hetauda', province: 'Bagmati', lat: 27.4280, lng: 85.0320 },

  // Koshi Province
  { name: 'Main Road, Biratnagar', city: 'Biratnagar', province: 'Koshi', lat: 26.4525, lng: 87.2718 },
  { name: 'BPKIHS, Dharan', city: 'Dharan', province: 'Koshi', lat: 26.8122, lng: 87.2835 },
  { name: 'Bhanuchowk, Dharan', city: 'Dharan', province: 'Koshi', lat: 26.8065, lng: 87.2810 },
  { name: 'Itahari Chowk, Sunsari', city: 'Itahari', province: 'Koshi', lat: 26.6630, lng: 87.2780 },
  { name: 'Damak, Jhapa', city: 'Damak', province: 'Koshi', lat: 26.6660, lng: 87.6920 },
  { name: 'Birtamode, Jhapa', city: 'Birtamode', province: 'Koshi', lat: 26.6340, lng: 87.9940 },

  // Lumbini
  { name: 'Traffic Chowk, Butwal', city: 'Butwal', province: 'Lumbini', lat: 27.7006, lng: 83.4484 },
  { name: 'Siddharthanagar, Bhairahawa', city: 'Bhairahawa', province: 'Lumbini', lat: 27.5050, lng: 83.4500 },
  { name: 'Tansen, Palpa', city: 'Tansen', province: 'Lumbini', lat: 27.8670, lng: 83.5460 },
  { name: 'Ghorahi, Dang', city: 'Ghorahi', province: 'Lumbini', lat: 28.0400, lng: 82.4900 },

  // Madhesh
  { name: 'Adarshanagar, Birgunj', city: 'Birgunj', province: 'Madhesh', lat: 27.0125, lng: 84.8770 },
  { name: 'Bhanuchowk, Janakpur', city: 'Janakpur', province: 'Madhesh', lat: 26.7280, lng: 85.9240 },
  { name: 'Lahan, Siraha', city: 'Lahan', province: 'Madhesh', lat: 26.7290, lng: 86.4830 },

  // Karnali & Sudurpashchim
  { name: 'Tribhuvan Chowk, Nepalgunj', city: 'Nepalgunj', province: 'Lumbini', lat: 28.0500, lng: 81.6160 },
  { name: 'Birendranagar, Surkhet', city: 'Surkhet', province: 'Karnali', lat: 28.6010, lng: 81.6330 },
  { name: 'Main Road, Dhangadhi', city: 'Dhangadhi', province: 'Sudurpashchim', lat: 28.6850, lng: 80.6010 },
  { name: 'Mahendranagar, Kanchanpur', city: 'Mahendranagar', province: 'Sudurpashchim', lat: 28.9600, lng: 80.1800 },
];

/**
 * Finds the nearest prominent hub in Nepal for a given coordinate pair
 */
export function getClosestNepalLocation(lat: number, lng: number): { name: string; city: string; address: string } {
  let closest = NEPAL_MAJOR_HUBS[0];
  let minDistanceSq = Number.MAX_VALUE;

  for (const hub of NEPAL_MAJOR_HUBS) {
    const dLat = hub.lat - lat;
    const dLng = hub.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = hub;
    }
  }

  // minDistance in approximate degrees: 0.05 deg is ~5km, 0.25 deg is ~25km
  const dist = Math.sqrt(minDistanceSq);
  if (dist < 0.08) {
    return {
      name: closest.name,
      city: closest.city,
      address: `${closest.name}, ${closest.province} Province, Nepal`,
    };
  } else if (dist < 0.4) {
    return {
      name: `${closest.city}, Nepal`,
      city: closest.city,
      address: `${closest.city}, ${closest.province} Province, Nepal`,
    };
  }

  return {
    name: `${closest.city}, Nepal`,
    city: closest.city,
    address: `${closest.province} Province, Nepal`,
  };
}

/**
 * Validates whether a string is coordinates or raw numbers instead of a legitimate place name
 */
export function isCoordinateString(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();

  // Pattern: "Location (27.7172, 85.3240)"
  if (/Location\s*\(/i.test(trimmed)) return true;

  // Pattern: "27.7172, 85.3240" or "27.7172° N, 85.3240° E"
  if (/^[\d\.\,\s\+\-°NESW\(\)]+$/.test(trimmed) && trimmed.length > 5) return true;

  // Contains numeric lat/lon pair
  if (/(\d{1,2}\.\d{3,})[\s,]+(\d{1,3}\.\d{3,})/.test(trimmed)) return true;

  return false;
}

/**
 * Cleans, parses, and normalizes a location name so it is 100% human-readable with ZERO coordinates.
 */
export function cleanLocationName(rawLocation?: string, provinceId?: string): string {
  if (!rawLocation || !rawLocation.trim()) {
    return 'Kathmandu';
  }

  let text = rawLocation.trim();

  // If the string contains coordinates, extract them and resolve to the nearest Nepal city
  const coordMatch = text.match(/(\d{1,2}\.\d{3,})[\s,]+(\d{1,3}\.\d{3,})/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return getClosestNepalLocation(lat, lng).name;
    }
  }

  // If it matches "Location (..." with anything inside
  if (/Location\s*\(/i.test(text)) {
    text = text.replace(/Location\s*\([^\)]*\)/gi, '').trim();
  }

  // If text became empty or only numbers/symbols
  if (!text || /^[\d\.\,\s\+\-°NESW\(\)]+$/.test(text)) {
    return provinceId ? `${provinceId}, Nepal` : 'Kathmandu';
  }

  // Fix common spelling variations
  text = text.replace(/Kathamdnu/gi, 'Kathmandu');

  // Strip trailing coordinates if appended like "Baneshwor (27.71, 85.32)"
  text = text.replace(/\s*\([\d\.\,\s\+\-°NESW]+\)$/gi, '').trim();

  return text;
}
