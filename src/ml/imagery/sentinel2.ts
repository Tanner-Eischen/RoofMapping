import { env } from '../../../lib/env';
import { proxyRequest } from '../../../lib/http';

export type Sentinel2Image = {
  id: string;
  resolutionM: number;
  bands: string[];
  url: string;
  cloudCoverage: number;
};

export async function fetchSentinel2(address: string): Promise<Sentinel2Image> {
  const id = 's2-' + address.replace(/\s+/g, '-');
  // Try external provider with retries
  if (env.externalApiUrl) {
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await proxyRequest(`/imagery/sentinel2?address=${encodeURIComponent(address)}&size=512`);
        if (res.ok && (res as any).json) {
          const j = (res as any).json;
          const cc = Number(j.cloudCoverage ?? 0);
          if (cc > 20) throw new Error('cloud_coverage_high');
          return {
            id,
            resolutionM: Number(j.resolutionM ?? 10),
            bands: Array.isArray(j.bands) ? j.bands : ['B04', 'B03', 'B02'],
            url: String(j.url || ''),
            cloudCoverage: cc,
          };
        }
        lastErr = new Error('imagery_fetch_failed');
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      }
    }
    throw lastErr || new Error('no_imagery');
  }

  // Fallback: generate a placeholder 512x512 SVG tile
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><defs><pattern id='g' width='32' height='32' patternUnits='userSpaceOnUse'><path d='M32 0H0V32' fill='none' stroke='#ddd'/></pattern></defs><rect width='512' height='512' fill='url(#g)'/></svg>`;
  return {
    id,
    resolutionM: 10,
    bands: ['B04', 'B03', 'B02'],
    url: 'data:image/svg+xml,' + encodeURIComponent(svg),
    cloudCoverage: 0,
  };
}
