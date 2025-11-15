"use client";
import { useState, useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface CornerEditorProps {
  imageWidth: number;
  imageHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  initialCorners: Array<[number, number]>; // Pixel coordinates in natural image space
  onCornersChange: (corners: Array<[number, number]>) => void;
  tileSize: number;
}

export function CornerEditor({
  imageWidth,
  imageHeight,
  naturalWidth,
  naturalHeight,
  initialCorners,
  onCornersChange,
  tileSize
}: CornerEditorProps) {
  // Store corners in tileSize coordinate space (as received from API)
  const [corners, setCorners] = useState<Array<[number, number]>>(initialCorners);
  
  // Update corners when initialCorners change (e.g., when entering edit mode)
  useEffect(() => {
    if (initialCorners && initialCorners.length > 0) {
      setCorners(initialCorners);
    }
  }, [initialCorners]);
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate scaling factors (same as ImageOverlay)
  const naturalScaleX = naturalWidth / tileSize;
  const naturalScaleY = naturalHeight / tileSize;
  
  // Scale from tileSize space to natural image space
  const naturalCorners = corners.map(([x, y]) => [
    x * naturalScaleX,
    y * naturalScaleY
  ]);

  // Then scale from natural to displayed
  const displayScaleX = imageWidth / naturalWidth;
  const displayScaleY = imageHeight / naturalHeight;
  const displayScale = Math.min(displayScaleX, displayScaleY);
  const displayedImageWidth = naturalWidth * displayScale;
  const displayedImageHeight = naturalHeight * displayScale;
  const offsetX = (imageWidth - displayedImageWidth) / 2;
  const offsetY = (imageHeight - displayedImageHeight) / 2;

  // Convert from natural image coordinates to displayed coordinates
  const toDisplayCoords = ([x, y]: [number, number]): Point => ({
    x: x * displayScale + offsetX,
    y: y * displayScale + offsetY
  });

  // Convert from displayed coordinates back to natural image coordinates, then to tileSize space
  const toNaturalCoords = (displayX: number, displayY: number): [number, number] => {
    const naturalX = (displayX - offsetX) / displayScale;
    const naturalY = (displayY - offsetY) / displayScale;
    // Convert back to tileSize space
    return [naturalX / naturalScaleX, naturalY / naturalScaleY];
  };

  // Get mouse position relative to SVG
  const getMousePos = (e: React.MouseEvent<SVGElement>): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getMousePos(e);
    setIsDragging(index);
    setDragStart(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    if (isDragging === null) return;
    const pos = getMousePos(e);
    const natural = toNaturalCoords(pos.x, pos.y);
    const newCorners = [...corners];
    newCorners[isDragging] = natural;
    setCorners(newCorners);
    onCornersChange(newCorners);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleAddCorner = (e: React.MouseEvent<SVGElement>) => {
    if (isDragging !== null) return; // Don't add while dragging
    e.stopPropagation();
    const pos = getMousePos(e);
    const natural = toNaturalCoords(pos.x, pos.y);
    const newCorners = [...corners, natural];
    setCorners(newCorners);
    onCornersChange(newCorners);
  };

  const handleDeleteCorner = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (corners.length <= 3) return; // Need at least 3 corners
    const newCorners = corners.filter((_, i) => i !== index);
    setCorners(newCorners);
    onCornersChange(newCorners);
  };

  const displayCorners = naturalCorners.map(c => toDisplayCoords(c as [number, number]));

  return (
    <svg
      ref={svgRef}
      className="absolute top-0 left-0 pointer-events-auto cursor-crosshair"
      width={imageWidth}
      height={imageHeight}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleAddCorner}
    >
      {/* Polygon outline */}
      {displayCorners.length >= 3 && (
        <path
          d={`M ${displayCorners.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`}
          fill="rgba(34, 197, 94, 0.1)"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      )}

      {/* Corner markers */}
      {displayCorners.map((corner, index) => (
        <g key={index}>
          <circle
            cx={corner.x}
            cy={corner.y}
            r={10}
            fill="#22c55e"
            stroke="white"
            strokeWidth={2}
            onMouseDown={(e) => handleMouseDown(e, index)}
            style={{ cursor: 'move' }}
          />
          <text
            x={corner.x}
            y={corner.y - 18}
            textAnchor="middle"
            fill="#22c55e"
            fontSize="14"
            fontWeight="bold"
            pointerEvents="none"
          >
            {index + 1}
          </text>
          {/* Delete button */}
          {corners.length > 3 && (
            <g>
              <circle
                cx={corner.x + 14}
                cy={corner.y - 14}
                r={7}
                fill="#ef4444"
                stroke="white"
                strokeWidth={1.5}
                onClick={(e) => handleDeleteCorner(index, e)}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={corner.x + 14}
                y={corner.y - 14}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                pointerEvents="none"
              >
                ×
              </text>
            </g>
          )}
        </g>
      ))}
      
      {/* Instructions */}
      {displayCorners.length === 0 && (
        <text
          x={imageWidth / 2}
          y={imageHeight / 2}
          textAnchor="middle"
          fill="#666"
          fontSize="16"
          pointerEvents="none"
        >
          Click to add corners
        </text>
      )}
    </svg>
  );
}

