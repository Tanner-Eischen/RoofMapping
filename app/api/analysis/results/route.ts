import { NextResponse } from 'next/server';
import { getResults } from '../../../../src/services/analysisService';
import { runPipelineQuick } from '../../../../src/ml/pipeline';
import { proxyRequest } from '../../../../lib/http';
import { env } from '../../../../lib/env';

function validateAddress(address: string): { valid: boolean; error?: string } {
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 3) {
    return { valid: false, error: 'Address must be at least 3 characters long' };
  }
  if (trimmed.length > 500) {
    return { valid: false, error: 'Address is too long (maximum 500 characters)' };
  }
  return { valid: true };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').toString();
  const address = (searchParams.get('address') || '').toString().trim();
  const manualCornersParam = searchParams.get('manualCorners');
  const imageExtentParam = searchParams.get('imageExtent');
  const tileSizeParam = searchParams.get('tileSize');

  // Validate address if provided
  if (address) {
    const validation = validateAddress(address);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'invalid_address', 
          message: validation.error || 'Invalid address format',
          analysis: { id: `addr:${address}`, address }
        },
        { status: 400 }
      );
    }
  }

  if (!id && !address) {
    return NextResponse.json(
      { 
        error: 'id_or_address_required', 
        message: 'Either an analysis ID or address must be provided' 
      },
      { status: 400 }
    );
  }

  // Try external API if configured
  if (env.externalApiUrl && id) {
    try {
      const res = await proxyRequest(`/analysis/results?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const payload = (res as any).json || {};
        let addr = address || String(payload?.analysis?.address || '');
        if (!addr && id) {
          try {
            const local = await getResults(id);
            addr = String(local?.analysis?.address || '');
          } catch (e: any) {
            console.error('Failed to get local results for id:', e?.message || String(e));
          }
        }
        if (addr) {
          try {
            const pipe = await runPipelineQuick(addr);
            return NextResponse.json({
              ...payload,
              overlay: { 
                polygons: pipe.polygons, 
                resolutionM: pipe.imagery.resolutionM, 
                tileSize: (pipe.imagery as any).tileSize || 256,
                buildingBBox: pipe.buildingBBox || null,
                tileUrls: (pipe.imagery as any).tileUrls || null,
                gridOffsetX: (pipe.imagery as any).gridOffsetX || null,
                gridOffsetY: (pipe.imagery as any).gridOffsetY || null,
              },
              imagery: { url: pipe.imagery.url, cloudCoverage: pipe.imagery.cloudCoverage },
              lidar: { pointDensity: pipe.lidar.pointDensity },
            });
          } catch (e: any) {
            console.error('Pipeline error for external API address:', e?.message || String(e));
            // Return payload without imagery if pipeline fails
            return NextResponse.json({
              ...payload,
              error: 'imagery_fetch_failed',
              message: 'Failed to fetch satellite imagery for this address',
            });
          }
        }
        return NextResponse.json(payload);
      }
    } catch (e: any) {
      console.error('External API request failed:', e?.message || String(e));
      // Fallback to local processing
    }
  }

  // Handle address-based requests
  if (address) {
    try {
      let manualCorners: Array<[number, number]> | null = null;
      let imageExtent: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
      let tileSize: number | null = null;
      
      if (manualCornersParam) {
        try {
          manualCorners = JSON.parse(manualCornersParam);
        } catch (e) {
          console.warn('Failed to parse manualCorners:', e);
        }
      }
      
      if (imageExtentParam) {
        try {
          imageExtent = JSON.parse(imageExtentParam);
        } catch (e) {
          console.warn('Failed to parse imageExtent:', e);
        }
      }
      
      if (tileSizeParam) {
        tileSize = parseInt(tileSizeParam);
      }
      
      const pipe = await runPipelineQuick(address, manualCorners, imageExtent, tileSize);
      return NextResponse.json({
        analysis: { id: `addr:${address}`, address },
        measurements: pipe.measurements,
        overlay: { 
          polygons: pipe.polygons, 
          resolutionM: pipe.imagery.resolutionM, 
          tileSize: (pipe.imagery as any).tileSize || 256,
          buildingBBox: pipe.buildingBBox || null,
          tileUrls: (pipe.imagery as any).tileUrls || null,
          gridOffsetX: (pipe.imagery as any).gridOffsetX || null,
          gridOffsetY: (pipe.imagery as any).gridOffsetY || null,
          imageExtent: (pipe.imagery as any).extent || null, // Include extent for coordinate conversion
        },
        imagery: { url: pipe.imagery.url, cloudCoverage: pipe.imagery.cloudCoverage },
        lidar: { pointDensity: pipe.lidar.pointDensity },
      });
    } catch (e: any) {
      const errorMessage = e?.message || String(e);
      console.error('analysis_results_error for address:', address, errorMessage);
      
      // Provide more specific error messages
      let userMessage = 'Failed to fetch satellite imagery for this address';
      if (errorMessage.includes('geocode') || errorMessage.includes('geocoding')) {
        userMessage = 'Could not find the location for this address. Please check the address and try again.';
      } else if (errorMessage.includes('imagery') || errorMessage.includes('tile')) {
        userMessage = 'Satellite imagery is temporarily unavailable. Please try again later.';
      }

      return NextResponse.json(
        { 
          analysis: { id: `addr:${address}`, address },
          measurements: null,
          error: 'pipeline_failed',
          message: userMessage,
        },
        { status: 500 }
      );
    }
  }

  // Handle ID-based requests
  if (id) {
    try {
      const data = await getResults(id);
      if (data.analysis) {
        try {
          const pipe = await runPipelineQuick(data.analysis.address);
          return NextResponse.json({
            ...data,
            overlay: { 
              polygons: pipe.polygons, 
              resolutionM: pipe.imagery.resolutionM, 
              tileSize: (pipe.imagery as any).tileSize || 256,
              buildingBBox: pipe.buildingBBox || null
            },
            imagery: { url: pipe.imagery.url, cloudCoverage: pipe.imagery.cloudCoverage },
            lidar: { pointDensity: pipe.lidar.pointDensity },
          });
        } catch (e: any) {
          const errorMessage = e?.message || String(e);
          console.error('analysis_results_id_pipeline_error:', errorMessage);
          // If overlay generation fails, still return base data with error info
          return NextResponse.json({
            ...data,
            error: 'imagery_fetch_failed',
            message: 'Failed to fetch satellite imagery, but analysis data is available',
          });
        }
      }
      return NextResponse.json(data);
    } catch (e: any) {
      const errorMessage = e?.message || String(e);
      console.error('Failed to get results for id:', id, errorMessage);
      return NextResponse.json(
        {
          error: 'results_not_found',
          message: 'Analysis results not found for the provided ID',
        },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    { error: 'invalid_request', message: 'Invalid request parameters' },
    { status: 400 }
  );
}
