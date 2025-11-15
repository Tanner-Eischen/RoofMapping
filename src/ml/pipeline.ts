import { fetchSentinel2 } from './imagery/sentinelHub';
import { fetchEsriTile, fetchEsriTileXY, fetchEsriExportCentered, fetchEsriExportForBBox, fetchEsriTileGrid } from './imagery/esri';
import { fetchUsgsLidar } from './lidar/usgs';
import { detectRoofPolygons, selectDetections } from './models/maskrcnn';
import { computeMeasurements } from './measurements/engine';
import { geocodeAddress } from './geocode';
import { env } from '../../lib/env';
import { geoRectPixels, polygonLatLngToTilePixels, polygonLatLngToExtentPixels, extentPixelsToPolygonLatLng } from './overlay/geo';
import { fetchBuildingBBox, fetchBuildingPolygon } from './overlay/osm';

export async function runPipeline(address: string) {
  const { lat, lng } = await geocodeAddress(address);
  let imagery;
  try {
    if (env.sentinelHubClientId && env.sentinelHubClientSecret) {
      imagery = await fetchSentinel2(lat, lng);
    } else {
      imagery = await fetchEsriTile(lat, lng, 19);
    }
  } catch {
    imagery = await fetchEsriTile(lat, lng, 18);
  }
  const lidar = await fetchUsgsLidar(lat, lng);
  let polys;
  if (typeof (imagery as any).tileX === 'number') {
    polys = [geoRectPixels(lat, lng, (imagery as any).zoom, (imagery as any).tileX, (imagery as any).tileY, (imagery as any).tileSize, 12)];
  } else {
    const dets = await detectRoofPolygons(imagery.id);
    polys = selectDetections(dets);
  }
  const bestScore = 0.8;
  const m = computeMeasurements(polys, imagery.resolutionM, { lidarPointDensity: lidar.pointDensity, detectionScore: bestScore });
  return { imagery, lidar, polygons: polys, measurements: m };
}

