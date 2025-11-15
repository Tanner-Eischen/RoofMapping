"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ImageOverlay } from '@/components/ui/image-overlay';
import { TileComposite } from '@/components/ui/tile-composite';
import { CornerEditor } from '@/components/ui/corner-editor';

interface ImageryData {
  url: string;
  cloudCoverage?: number;
  resolutionM?: number;
}

interface OverlayData {
  polygons?: Array<Array<[number, number]>>;
  resolutionM?: number;
  tileSize?: number;
  buildingBBox?: Array<{ lat: number; lng: number }> | null;
  tileUrls?: Array<Array<string>> | null;
  gridOffsetX?: number | null;
  gridOffsetY?: number | null;
  imageExtent?: { minX: number; minY: number; maxX: number; maxY: number } | null;
}

interface AnalysisData {
  analysis?: {
    address?: string;
    id?: string;
  };
  imagery?: ImageryData;
  overlay?: OverlayData;
  error?: string;
  message?: string;
}

export default function ResultsPage() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [imageryData, setImageryData] = useState<ImageryData | null>(null);
  const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ 
    width: number; 
    height: number;
    displayedWidth?: number;
    displayedHeight?: number;
  } | null>(null);
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [manualCorners, setManualCorners] = useState<Array<[number, number]> | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);

  useEffect(() => {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const addr = sp.get('address') || '';
    
    if (!addr) {
      setError('No address provided');
      setErrorMessage('Please provide an address to view satellite imagery.');
      setLoading(false);
      return;
    }

    setAddress(addr);
    setLoading(true);
    setError(null);
    setErrorMessage(null);
    setLoadingProgress(20);

    (async () => {
      try {
        setLoadingProgress(40);
        const res = await fetch(`/api/analysis/results?address=${encodeURIComponent(addr)}`);
        setLoadingProgress(60);
        
        const json: AnalysisData = await res.json();
        setLoadingProgress(80);

        if (!res.ok) {
          const errorMsg = json.message || json.error || 'Failed to fetch imagery';
          throw new Error(errorMsg);
        }

        const url = json.imagery?.url || null;
        // If we have tileUrls, prefer those over a potentially failing export URL
        if (json.overlay?.tileUrls && json.overlay.tileUrls.length === 3) {
          // Use tile grid compositing
          setImgSrc(null);
          setCompositeImageUrl(null); // Will be set by TileComposite
          setImageryData(json.imagery || null);
          setOverlayData(json.overlay || null);
          setLoadingProgress(100);
        } else if (url && !url.startsWith('tile-grid:')) {
          // Use regular image URL (but validate it first)
          setImgSrc(url);
          setCompositeImageUrl(null);
          setImageryData(json.imagery || null);
          setOverlayData(json.overlay || null);
          setLoadingProgress(100);
        } else if (url && url.startsWith('tile-grid:')) {
          // Tile grid marker URL - should have tileUrls
          setImgSrc(null);
          setCompositeImageUrl(null);
          setImageryData(json.imagery || null);
          setOverlayData(json.overlay || null);
          setLoadingProgress(100);
        } else {
          throw new Error(json.message || 'No imagery URL found in response');
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to load satellite image';
        setError(errMsg);
        setErrorMessage(errMsg);
        
        // Provide actionable error messages
        if (errMsg.includes('geocode') || errMsg.includes('location')) {
          setErrorMessage('Could not find the location for this address. Please check the address and try again, or try a different address format.');
        } else if (errMsg.includes('imagery') || errMsg.includes('tile') || errMsg.includes('unavailable')) {
          setErrorMessage('Satellite imagery is temporarily unavailable for this location. Please try again later.');
        } else if (errMsg.includes('address')) {
          setErrorMessage('Invalid address format. Please enter a valid street address.');
        }
      } finally {
        setLoading(false);
        setLoadingProgress(100);
      }
    })();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setErrorMessage(null);
    setImgSrc(null);
    setImageryData(null);
    setLoadingProgress(0);
    // Trigger re-fetch by updating state
    window.location.reload();
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      // Convert pixel coordinates to lat/lng using image extent
      if (overlayData?.imageExtent && overlayData.tileSize) {
        const response = await fetch(
          `/api/analysis/results?address=${encodeURIComponent(address)}&manualCorners=${encodeURIComponent(JSON.stringify(manualCorners))}&imageExtent=${encodeURIComponent(JSON.stringify(overlayData.imageExtent))}&tileSize=${overlayData.tileSize}`
        );
        const json = await response.json();
        if (json.error) {
          throw new Error(json.message || 'Reanalysis failed');
        }
        // Update the overlay data with new results
        setOverlayData(json.overlay || null);
        setImageryData(json.imagery || null);
        setEditMode(false);
      } else {
        // Fallback: just pass pixel coordinates
        const response = await fetch(
          `/api/analysis/results?address=${encodeURIComponent(address)}&manualCorners=${encodeURIComponent(JSON.stringify(manualCorners))}`
        );
        const json = await response.json();
        if (json.error) {
          throw new Error(json.message || 'Reanalysis failed');
        }
        setOverlayData(json.overlay || null);
        setImageryData(json.imagery || null);
        setEditMode(false);
      }
    } catch (err: any) {
      setError('Reanalysis failed');
      setErrorMessage(err?.message || 'Failed to reanalyze with manual corners');
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Satellite Image</h1>
          {address && (
            <p className="text-slate-600 text-sm">
              Address: <span className="font-medium">{address}</span>
            </p>
          )}
        </div>
      
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-full max-w-md">
                <Progress value={loadingProgress} />
              </div>
              <p className="text-slate-600">
                {loadingProgress < 40 ? 'Geocoding address...' :
                 loadingProgress < 60 ? 'Fetching satellite imagery...' :
                 loadingProgress < 80 ? 'Processing image...' :
                 'Finalizing...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-700">{errorMessage || error}</p>
              <div className="flex gap-3">
                <Button onClick={handleRetry} variant="default">
                  Try Again
                </Button>
                <Button onClick={() => window.location.href = '/address'} variant="outline">
                  Enter New Address
                </Button>
              </div>
              {address && (
                <div className="mt-4 p-4 bg-slate-50 rounded-md">
                  <p className="text-sm text-slate-600">
                    <strong>Address searched:</strong> {address}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {(imgSrc || overlayData?.tileUrls) && !loading && !error && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-full overflow-hidden rounded-md shadow-lg bg-slate-100 flex items-center justify-center">
                  <div className="relative inline-block">
                    {/* Composite tiles if tileUrls are provided */}
                    {overlayData?.tileUrls && overlayData.tileUrls.length === 3 && !compositeImageUrl && (
                      <TileComposite
                        tileUrls={overlayData.tileUrls}
                        onCompositeComplete={(dataUrl) => {
                          if (dataUrl && dataUrl.length > 0) {
                            setCompositeImageUrl(dataUrl);
                          } else {
                            setError('Failed to composite tiles');
                            setErrorMessage('Unable to load satellite tiles. Please try again.');
                            setLoading(false);
                          }
                        }}
                      />
                    )}
                    
                    {/* Show loading state while compositing tiles */}
                    {overlayData?.tileUrls && overlayData.tileUrls.length === 3 && !compositeImageUrl && (
                      <div className="flex items-center justify-center w-full h-96">
                        <p className="text-slate-600">Compositing satellite tiles...</p>
                      </div>
                    )}
                    
                    {/* Show composite image or regular image */}
                    {(() => {
                      const imageUrl = compositeImageUrl || (imgSrc && !imgSrc.startsWith('tile-grid:') ? imgSrc : null);
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`Satellite imagery of ${address}`}
                          className="w-full h-auto max-h-[80vh] object-contain block"
                          crossOrigin="anonymous"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            // Use natural dimensions (actual image size) for accurate overlay scaling
                            // Then calculate displayed size for positioning
                            setImageDimensions({
                              width: img.naturalWidth || img.clientWidth,
                              height: img.naturalHeight || img.clientHeight,
                              displayedWidth: img.clientWidth,
                              displayedHeight: img.clientHeight
                            });
                          }}
                          onError={() => {
                            setError('Failed to load image');
                            setErrorMessage('The image URL is invalid or the image could not be loaded. Please try again.');
                            setLoading(false);
                          }}
                        />
                      ) : null;
                    })()}
                    
                    {/* Show overlay or corner editor based on mode */}
                    {editMode && imageDimensions && overlayData?.tileSize ? (
                      <CornerEditor
                        imageWidth={imageDimensions.displayedWidth || imageDimensions.width}
                        imageHeight={imageDimensions.displayedHeight || imageDimensions.height}
                        naturalWidth={imageDimensions.width}
                        naturalHeight={imageDimensions.height}
                        initialCorners={manualCorners || overlayData.polygons?.[0] || []}
                        onCornersChange={(corners) => setManualCorners(corners)}
                        tileSize={overlayData.tileSize}
                      />
                    ) : overlayData?.polygons && overlayData.polygons.length > 0 && 
                         imageDimensions && 
                         overlayData.tileSize ? (
                      <ImageOverlay
                        imageWidth={imageDimensions.displayedWidth || imageDimensions.width}
                        imageHeight={imageDimensions.displayedHeight || imageDimensions.height}
                        naturalWidth={imageDimensions.width}
                        naturalHeight={imageDimensions.height}
                        polygon={overlayData.polygons[0]}
                        tileSize={overlayData.tileSize}
                      />
                    ) : null}
                  </div>
                </div>
                
                {imageryData && (
                  <div className="w-full max-w-full mt-4 p-4 bg-slate-50 rounded-md">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {imageryData.resolutionM !== undefined && (
                        <div>
                          <span className="font-medium text-slate-700">Resolution: </span>
                          <span className="text-slate-600">{imageryData.resolutionM.toFixed(2)} m/pixel</span>
                        </div>
                      )}
                      {imageryData.cloudCoverage !== undefined && (
                        <div>
                          <span className="font-medium text-slate-700">Cloud Coverage: </span>
                          <span className="text-slate-600">{imageryData.cloudCoverage.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit mode controls */}
                <div className="w-full max-w-full mt-4 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditMode(!editMode);
                        if (!editMode && overlayData?.polygons?.[0]) {
                          setManualCorners([...overlayData.polygons[0]]);
                        } else if (editMode) {
                          // Reset manual corners when exiting edit mode
                          setManualCorners(null);
                        }
                      }}
                      variant={editMode ? "default" : "outline"}
                    >
                      {editMode ? 'Exit Edit Mode' : 'Edit Corners'}
                    </Button>
                    {editMode && manualCorners && manualCorners.length >= 3 && (
                      <Button
                        onClick={handleReanalyze}
                        disabled={isReanalyzing}
                      >
                        {isReanalyzing ? 'Reanalyzing...' : 'Save & Reanalyze'}
                      </Button>
                    )}
                  </div>
                  {editMode && (
                    <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-md">
                      <p className="font-medium mb-1">Edit Mode Instructions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Click on the image to add new corners</li>
                        <li>Drag existing corners to reposition them</li>
                        <li>Click the × button on a corner to delete it (minimum 3 corners required)</li>
                        <li>Click &quot;Save &amp; Reanalyze&quot; to update the building shape</li>
                      </ul>
                    </div>
                  )}
                </div>

                {overlayData?.buildingBBox && overlayData.buildingBBox.length >= 3 && (
                  <div className="w-full max-w-full mt-4 p-4 bg-slate-50 rounded-md">
                    <h3 className="font-semibold text-slate-900 mb-3">
                      Building Corner Coordinates ({overlayData.buildingBBox.length} corners)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {overlayData.buildingBBox.map((corner, index) => {
                        const latDir = corner.lat >= 0 ? 'N' : 'S';
                        const lngDir = corner.lng >= 0 ? 'E' : 'W';
                        const latAbs = Math.abs(corner.lat);
                        const lngAbs = Math.abs(corner.lng);
                        return (
                          <div key={index} className="flex flex-col">
                            <span className="font-medium text-slate-700">Corner {index + 1}:</span>
                            <span className="text-slate-600 font-mono">
                              {latAbs.toFixed(6)}°{latDir}, {lngAbs.toFixed(6)}°{lngDir}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button onClick={() => window.location.href = '/address'} variant="outline">
              Analyze Another Address
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
