"use client";
import { useEffect, useState, useRef } from 'react';

interface TileCompositeProps {
  tileUrls: Array<Array<string>>; // 3x3 grid of tile URLs
  onCompositeComplete: (dataUrl: string) => void;
}

export function TileComposite({ tileUrls, onCompositeComplete }: TileCompositeProps) {
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!tileUrls || tileUrls.length !== 3 || tileUrls[0].length !== 3) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const tileSize = 256;
    const gridSize = 3;
    const compositeSize = tileSize * gridSize; // 768x768

    canvas.width = compositeSize;
    canvas.height = compositeSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all tiles and composite them
    const loadTile = (url: string, x: number, y: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        // Try anonymous first, fallback to no CORS if that fails
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Draw tile at its position in the grid
            ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
            resolve();
          } catch (e) {
            console.warn(`Failed to draw tile at (${x}, ${y}):`, e);
            // Draw placeholder on error
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            resolve();
          }
        };
        
        img.onerror = (err) => {
          console.warn(`Failed to load tile at (${x}, ${y}) from ${url}:`, err);
          // Draw a placeholder for failed tiles
          ctx.fillStyle = '#f0f0f0';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
          // Add error text
          ctx.fillStyle = '#999';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Tile failed', x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
          resolve(); // Continue even if tile fails
        };
        
        // Set src after setting up handlers
        img.src = url;
      });
    };

    // Load all 9 tiles in parallel
    const loadPromises: Array<Promise<void>> = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const url = tileUrls[y][x];
        if (url) {
          loadPromises.push(loadTile(url, x, y));
        }
      }
    }

    Promise.all(loadPromises)
      .then(() => {
        // Convert canvas to data URL or blob URL
        try {
          // Try data URL first (works if canvas is not tainted)
          let imageUrl: string;
          try {
            const dataUrl = canvas.toDataURL('image/png');
            if (!dataUrl || dataUrl === 'data:,') {
              throw new Error('Canvas data URL is empty');
            }
            imageUrl = dataUrl;
            console.log('Tile composite created successfully (data URL), size:', dataUrl.length);
          } catch (dataUrlError) {
            // Canvas might be tainted due to CORS - try blob URL instead
            console.warn('Data URL failed (possibly tainted canvas), trying blob URL:', dataUrlError);
            canvas.toBlob((blob) => {
              if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                setCompositeUrl(blobUrl);
                onCompositeComplete(blobUrl);
              } else {
                throw new Error('Failed to create blob from canvas');
              }
            }, 'image/png');
            return; // Exit early, blob callback will handle completion
          }
          
          setCompositeUrl(imageUrl);
          onCompositeComplete(imageUrl);
        } catch (error) {
          console.error('Failed to create image URL from canvas:', error);
          // Try blob as fallback
          canvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              setCompositeUrl(blobUrl);
              onCompositeComplete(blobUrl);
            } else {
              console.error('Failed to create fallback blob');
              onCompositeComplete('');
            }
          }, 'image/png');
        }
      })
      .catch((error) => {
        console.error('Failed to composite tiles:', error);
        // Still try to create composite even if some tiles failed
        try {
          const dataUrl = canvas.toDataURL('image/png');
          if (dataUrl && dataUrl !== 'data:,') {
            setCompositeUrl(dataUrl);
            onCompositeComplete(dataUrl);
          } else {
            throw new Error('Data URL is empty');
          }
        } catch (e) {
          console.error('Failed to create fallback composite:', e);
          // Try blob as last resort
          canvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              setCompositeUrl(blobUrl);
              onCompositeComplete(blobUrl);
            } else {
              onCompositeComplete('');
            }
          }, 'image/png');
        }
      });
  }, [tileUrls, onCompositeComplete]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (compositeUrl && compositeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(compositeUrl);
      }
    };
  }, [compositeUrl]);

  // Return hidden canvas - the composite URL will be used by parent
  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
}

