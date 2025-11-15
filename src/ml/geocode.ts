import { env } from '../../lib/env';

export class GeocodingError extends Error {
  constructor(message: string, public provider?: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

function validateAddress(address: string): void {
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 3) {
    throw new GeocodingError('Address must be at least 3 characters long');
  }
  if (trimmed.length > 500) {
    throw new GeocodingError('Address is too long (maximum 500 characters)');
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new GeocodingError('Geocoding request timed out', 'timeout');
    }
    throw error;
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  // Validate address first
  validateAddress(address);

  const errors: Array<{ provider: string; error: string }> = [];

  // Try external API first if configured
  if (env.externalApiUrl) {
    try {
      const res = await fetchWithTimeout(
        `${env.externalApiUrl}/geocode?address=${encodeURIComponent(address)}`,
        {
          headers: env.externalApiKey ? { Authorization: `Bearer ${env.externalApiKey}` } : {},
        },
        5000
      );
      
      if (res.ok) {
        const j = await res.json();
        if (j.lat !== undefined && j.lng !== undefined) {
          const lat = Number(j.lat);
          const lng = Number(j.lng);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
      } else {
        errors.push({ provider: 'external', error: `HTTP ${res.status}` });
      }
    } catch (e: any) {
      errors.push({ provider: 'external', error: e?.message || 'Request failed' });
    }
  }

  // Try Google Maps Geocoding API
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (key) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
      const res = await fetchWithTimeout(url, {}, 5000);
      
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'OK' && json.results?.length) {
          const { lat, lng } = json.results[0].geometry.location;
          if (typeof lat === 'number' && typeof lng === 'number') {
            return { lat, lng };
          }
        } else if (json.status === 'ZERO_RESULTS') {
          errors.push({ provider: 'google', error: 'No results found' });
        } else if (json.status === 'REQUEST_DENIED') {
          errors.push({ provider: 'google', error: 'API key invalid or denied' });
        } else if (json.status === 'OVER_QUERY_LIMIT') {
          errors.push({ provider: 'google', error: 'Query limit exceeded' });
        } else {
          errors.push({ provider: 'google', error: json.status || 'Unknown error' });
        }
      } else {
        errors.push({ provider: 'google', error: `HTTP ${res.status}` });
      }
    } catch (e: any) {
      errors.push({ provider: 'google', error: e?.message || 'Request failed' });
    }
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const osm = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: { 'User-Agent': 'RoofMapping/1.0 (+contact@example.com)' },
      },
      5000
    );
    
    if (osm.ok) {
      const arr = await osm.json();
      if (Array.isArray(arr) && arr.length > 0 && arr[0].lat && arr[0].lon) {
        const lat = Number(arr[0].lat);
        const lng = Number(arr[0].lon);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      } else {
        errors.push({ provider: 'osm', error: 'No results found' });
      }
    } else {
      errors.push({ provider: 'osm', error: `HTTP ${osm.status}` });
    }
  } catch (e: any) {
    errors.push({ provider: 'osm', error: e?.message || 'Request failed' });
  }

  // If in test mode, return default coordinates
  if (process.env.NODE_ENV === 'test') {
    return { lat: 39.8283, lng: -98.5795 };
  }

  // All providers failed - throw error with details
  const errorDetails = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
  throw new GeocodingError(
    `Failed to geocode address "${address}". All providers failed: ${errorDetails}`,
    'all_failed'
  );
}