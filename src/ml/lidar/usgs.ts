export type UsgsLidarData = {
  pointDensity: number;
  elevationM: number | null;
};

export async function fetchUsgsLidar(lat: number, lng: number): Promise<UsgsLidarData> {
  const url = `https://tnmaccess.nationalmap.gov/api/v1/elevation?x=${lng}&y=${lat}&units=meters&output=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { pointDensity: 0, elevationM: null };
    const json = await res.json();
    const elevation = json.value ?? null;
    const pointDensity = elevation !== null ? 6 : 0;
    return { pointDensity, elevationM: elevation };
  } catch {
    return { pointDensity: 0, elevationM: null };
  }
}