export type LidarTile = { id: string; pointDensity: number };

export async function fetchUsgsLidar(address: string): Promise<LidarTile> {
  return { id: 'lidar-' + address.replace(/\s+/g, '-'), pointDensity: 8 };
}

