// Utilities for parsing, formatting, and guaranteeing clean human-readable Nepal location names (never coordinates)

export interface NepalHub {
  name: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export const NEPAL_MAJOR_HUBS: NepalHub[] = [
  // Kathmandu Valley - Central Hospitals & Hubs
  { name: 'TU Teaching Hospital, Maharajgunj', city: 'Kathmandu', province: 'Bagmati', lat: 27.7358, lng: 85.3308 },
  { name: 'Bir Hospital, Ratnapark', city: 'Kathmandu', province: 'Bagmati', lat: 27.7050, lng: 85.3140 },
  { name: 'Civil Service Hospital, New Baneshwor', city: 'Kathmandu', province: 'Bagmati', lat: 27.6890, lng: 85.3420 },
  { name: 'KMC Teaching Hospital, Sinamangal', city: 'Kathmandu', province: 'Bagmati', lat: 27.6961, lng: 85.3524 },
  { name: 'Gangalal Heart Center, Bansbari', city: 'Kathmandu', province: 'Bagmati', lat: 27.7478, lng: 85.3482 },
  { name: 'Kanti Children Hospital, Maharajgunj', city: 'Kathmandu', province: 'Bagmati', lat: 27.7375, lng: 85.3320 },
  { name: 'Thamel, Central Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7154, lng: 85.3123 },
  { name: 'Kalanki Chowk, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.6934, lng: 85.2815 },
  { name: 'Chabahil Chowk, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7174, lng: 85.3496 },
  { name: 'Bouddha Stupa, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7215, lng: 85.3620 },
  { name: 'Koteshwor Chowk, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.6756, lng: 85.3484 },
  { name: 'Swayambhu, Kathmandu', city: 'Kathmandu', province: 'Bagmati', lat: 27.7149, lng: 85.2904 },
  
  // Lalitpur
  { name: 'Patan Hospital, Lagankhel', city: 'Lalitpur', province: 'Bagmati', lat: 27.6685, lng: 85.3216 },
  { name: 'Nepal Mediciti Hospital, Bhaisepati', city: 'Lalitpur', province: 'Bagmati', lat: 27.6534, lng: 85.3045 },
  { name: 'Jawalakhel, Lalitpur', city: 'Lalitpur', province: 'Bagmati', lat: 27.6740, lng: 85.3130 },
  { name: 'Pulchowk Engineering Campus, Lalitpur', city: 'Lalitpur', province: 'Bagmati', lat: 27.6785, lng: 85.3170 },
  
  // Bhaktapur
  { name: 'Bhaktapur Cancer Hospital, Dudhpati', city: 'Bhaktapur', province: 'Bagmati', lat: 27.6720, lng: 85.4210 },
  { name: 'Suryabinayak, Bhaktapur', city: 'Bhaktapur', province: 'Bagmati', lat: 27.6698, lng: 85.4243 },
  { name: 'Durbar Square, Bhaktapur', city: 'Bhaktapur', province: 'Bagmati', lat: 27.6722, lng: 85.4285 },

  // Gandaki Province
  { name: 'Western Regional Hospital, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2144, lng: 83.9995 },
  { name: 'Manipal Teaching Hospital, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2415, lng: 83.9912 },
  { name: 'Lakeside, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2096, lng: 83.9595 },
  { name: 'Prithvi Chowk, Pokhara', city: 'Pokhara', province: 'Gandaki', lat: 28.2045, lng: 83.9875 },
  { name: 'Gorkha Hospital, Gorkha Bazaar', city: 'Gorkha', province: 'Gandaki', lat: 28.0050, lng: 84.6280 },

  // Bagmati / Narayani (Chitwan & Makwanpur)
  { name: 'Chitwan Medical College, Bharatpur', city: 'Bharatpur', province: 'Bagmati', lat: 27.6713, lng: 84.4361 },
  { name: 'Bharatpur Hospital, Chitwan', city: 'Bharatpur', province: 'Bagmati', lat: 27.6850, lng: 84.4320 },
  { name: 'Narayangarh Pulchowk, Chitwan', city: 'Bharatpur', province: 'Bagmati', lat: 27.6980, lng: 84.4280 },
  { name: 'Hetauda Hospital, Makwanpur', city: 'Hetauda', province: 'Bagmati', lat: 27.4280, lng: 85.0320 },

  // Koshi Province
  { name: 'Koshi Hospital, Biratnagar', city: 'Biratnagar', province: 'Koshi', lat: 26.4525, lng: 87.2718 },
  { name: 'Nobel Medical College, Biratnagar', city: 'Biratnagar', province: 'Koshi', lat: 26.4670, lng: 87.2910 },
  { name: 'BPKIHS Hospital, Dharan', city: 'Dharan', province: 'Koshi', lat: 26.8122, lng: 87.2835 },
  { name: 'Bhanuchowk, Dharan', city: 'Dharan', province: 'Koshi', lat: 26.8065, lng: 87.2810 },
  { name: 'Itahari Chowk, Sunsari', city: 'Itahari', province: 'Koshi', lat: 26.6630, lng: 87.2780 },
  { name: 'Damak Hospital, Jhapa', city: 'Damak', province: 'Koshi', lat: 26.6660, lng: 87.6920 },
  { name: 'Birtamode Chowk, Jhapa', city: 'Birtamode', province: 'Koshi', lat: 26.6340, lng: 87.9940 },

  // Lumbini Province
  { name: 'Lumbini Provincial Hospital, Butwal', city: 'Butwal', province: 'Lumbini', lat: 27.7006, lng: 83.4484 },
  { name: 'Universal College of Medical Sciences, Bhairahawa', city: 'Bhairahawa', province: 'Lumbini', lat: 27.5050, lng: 83.4500 },
  { name: 'Traffic Chowk, Butwal', city: 'Butwal', province: 'Lumbini', lat: 27.7015, lng: 83.4520 },
  { name: 'Tansen Mission Hospital, Palpa', city: 'Tansen', province: 'Lumbini', lat: 27.8670, lng: 83.5460 },
  { name: 'Ghorahi, Dang', city: 'Ghorahi', province: 'Lumbini', lat: 28.0400, lng: 82.4900 },
  { name: 'Tribhuvan Chowk, Nepalgunj', city: 'Nepalgunj', province: 'Lumbini', lat: 28.0500, lng: 81.6160 },
  { name: 'Nepalgunj Medical College, Kohalpur', city: 'Kohalpur', province: 'Lumbini', lat: 28.1880, lng: 81.6930 },

  // Madhesh Province
  { name: 'Narayani Hospital, Birgunj', city: 'Birgunj', province: 'Madhesh', lat: 27.0125, lng: 84.8770 },
  { name: 'National Medical College, Birgunj', city: 'Birgunj', province: 'Madhesh', lat: 27.0280, lng: 84.8980 },
  { name: 'Janakpur Provincial Hospital, Janakpur', city: 'Janakpur', province: 'Madhesh', lat: 26.7280, lng: 85.9240 },
  { name: 'Lahan Hospital, Siraha', city: 'Lahan', province: 'Madhesh', lat: 26.7290, lng: 86.4830 },

  // Karnali & Sudurpashchim Provinces
  { name: 'Karnali Provincial Hospital, Birendranagar', city: 'Surkhet', province: 'Karnali', lat: 28.6010, lng: 81.6330 },
  { name: 'Seti Provincial Hospital, Dhangadhi', city: 'Dhangadhi', province: 'Sudurpashchim', lat: 28.6850, lng: 80.6010 },
  { name: 'Mahakali Hospital, Mahendranagar', city: 'Mahendranagar', province: 'Sudurpashchim', lat: 28.9600, lng: 80.1800 },
];

/**
 * Finds the nearest prominent hub or hospital in Nepal for a given coordinate pair.
 * Automatically checks and corrects for swapped GeoJSON [lng, lat] coordinate pairs.
 */
export function getClosestNepalLocation(latInput: number, lngInput: number): { name: string; city: string; address: string } {
  let lat = latInput;
  let lng = lngInput;

  // Auto-correct if coordinates were passed in GeoJSON [lng, lat] order:
  // Nepal latitude is between 26°N and 31°N, and longitude is between 80°E and 89°E.
  if (latInput >= 80 && latInput <= 89 && lngInput >= 26 && lngInput <= 31) {
    lng = latInput;
    lat = lngInput;
  }

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

  // 0.05 deg is ~5km, 0.25 deg is ~25km
  const dist = Math.sqrt(minDistanceSq);
  if (dist < 0.08) {
    return {
      name: closest.name,
      city: closest.city,
      address: `${closest.name}, ${closest.province} Province, Nepal`,
    };
  } else if (dist < 0.45) {
    return {
      name: `${closest.name}`,
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
 * Validates whether a string contains coordinates, plus codes, or raw numbers instead of a legitimate place name.
 */
export function isCoordinateString(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();

  // Pattern: "Location (27.7172, 85.3240)" or "Location (..."
  if (/Location\s*\(/i.test(trimmed)) return true;

  // Pattern: MongoDB 24-char hex ObjectId (e.g., 64e83f... from database references)
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) return true;

  // Pattern: "27.7172, 85.3240" or "27.71, 85.32" or "27.7172° N, 85.3240° E"
  if (/^[\d\.\,\s\+\-°NESW\(\)\[\]]+$/.test(trimmed) && trimmed.length > 3) return true;

  // Plus Codes like "7MV7+8Q" or "7MV7+8Q, Kathmandu"
  if (/^[0-9A-Z]{4,8}\+[0-9A-Z]{2,4}/i.test(trimmed)) return true;

  // Contains any decimal coordinate pair (e.g., 27.7172 and 85.3240)
  if (/[+-]?\d{1,3}\.\d+[\s,;/:|°NESW]+[+-]?\d{1,3}\.\d+/i.test(trimmed)) return true;

  // "Lat: 27.7..., Lon: 85.3..."
  if (/(?:lat|latitude|lng|long|longitude)[\s:=]+[+-]?\d+/i.test(trimmed)) return true;

  return false;
}

/**
 * Cleans, parses, and normalizes a location name so it is 100% human-readable with ZERO raw coordinates.
 * If coordinates are detected, it resolves them to the nearest exact hospital or prominent landmark in Nepal.
 */
export function cleanLocationName(rawLocation?: string | null, provinceId?: string): string {
  if (!rawLocation || !rawLocation.trim()) {
    return 'Kathmandu';
  }

  let text = rawLocation.trim();

  // 1. If it's a raw database ID (e.g., 24-character hexadecimal ObjectId or UUID)
  if (/^[0-9a-fA-F]{20,}(?:,\s*.*)?$/i.test(text) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(text)) {
    if (provinceId && !/^[0-9a-fA-F]{20,}$/.test(provinceId.trim())) {
      return `${provinceId.trim()}, Nepal`;
    }
    return 'Kathmandu';
  }

  // 2. Check if the string contains decimal coordinates anywhere (e.g., "27.7172, 85.3240" or "Location (27.71, 85.32)")
  const numbers = text.match(/[+-]?\d{1,3}\.\d+/g);
  if (numbers && numbers.length >= 2) {
    const n1 = parseFloat(numbers[0]);
    const n2 = parseFloat(numbers[1]);

    if (!isNaN(n1) && !isNaN(n2)) {
      // Check if there is also a clean, legitimate hospital or city name attached
      let cleaned = text
        .replace(/Location\s*\([^\)]*\)/gi, '')
        .replace(/\s*\(?[+-]?\d{1,3}\.\d+[\s,;°NESW]+[+-]?\d{1,3}\.\d+.*?\)*/gi, '')
        .replace(/^[+-]?\d{1,3}\.\d+[\s,]+[+-]?\d{1,3}\.\d+[\s,:]*/gi, '')
        .trim();

      // If a legitimate human-readable place name remains after stripping coordinates (e.g., "Bir Hospital")
      if (cleaned.length > 2 && /[a-zA-Z]{3,}/.test(cleaned) && !isCoordinateString(cleaned)) {
        return cleaned.replace(/^,\s*|,\s*$/g, '');
      }

      // Otherwise resolve the coordinate numbers directly to the nearest Nepal hub/landmark
      return getClosestNepalLocation(n1, n2).name;
    }
  }

  // 3. Strip any "Location (...)" wrappers
  if (/Location\s*\(/i.test(text)) {
    text = text.replace(/Location\s*\([^\)]*\)/gi, '').trim();
  }

  // 4. Strip trailing coordinate annotations like "Maharajgunj (27.73, 85.33)"
  text = text.replace(/\s*\([\d\.\,\s\+\-°NESW]+\)$/gi, '').trim();

  // 5. If text became empty, only numbers, or only symbols
  if (!text || /^[\d\.\,\s\+\-°NESW\(\)\[\]]+$/.test(text)) {
    return provinceId ? `${provinceId}, Nepal` : 'Kathmandu';
  }

  // 6. Fix common typos
  text = text.replace(/Kathamdnu/gi, 'Kathmandu');

  return text;
}
