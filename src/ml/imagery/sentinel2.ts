export type Sentinel2Image = { id: string; resolutionM: number; bands: string[] };

export async function fetchSentinel2(address: string): Promise<Sentinel2Image> {
  return { id: 's2-' + address.replace(/\s+/g, '-'), resolutionM: 10, bands: ['RGB', 'NIR'] };
}

