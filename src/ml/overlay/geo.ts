function metersToDegLat(meters: number) {
  return meters / 111320;
}

function metersToDegLng(meters: number, lat: number) {
  return meters / (111320 * Math.cos((lat * Math.PI) / 180));
}

function lngLatToTileFloat(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function lngLatToPixelInTile(lng: number, lat: number, z: number, tileX: number, tileY: number, tileSize: number) {
  const { x, y } = lngLatToTileFloat(lng, lat, z);
  const px = Math.round((x - tileX) * tileSize);
  const py = Math.round((y - tileY) * tileSize);
  return { px, py };
}

export function geoRectPixels(
  centerLat: number,
  centerLng: number,
  zoom: number,
  tileX: number,
  tileY: number,
  tileSize: number,
  halfSizeMeters: number
): Array<[number, number]> {
  const dLat = metersToDegLat(halfSizeMeters);
  const dLng = metersToDegLng(halfSizeMeters, centerLat);
  const corners = [
    { lat: centerLat - dLat, lng: centerLng - dLng },
    { lat: centerLat - dLat, lng: centerLng + dLng },
    { lat: centerLat + dLat, lng: centerLng + dLng },
    { lat: centerLat + dLat, lng: centerLng - dLng },
  ];
  return corners.map(({ lat, lng }) => {
    const { px, py } = lngLatToPixelInTile(lng, lat, zoom, tileX, tileY, tileSize);
    return [px, py];
  });
}

export function polygonLatLngToTilePixels(
  points: Array<{ lat: number; lng: number }>,
  zoom: number,
  tileX: number,
  tileY: number,
  tileSize: number
): Array<[number, number]> {
  return points.map(({ lat, lng }) => {
    const { px, py } = lngLatToPixelInTile(lng, lat, zoom, tileX, tileY, tileSize);
    return [px, py];
  });
}

function lngLatToWebMercator(lng: number, lat: number) {
  const R = 6378137;
  const x = (lng * Math.PI / 180) * R;
  const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * R;
  return { x, y };
}

export function polygonLatLngToExtentPixels(
  points: Array<{ lat: number; lng: number }>,
  extent: { minX: number; minY: number; maxX: number; maxY: number },
  size: number
): Array<[number, number]> {
  const w = extent.maxX - extent.minX;
  const h = extent.maxY - extent.minY;
  return points.map(({ lat, lng }) => {
    const m = lngLatToWebMercator(lng, lat);
    const fx = (m.x - extent.minX) / w;
    const fy = (extent.maxY - m.y) / h;
    const px = Math.round(fx * size);
    const py = Math.round(fy * size);
    return [px, py];
  });
}

function webMercatorToLngLat(x: number, y: number) {
  const R = 6378137;
  const lng = (x / R) * 180 / Math.PI;
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI;
  return { lng, lat };
}

/**
 * Converts pixel coordinates back to lat/lng using image extent
 * This is the reverse of polygonLatLngToExtentPixels
 */
export function extentPixelsToPolygonLatLng(
  pixels: Array<[number, number]>,
  extent: { minX: number; minY: number; maxX: number; maxY: number },
  size: number
): Array<{ lat: number; lng: number }> {
  const w = extent.maxX - extent.minX;
  const h = extent.maxY - extent.minY;
  return pixels.map(([px, py]) => {
    // Convert pixel to normalized coordinates (0-1)
    const fx = px / size;
    const fy = py / size;
    
    // Convert normalized to Web Mercator
    const mercatorX = extent.minX + fx * w;
    const mercatorY = extent.maxY - fy * h; // Note: Y is inverted
    
    // Convert Web Mercator to lat/lng
    const { lat, lng } = webMercatorToLngLat(mercatorX, mercatorY);
    return { lat, lng };
  });
}
