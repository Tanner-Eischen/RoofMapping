"use client";
import * as React from 'react';

interface ImageOverlayProps {
  imageWidth: number; // Displayed width
  imageHeight: number; // Displayed height
  naturalWidth: number; // Actual image width
  naturalHeight: number; // Actual image height
  polygon: Array<[number, number]>; // Pixel coordinates relative to tileSize
  tileSize: number; // Original tile/image size from API (assumed square)
}

export function ImageOverlay({ 
  imageWidth, 
  imageHeight, 
  naturalWidth,
  naturalHeight,
  polygon, 
  tileSize 
}: ImageOverlayProps) {
  // The polygon coordinates are relative to tileSize (assumed square)
  // But the actual image might not be square (naturalWidth x naturalHeight)
  // We need to scale from tileSize space to natural image space, then to displayed space
  
  // First, scale from tileSize coordinates to natural image dimensions
  // If image is not square, we need to account for aspect ratio
  const naturalScaleX = naturalWidth / tileSize;
  const naturalScaleY = naturalHeight / tileSize;
  
  // Scale polygon to natural image coordinates
  const naturalPolygon = polygon.map(([x, y]) => [
    x * naturalScaleX,
    y * naturalScaleY
  ]);
  
  // Then scale from natural dimensions to displayed dimensions
  const displayScaleX = imageWidth / naturalWidth;
  const displayScaleY = imageHeight / naturalHeight;
  
  // Use uniform scaling to maintain aspect ratio (object-contain behavior)
  const displayScale = Math.min(displayScaleX, displayScaleY);
  
  // Calculate the displayed size of the image (may be smaller than container due to object-contain)
  const displayedImageWidth = naturalWidth * displayScale;
  const displayedImageHeight = naturalHeight * displayScale;
  
  // Calculate offset to center the overlay if image is smaller than container
  const offsetX = (imageWidth - displayedImageWidth) / 2;
  const offsetY = (imageHeight - displayedImageHeight) / 2;
  
  // Scale polygon coordinates to match displayed image dimensions
  const scaledPolygon = naturalPolygon.map(([x, y]) => [
    x * displayScale + offsetX,
    y * displayScale + offsetY
  ]);

  // Create SVG path from polygon coordinates
  const pathData = scaledPolygon
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ') + ' Z';

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={imageWidth}
      height={imageHeight}
      style={{ width: imageWidth, height: imageHeight }}
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
    >
      {/* Bounding box overlay */}
      <path
        d={pathData}
        fill="rgba(29, 78, 216, 0.15)"
        stroke="#1d4ed8"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Corner markers */}
      {scaledPolygon.map(([x, y], index) => (
        <g key={index}>
          <circle
            cx={x}
            cy={y}
            r={6}
            fill="#1d4ed8"
            stroke="white"
            strokeWidth={2}
          />
          <circle
            cx={x}
            cy={y}
            r={3}
            fill="white"
          />
        </g>
      ))}
    </svg>
  );
}

