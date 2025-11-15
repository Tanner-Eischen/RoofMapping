/**
 * Fetches the actual building polygon from OSM (not just bounding box)
 * Returns the full polygon coordinates for L-shaped and complex buildings
 */
export async function fetchBuildingPolygon(lat: number, lng: number): Promise<Array<{ lat: number; lng: number }> | null> {
  // Query for both ways and relations (multipolygons) to catch complex buildings
  // Relations are often used for L-shaped or complex buildings
  const url = `https://overpass-api.de/api/interpreter?data=[out:json];(way(around:100,${lat},${lng})[building];relation(around:100,${lat},${lng})[building];);out geom;`;
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 3000); // Increased timeout for relations
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const j = await res.json();
    const els = Array.isArray(j?.elements) ? j.elements : [];
    if (!els.length) return null;
    
    // Prefer ways over relations (simpler), but relations might have more detail
    // Sort by type: ways first, then relations
    els.sort((a: any, b: any) => {
      if (a.type === 'way' && b.type === 'relation') return -1;
      if (a.type === 'relation' && b.type === 'way') return 1;
      return 0;
    });
    
    let best: any = null;
    let bestDist = Infinity;
    for (const e of els) {
      // For relations, we need to get the outer way's geometry
      let geom: any[] | null = null;
      
      if (e.type === 'way') {
        geom = (e as any).geom || (e as any).geometry;
      } else if (e.type === 'relation') {
        // For relations, find the outer member way
        // This is simplified - full multipolygon handling would be more complex
        const members = (e as any).members || [];
        const outerWay = members.find((m: any) => m.role === 'outer' && m.type === 'way');
        if (outerWay && outerWay.geometry) {
          geom = outerWay.geometry;
        }
      }
      
      if (!Array.isArray(geom) || geom.length < 3) continue;
      let cx = 0, cy = 0;
      for (const g of geom) { cx += Number(g.lon); cy += Number(g.lat); }
      cx /= geom.length; cy /= geom.length;
      const d = Math.hypot(cx - lng, cy - lat);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    if (!best) return null;
    
    // Extract geometry based on type
    let geom: any[] | null = null;
    if (best.type === 'way') {
      geom = (best as any).geom || (best as any).geometry;
    } else if (best.type === 'relation') {
      const members = (best as any).members || [];
      const outerWay = members.find((m: any) => m.role === 'outer' && m.type === 'way');
      if (outerWay && outerWay.geometry) {
        geom = outerWay.geometry;
      }
    }
    
    if (!Array.isArray(geom) || geom.length < 3) return null;
    
    // Convert geometry to polygon coordinates
    const polygon = geom.map((g: any) => ({
      lat: Number(g.lat),
      lng: Number(g.lon)
    }));
    
    // OSM ways are typically closed (first point = last point)
    // Remove duplicate last point if it matches the first
    if (polygon.length > 3 && 
        Math.abs(polygon[0].lat - polygon[polygon.length - 1].lat) < 0.000001 &&
        Math.abs(polygon[0].lng - polygon[polygon.length - 1].lng) < 0.000001) {
      polygon.pop(); // Remove duplicate last point
    }
    
    // Log polygon info for debugging
    console.log(`OSM building polygon: ${polygon.length} points`);
    if (polygon.length === 4) {
      console.warn('OSM returned only 4 points - building might be a simple rectangle in OSM data');
      console.log('Polygon coordinates:', polygon.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(' -> '));
    } else {
      console.log('Complex building shape detected with', polygon.length, 'corners');
    }
    
    return polygon;
  } catch {
    clearTimeout(to);
    return null;
  }
}

/**
 * Fetches building bounding box (backward compatibility)
 * Now uses the polygon and calculates bbox from it
 */
export async function fetchBuildingBBox(lat: number, lng: number): Promise<Array<{ lat: number; lng: number }> | null> {
  const polygon = await fetchBuildingPolygon(lat, lng);
  if (!polygon || polygon.length < 3) return null;
  
  // Calculate bounding box from polygon
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
  for (const p of polygon) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return [
    { lat: minLat, lng: minLng },
    { lat: minLat, lng: maxLng },
    { lat: maxLat, lng: maxLng },
    { lat: maxLat, lng: minLng },
  ];
}
