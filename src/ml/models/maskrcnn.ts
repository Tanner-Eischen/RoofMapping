export type Polygon = Array<[number, number]>;

export async function detectRoofPolygons(imageId: string): Promise<Polygon[]> {
  const poly: Polygon = [
    [0, 0],
    [10, 0],
    [10, 12],
    [0, 12],
  ];
  return [poly];
}