export async function runPipelineQuick(
  address: string, 
  manualCorners?: Array<[number, number]> | null,
  imageExtent?: { minX: number; minY: number; maxX: number; maxY: number } | null,
  tileSize?: number | null
) {
  // Geocode the address
  let { lat, lng } = await geocodeAddress(address);
  
  // Try to fetch building polygon from OSM for better centering and accurate shape
  let buildingPolygon: Array<{ lat: number; lng: number }> | null = null;
  let bbox: Array<{ lat: number; lng: number }> | null = null;
  let buildingBBox: Array<{ lat: number; lng: number }> | null = null;
  try {
    // Fetch the actual building polygon (supports L-shaped and complex buildings)
    buildingPolygon = await fetchBuildingPolygon(lat, lng);
    if (buildingPolygon && buildingPolygon.length >= 3) {
      // Store the actual polygon for overlay display
      buildingBBox = [...buildingPolygon];
      
      // Calculate bounding box from polygon for imagery fetching
      let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
      for (const p of buildingPolygon) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      }
      bbox = [
        { lat: minLat, lng: minLng },
        { lat: minLat, lng: maxLng },
        { lat: maxLat, lng: maxLng },
        { lat: maxLat, lng: minLng },
      ];
      
      // Calculate center of building polygon for better centering
      let cx = 0, cy = 0;
      for (const p of buildingPolygon) { 
        cx += p.lng; 
        cy += p.lat; 
      }
      cx /= buildingPolygon.length; 
      cy /= buildingPolygon.length;
      lat = cy; 
      lng = cx;
    }
  } catch (e) {
    // If building polygon fetch fails, continue with geocoded coordinates
    console.warn('Failed to fetch building polygon, using geocoded coordinates:', e);
  }

  let imagery: any;
  let poly: Array<[number, number]> = [];

  // If manual corners are provided, convert them to lat/lng and use them
  if (manualCorners && manualCorners.length >= 3 && imageExtent && tileSize) {
    // Convert manual corners (pixel coordinates) to lat/lng using provided extent
    const manualPolygon = extentPixelsToPolygonLatLng(manualCorners, imageExtent, tileSize);
    buildingPolygon = manualPolygon;
    buildingBBox = manualPolygon;
    
    // Calculate bbox from manual polygon for imagery fetching
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    for (const p of manualPolygon) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }
    bbox = [
      { lat: minLat, lng: minLng },
      { lat: minLat, lng: maxLng },
      { lat: maxLat, lng: maxLng },
      { lat: maxLat, lng: minLng },
    ];
    
    // Calculate center from manual polygon
    let cx = 0, cy = 0;
    for (const p of manualPolygon) {
      cx += p.lng;
      cy += p.lat;
    }
    cx /= manualPolygon.length;
    cy /= manualPolygon.length;
    lat = cy;
    lng = cx;
    
    // Fetch imagery using the bbox from manual polygon
    try {
      imagery = await fetchEsriExportForBBox(bbox, 1024, 0.08);
      // Convert the lat/lng polygon back to pixel coordinates in the new image
      // This ensures the overlay matches the new image extent
      poly = polygonLatLngToExtentPixels(buildingPolygon, (imagery as any).extent, imagery.tileSize);
    } catch (e) {
      console.warn('Failed to fetch Esri export for manual bbox, falling back:', e);
      // Fallback - will be handled below
      bbox = null;
      buildingPolygon = null;
    }
  } else if (bbox && bbox.length >= 4 && buildingPolygon) {
    // If we have building polygon from OSM, use export API for better quality and larger image
    try {
      // Use larger image size (1024px) for better roof detail when polygon is available
      imagery = await fetchEsriExportForBBox(bbox, 1024, 0.08);
      // Convert the actual building polygon (not just bbox) to pixel coordinates
      poly = polygonLatLngToExtentPixels(buildingPolygon, (imagery as any).extent, imagery.tileSize);
    } catch (e) {
      console.warn('Failed to fetch Esri export for bbox, falling back to tiles:', e);
      // Fallback to tile-based approach
      bbox = null;
      buildingPolygon = null;
    }
  }

  // If no bbox or bbox export failed, try export API centered on coordinates
  // This avoids tile boundary issues and ensures we get the full area
  if (!bbox || !imagery) {
    const zoomLevels = [20, 19, 18];
    let exportSuccess = false;
    
    // Try export API first (better than tiles - no boundary issues)
    for (const z of zoomLevels) {
      try {
        // Use export API with 512px size for good detail without being too large
        imagery = await fetchEsriExportCentered(lat, lng, z, 512);
        // Create a polygon for the center area (12 meter radius)
        const size = imagery.tileSize || 512;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 50; // pixels - approximate 12 meter radius at zoom 19-20
        poly = [
          [centerX - radius, centerY - radius],
          [centerX + radius, centerY - radius],
          [centerX + radius, centerY + radius],
          [centerX - radius, centerY + radius],
        ] as Array<[number, number]>;
        exportSuccess = true;
        break;
      } catch (e) {
        // Try next zoom level
        continue;
      }
    }
    
    // If export API failed, fall back to tile grid approach (3x3 tiles)
    if (!exportSuccess) {
      let zoom = zoomLevels[0];
      let tileFetchSuccess = false;

      for (const z of zoomLevels) {
        try {
          // Use tile grid (3x3) to ensure building is always included
          imagery = await fetchEsriTileGrid(lat, lng, z);
          zoom = z;
          tileFetchSuccess = true;
          break;
        } catch (e) {
          // Try next zoom level
          continue;
        }
      }

      // If all zoom levels failed, create placeholder
      if (!tileFetchSuccess) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><defs><pattern id='g' width='32' height='32' patternUnits='userSpaceOnUse'><path d='M32 0H0V32' fill='none' stroke='#ddd'/></pattern></defs><rect width='512' height='512' fill='url(#g)'/><text x='256' y='256' text-anchor='middle' fill='#999' font-family='sans-serif' font-size='16'>Satellite imagery unavailable</text></svg>`;
      imagery = { 
        id: `placeholder-${lat}-${lng}`, 
        url: 'data:image/svg+xml,' + encodeURIComponent(svg), 
        resolutionM: 1, 
        cloudCoverage: 0, 
        tileX: 0, 
        tileY: 0, 
        zoom: 18, 
        tileSize: 512 
      };
      }

      // Generate polygon for roof area (only for tile-based approach)
      const size = imagery.tileSize || 768; // 768 for 3x3 grid (256*3)
      const z = imagery.zoom || zoom;
      
      // For tile grid, adjust coordinates to account for grid offset
      // The center tile is at offset (256, 256) in the composite
      const gridOffsetX = (imagery as any).gridOffsetX || 256;
      const gridOffsetY = (imagery as any).gridOffsetY || 256;
      const centerTileX = (imagery as any).centerTileX || imagery.tileX;
      const centerTileY = (imagery as any).centerTileY || imagery.tileY;
      
      // Calculate polygon in center tile coordinates, then offset to composite coordinates
      const centerTilePoly = geoRectPixels(lat, lng, z, centerTileX, centerTileY, 256, 12);
      poly = centerTilePoly.map(([x, y]) => [x + gridOffsetX, y + gridOffsetY] as [number, number]);
      
      // No overflow check needed - 3x3 grid (768x768) should always contain the building
    }
  }

  // Ensure poly and imagery are always initialized (fallback for edge cases)
  if (poly.length === 0 || !imagery) {
    // Last resort: create a default polygon centered on the image
    const size = imagery?.tileSize || 512;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 50;
    poly = [
      [centerX - radius, centerY - radius],
      [centerX + radius, centerY - radius],
      [centerX + radius, centerY + radius],
      [centerX - radius, centerY + radius],
    ] as Array<[number, number]>;
    
    // If we still don't have imagery, create placeholder
    if (!imagery) {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><defs><pattern id='g' width='32' height='32' patternUnits='userSpaceOnUse'><path d='M32 0H0V32' fill='none' stroke='#ddd'/></pattern></defs><rect width='${size}' height='${size}' fill='url(#g)'/><text x='${size/2}' y='${size/2}' text-anchor='middle' fill='#999' font-family='sans-serif' font-size='16'>Satellite imagery unavailable</text></svg>`;
      imagery = { 
        id: `placeholder-${lat}-${lng}`, 
        url: 'data:image/svg+xml,' + encodeURIComponent(svg), 
        resolutionM: 1, 
        cloudCoverage: 0, 
        tileX: 0, 
        tileY: 0, 
        zoom: 18, 
        tileSize: size 
      };
    }
  }

  const polys = [poly];
  // No clamping: keep polygon pixels as-is; image is centered on roof
  const m = computeMeasurements(polys, imagery.resolutionM, { lidarPointDensity: 0, detectionScore: 0.5 });
  
  // If no building bbox was found, create a fallback bbox from geocoded center point
  // This provides a small bounding box around the center for display purposes
  if (!buildingBBox) {
    const fallbackSize = 0.0001; // Approximately 11 meters
    buildingBBox = [
      { lat: lat - fallbackSize, lng: lng - fallbackSize },
      { lat: lat - fallbackSize, lng: lng + fallbackSize },
      { lat: lat + fallbackSize, lng: lng + fallbackSize },
      { lat: lat + fallbackSize, lng: lng - fallbackSize },
    ];
  }
  
  return { 
    imagery, 
    lidar: { pointDensity: 0 }, 
    polygons: polys, 
    measurements: m,
    buildingBBox: buildingBBox
  };
}
