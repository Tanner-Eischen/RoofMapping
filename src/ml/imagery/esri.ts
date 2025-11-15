export type EsriImage = {
  id: string;
  url: string;
  resolutionM: number;
  cloudCoverage: number;
  tileX: number;
  tileY: number;
  zoom: number;
  tileSize: number;
};

export class EsriFetchError extends Error {
  constructor(message: string, public url?: string, public statusCode?: number) {
    super(message);
    this.name = 'EsriFetchError';
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 500
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new EsriFetchError(
            `HTTP ${response.status}: ${response.statusText}`,
            url,
            response.status
          );
        }
        
        // Verify it's actually an image by checking content type
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          throw new EsriFetchError(
            `Unexpected content type: ${contentType}`,
            url,
            response.status
          );
        }
        
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new EsriFetchError('Request timed out', url);
        }
        throw error;
      }
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof EsriFetchError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  throw lastError || new EsriFetchError('Failed to fetch after retries', url);
}

function lngLatToTile(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function groundResolution(lat: number, z: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / (2 ** z);
}

export async function fetchEsriTile(lat: number, lng: number, zoom: number): Promise<EsriImage> {
  // Validate inputs
  if (zoom < 0 || zoom > 23) {
    throw new EsriFetchError(`Invalid zoom level: ${zoom}. Must be between 0 and 23.`);
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new EsriFetchError(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }

  const { x, y } = lngLatToTile(lng, lat, zoom);
  const tileSize = 256;
  const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  
  // Verify the tile URL is accessible (with retry)
  try {
    await fetchWithRetry(url, { method: 'HEAD' }, 2); // Use HEAD request for validation, fewer retries
  } catch (error: any) {
    // If HEAD fails, still return the URL but log a warning
    console.warn('Esri tile validation failed, but URL will be returned:', error?.message);
  }
  
  return {
    id: `esri-${zoom}-${x}-${y}`,
    url,
    resolutionM: groundResolution(lat, zoom),
    cloudCoverage: 0,
    tileX: x,
    tileY: y,
    zoom,
    tileSize,
  };
}

export async function fetchEsriTileXY(lat: number, zoom: number, x: number, y: number): Promise<EsriImage> {
  // Validate inputs
  if (zoom < 0 || zoom > 23) {
    throw new EsriFetchError(`Invalid zoom level: ${zoom}. Must be between 0 and 23.`);
  }
  if (lat < -90 || lat > 90) {
    throw new EsriFetchError(`Invalid latitude: ${lat}`);
  }

  const tileSize = 256;
  const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
  
  // Verify the tile URL is accessible (with retry)
  try {
    await fetchWithRetry(url, { method: 'HEAD' }, 2);
  } catch (error: any) {
    console.warn('Esri tile validation failed, but URL will be returned:', error?.message);
  }
  
  return {
    id: `esri-${zoom}-${x}-${y}`,
    url,
    resolutionM: groundResolution(lat, zoom),
    cloudCoverage: 0,
    tileX: x,
    tileY: y,
    zoom,
    tileSize,
  };
}

export async function fetchEsriTileGrid(
  centerLat: number,
  centerLng: number,
  zoom: number
): Promise<EsriImage & { centerTileX: number; centerTileY: number; gridOffsetX: number; gridOffsetY: number; tileUrls: Array<Array<string>> }> {
  // Get the center tile coordinates
  const centerTile = lngLatToTile(centerLng, centerLat, zoom);
  const centerX = centerTile.x;
  const centerY = centerTile.y;
  
  // Calculate the 3x3 grid: tiles from (centerX-1, centerY-1) to (centerX+1, centerY+1)
  const tileSize = 256;
  const gridSize = 3;
  const compositeSize = tileSize * gridSize; // 768x768
  
  // Build tile URLs for the 3x3 grid (row-major order: [y][x])
  const tileUrls: Array<Array<string>> = [];
  
  for (let dy = -1; dy <= 1; dy++) {
    const row: Array<string> = [];
    for (let dx = -1; dx <= 1; dx++) {
      const tx = centerX + dx;
      const ty = centerY + dy;
      const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
      row.push(url);
    }
    tileUrls.push(row);
  }
  
  // Return a special marker URL that indicates this is a tile grid
  // The client will composite the tiles using Canvas API
  // Format: tile-grid:centerX,centerY,zoom
  const compositeUrl = `tile-grid:${centerX},${centerY},${zoom}`;
  
  // Calculate the offset of the center tile within the composite
  const gridOffsetX = tileSize; // Center tile is at position (1,1) in 3x3 grid
  const gridOffsetY = tileSize;
  
  return {
    id: `esri-grid-${zoom}-${centerX}-${centerY}`,
    url: compositeUrl,
    resolutionM: groundResolution(centerLat, zoom),
    cloudCoverage: 0,
    tileX: centerX,
    tileY: centerY,
    zoom,
    tileSize: compositeSize, // Return composite size (768x768)
    centerTileX: centerX,
    centerTileY: centerY,
    gridOffsetX,
    gridOffsetY,
    tileUrls, // Return tile URLs for client-side composition
  };
}

function lngLatToWebMercator(lng: number, lat: number) {
  const R = 6378137;
  const x = (lng * Math.PI / 180) * R;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * R;
  return { x, y };
}

function exportExtentMeters(lat: number, lng: number, zoom: number, size: number) {
  const res = 156543.03392 / (2 ** zoom);
  const half = (res * size) / 2;
  const c = lngLatToWebMercator(lng, lat);
  return { minX: c.x - half, minY: c.y - half, maxX: c.x + half, maxY: c.y + half };
}

export async function fetchEsriExportCentered(lat: number, lng: number, zoom: number, size = 256): Promise<EsriImage & { extent: { minX: number; minY: number; maxX: number; maxY: number } }> {
  // Validate inputs
  if (zoom < 0 || zoom > 23) {
    throw new EsriFetchError(`Invalid zoom level: ${zoom}. Must be between 0 and 23.`);
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new EsriFetchError(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }
  if (size < 64 || size > 2048) {
    throw new EsriFetchError(`Invalid size: ${size}. Must be between 64 and 2048.`);
  }

  const { minX, minY, maxX, maxY } = exportExtentMeters(lat, lng, zoom, size);
  const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${minX},${minY},${maxX},${maxY}&bboxSR=102100&imageSR=102100&size=${size},${size}&format=png&f=image`;
  
  // Verify the export URL is accessible (with retry)
  // If validation fails, throw an error so the pipeline can fall back to tiles
  try {
    await fetchWithRetry(url, { method: 'HEAD' }, 2);
  } catch (error: any) {
    // Throw error so pipeline can fall back to tile grid
    throw new EsriFetchError(
      `Esri export validation failed: ${error?.message || 'Unknown error'}`,
      url,
      error?.statusCode
    );
  }
  
  return {
    id: `esri-export-${zoom}-${lat.toFixed(6)}-${lng.toFixed(6)}`,
    url,
    resolutionM: groundResolution(lat, zoom),
    cloudCoverage: 0,
    tileX: 0,
    tileY: 0,
    zoom,
    tileSize: size,
    extent: { minX, minY, maxX, maxY },
  };
}

export async function fetchEsriExportForBBox(
  points: Array<{ lat: number; lng: number }>,
  size = 512,
  paddingRatio = 0.15
): Promise<EsriImage & { extent: { minX: number; minY: number; maxX: number; maxY: number } }> {
  // Validate inputs
  if (!Array.isArray(points) || points.length < 3) {
    throw new EsriFetchError(`Invalid points array: must have at least 3 points, got ${points?.length || 0}`);
  }
  if (size < 64 || size > 2048) {
    throw new EsriFetchError(`Invalid size: ${size}. Must be between 64 and 2048.`);
  }
  if (paddingRatio < 0 || paddingRatio > 1) {
    throw new EsriFetchError(`Invalid paddingRatio: ${paddingRatio}. Must be between 0 and 1.`);
  }

  // Validate all points have valid coordinates
  for (const p of points) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number' ||
        p.lat < -90 || p.lat > 90 || p.lng < -180 || p.lng > 180) {
      throw new EsriFetchError(`Invalid point coordinates: lat=${p.lat}, lng=${p.lng}`);
    }
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cLat = 0, cLng = 0;
  for (const p of points) { 
    cLat += p.lat; 
    cLng += p.lng; 
  }
  cLat /= points.length; 
  cLng /= points.length;
  
  for (const { lat, lng } of points) {
    const m = lngLatToWebMercator(lng, lat);
    if (m.x < minX) minX = m.x;
    if (m.y < minY) minY = m.y;
    if (m.x > maxX) maxX = m.x;
    if (m.y > maxY) maxY = m.y;
  }
  
  const w = maxX - minX;
  const h = maxY - minY;
  const side = Math.max(w, h) * (1 + paddingRatio);
  const center = lngLatToWebMercator(cLng, cLat);
  const half = side / 2;
  const ex = { 
    minX: center.x - half, 
    minY: center.y - half, 
    maxX: center.x + half, 
    maxY: center.y + half 
  };
  
  const url = `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${ex.minX},${ex.minY},${ex.maxX},${ex.maxY}&bboxSR=102100&imageSR=102100&size=${size},${size}&format=png&f=image`;
  const resolutionM = side / size;
  
  // Verify the export URL is accessible (with retry)
  // If validation fails, throw an error so the pipeline can fall back to tiles
  try {
    await fetchWithRetry(url, { method: 'HEAD' }, 2);
  } catch (error: any) {
    // Throw error so pipeline can fall back to tile grid
    throw new EsriFetchError(
      `Esri export validation failed: ${error?.message || 'Unknown error'}`,
      url,
      error?.statusCode
    );
  }
  
  return {
    id: `esri-bbox-${cLat.toFixed(6)}-${cLng.toFixed(6)}-${size}`,
    url,
    resolutionM,
    cloudCoverage: 0,
    tileX: 0,
    tileY: 0,
    zoom: 0,
    tileSize: size,
    extent: ex,
  };
}