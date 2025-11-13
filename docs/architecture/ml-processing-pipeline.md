# ML Processing Pipeline

## Lambda Handler Architecture

```python
# ml-service/handler.py
import json
import logging
from typing import Dict, Any

from services.sentinel_client import SentinelClient
from services.usgs_client import USGSClient
from services.measurement_service import MeasurementService
from models.roof_detector import RoofDetector

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize services (reused across invocations)
sentinel_client = SentinelClient()
usgs_client = USGSClient()
roof_detector = RoofDetector()
measurement_service = MeasurementService(sentinel_client, usgs_client, roof_detector)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for roof measurement ML processing.
    
    Input (SQS message):
      {
        "analysisId": "uuid",
        "address": "1234 Main St, Austin, TX",
        "coordinates": {"lat": 30.2672, "lng": -97.7431}
      }
    
    Output:
      Updates database with measurements or error status
    """
    try:
        # Parse SQS message
        records = event.get('Records', [])
        if not records:
            return {'statusCode': 400, 'body': 'No SQS records'}
        
        message = json.loads(records[0]['body'])
        analysis_id = message['analysisId']
        coordinates = message['coordinates']
        
        logger.info(f"Processing analysis {analysis_id}")
        
        # Run ML pipeline
        result = measurement_service.analyze_roof(
            analysis_id=analysis_id,
            lat=coordinates['lat'],
            lng=coordinates['lng']
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}", exc_info=True)
        
        # Update database with error status
        # (implementation would call database update here)
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

## Measurement Service

```python
# ml-service/services/measurement_service.py
import logging
from typing import Dict, Any, Tuple
import numpy as np
from shapely.geometry import Polygon

logger = logging.getLogger(__name__)

class MeasurementService:
    """Core service orchestrating roof measurement pipeline."""
    
    def __init__(self, sentinel_client, usgs_client, roof_detector):
        self.sentinel = sentinel_client
        self.usgs = usgs_client
        self.detector = roof_detector
    
    def analyze_roof(
        self,
        analysis_id: str,
        lat: float,
        lng: float
    ) -> Dict[str, Any]:
        """
        Complete roof analysis pipeline.
        
        Steps:
        1. Fetch satellite imagery (Sentinel-2)
        2. Fetch LiDAR data (USGS 3DEP)
        3. Run Mask R-CNN detection
        4. Calculate measurements
        5. Store results
        
        Returns:
            Dict containing measurements and confidence scores
        """
        try:
            # Step 1: Fetch satellite imagery
            logger.info(f"Fetching satellite imagery for {lat}, {lng}")
            satellite_image = self.sentinel.fetch_imagery(lat, lng)
            
            # Step 2: Fetch LiDAR data
            logger.info("Fetching LiDAR data")
            lidar_data = self.usgs.fetch_lidar(lat, lng)
            
            # Step 3: Detect roof boundaries
            logger.info("Running roof detection")
            detections = self.detector.detect_roof(satellite_image)
            
            if not detections or len(detections) == 0:
                logger.warning("No roof detected, requesting mobile assist")
                return {
                    'status': 'needs_assist',
                    'confidence': 0,
                    'message': 'Unable to detect roof from satellite imagery'
                }
            
            # Step 4: Calculate measurements
            logger.info("Calculating measurements")
            roof_polygon = detections[0]['polygon']
            measurements = self._calculate_measurements(
                roof_polygon,
                lidar_data,
                satellite_image.resolution
            )
            
            # Step 5: Calculate confidence
            confidence = self._calculate_confidence(detections[0], lidar_data)
            
            logger.info(f"Analysis complete: confidence={confidence}%")
            
            return {
                'status': 'completed' if confidence >= 70 else 'needs_assist',
                'confidence': confidence,
                'measurements': measurements,
                'detections': detections
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}", exc_info=True)
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    def _calculate_measurements(
        self,
        polygon: Polygon,
        lidar_data: np.ndarray,
        resolution: float
    ) -> Dict[str, Any]:
        """Calculate roof measurements from polygon and LiDAR."""
        
        # Calculate area (convert pixels to square feet)
        area_pixels = polygon.area
        area_sqft = area_pixels * (resolution ** 2) * 10.764  # m² to ft²
        
        # Calculate perimeter
        perimeter_pixels = polygon.length
        perimeter_ft = perimeter_pixels * resolution * 3.281  # m to ft
        
        # Calculate pitch from LiDAR
        pitch, slope = self._calculate_pitch(lidar_data, polygon)
        
        # Detect features
        features = self._detect_features(lidar_data, polygon)
        
        return {
            'total_area': round(area_sqft, 2),
            'perimeter': round(perimeter_ft, 2),
            'pitch': pitch,
            'slope': round(slope, 1),
            'features': features
        }
    
    def _calculate_pitch(
        self,
        lidar_data: np.ndarray,
        polygon: Polygon
    ) -> Tuple[str, float]:
        """Calculate roof pitch from LiDAR elevation data."""
        
        # Extract elevation points within roof polygon
        # (simplified - actual implementation would be more sophisticated)
        
        elevations = lidar_data  # Simplified
        
        if len(elevations) < 2:
            return "Unknown", 0.0
        
        # Calculate slope
        min_elev = np.min(elevations)
        max_elev = np.max(elevations)
        rise = max_elev - min_elev
        
        # Estimate run (simplified)
        run = polygon.bounds[2] - polygon.bounds[0]  # Width
        
        slope = (rise / run) * 100 if run > 0 else 0
        
        # Convert to pitch notation
        if slope < 10:
            pitch = "Flat"
        elif slope < 25:
            pitch = "Low (4/12)"
        elif slope < 50:
            pitch = "Medium (6/12)"
        else:
            pitch = "Steep (9/12)"
        
        return pitch, slope
    
    def _detect_features(
        self,
        lidar_data: np.ndarray,
        polygon: Polygon
    ) -> Dict[str, int]:
        """Detect roof features (vents, chimneys, etc.)."""
        
        # Simplified feature detection
        # Actual implementation would use computer vision techniques
        
        return {
            'vents': 0,
            'chimneys': 0,
            'skylights': 0,
            'dormers': 0
        }
    
    def _calculate_confidence(
        self,
        detection: Dict[str, Any],
        lidar_data: np.ndarray
    ) -> float:
        """Calculate confidence score for measurements."""
        
        # Factors:
        # 1. Detection confidence from Mask R-CNN
        model_confidence = detection.get('score', 0.5)
        
        # 2. LiDAR data quality
        lidar_quality = 1.0 if lidar_data is not None else 0.5
        
        # 3. Image quality (cloud cover, shadows)
        image_quality = 0.9  # Simplified
        
        # Weighted average
        confidence = (
            model_confidence * 0.5 +
            lidar_quality * 0.3 +
            image_quality * 0.2
        ) * 100
        
        return round(confidence, 1)
```

## Roof Detector (Mask R-CNN)

```python
# ml-service/models/roof_detector.py
import torch
import numpy as np
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo
from shapely.geometry import Polygon
import logging

logger = logging.getLogger(__name__)

class RoofDetector:
    """Mask R-CNN based roof detection."""
    
    def __init__(self):
        """Initialize Mask R-CNN model."""
        self.cfg = get_cfg()
        
        # Load pre-trained model
        self.cfg.merge_from_file(
            model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml")
        )
        self.cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
            "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
        )
        
        # Fine-tuned for roofs (would use custom weights in production)
        # self.cfg.MODEL.WEIGHTS = "s3://bucket/roof_model_weights.pth"
        
        self.cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
        self.cfg.MODEL.DEVICE = "cpu"  # Lambda uses CPU
        
        self.predictor = DefaultPredictor(self.cfg)
        
        logger.info("Roof detector initialized")
    
    def detect_roof(self, image: np.ndarray) -> list:
        """
        Detect roof in satellite image.
        
        Args:
            image: RGB image array (H, W, 3)
        
        Returns:
            List of detections, each containing:
            - polygon: Shapely Polygon of roof boundary
            - score: Confidence score (0-1)
            - mask: Binary mask
        """
        try:
            # Run inference
            outputs = self.predictor(image)
            
            instances = outputs["instances"].to("cpu")
            
            # Filter for building class (fine-tuned model would have roof class)
            # For now, assume largest detection is the roof
            
            if len(instances) == 0:
                logger.warning("No detections found")
                return []
            
            # Get largest detection (likely the roof)
            areas = instances.pred_masks.sum(dim=(1, 2))
            largest_idx = torch.argmax(areas).item()
            
            mask = instances.pred_masks[largest_idx].numpy()
            score = instances.scores[largest_idx].item()
            
            # Convert mask to polygon
            polygon = self._mask_to_polygon(mask)
            
            return [{
                'polygon': polygon,
                'score': score,
                'mask': mask
            }]
            
        except Exception as e:
            logger.error(f"Detection failed: {str(e)}", exc_info=True)
            return []
    
    def _mask_to_polygon(self, mask: np.ndarray) -> Polygon:
        """Convert binary mask to polygon."""
        from skimage import measure
        
        # Find contours
        contours = measure.find_contours(mask, 0.5)
        
        if len(contours) == 0:
            return Polygon()
        
        # Use largest contour
        largest_contour = max(contours, key=len)
        
        # Convert to Shapely polygon
        # Swap x/y because find_contours returns (row, col)
        coords = [(y, x) for x, y in largest_contour]
        
        return Polygon(coords)
```

## External Data Clients

```python
# ml-service/services/sentinel_client.py
import requests
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SentinelClient:
    """Client for Sentinel Hub API (Sentinel-2 satellite imagery)."""
    
    def __init__(self):
        self.base_url = "https://services.sentinel-hub.com/api/v1"
        self.client_id = os.environ.get('SENTINEL_CLIENT_ID')
        self.client_secret = os.environ.get('SENTINEL_CLIENT_SECRET')
        self.token = None
    
    def fetch_imagery(
        self,
        lat: float,
        lng: float,
        radius_m: float = 100
    ) -> np.ndarray:
        """
        Fetch Sentinel-2 imagery for coordinates.
        
        Args:
            lat: Latitude
            lng: Longitude
            radius_m: Radius in meters around point
        
        Returns:
            RGB image array (H, W, 3)
        """
        try:
            # Get authentication token
            if not self.token:
                self._authenticate()
            
            # Calculate bounding box
            bbox = self._calculate_bbox(lat, lng, radius_m)
            
            # Request imagery from last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: ["B04", "B03", "B02"],
                    output: { bands: 3 }
                };
            }
            function evaluatePixel(sample) {
                return [sample.B04, sample.B03, sample.B02];
            }
            """
            
            request_payload = {
                "input": {
                    "bounds": {
                        "bbox": bbox,
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.isoformat() + "Z",
                                "to": end_date.isoformat() + "Z"
                            },
                            "maxCloudCoverage": 20
                        }
                    }]
                },
                "output": {
                    "width": 512,
                    "height": 512,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/png"}
                    }]
                },
                "evalscript": evalscript
            }
            
            response = requests.post(
                f"{self.base_url}/process",
                headers={"Authorization": f"Bearer {self.token}"},
                json=request_payload
            )
            
            response.raise_for_status()
            
            # Convert to numpy array
            from PIL import Image
            import io
            
            image = Image.open(io.BytesIO(response.content))
            image_array = np.array(image)
            
            logger.info(f"Fetched imagery: shape={image_array.shape}")
            
            return image_array
            
        except Exception as e:
            logger.error(f"Failed to fetch imagery: {str(e)}")
            raise
    
    def _authenticate(self):
        """Authenticate with Sentinel Hub."""
        response = requests.post(
            "https://services.sentinel-hub.com/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
        )
        response.raise_for_status()
        self.token = response.json()['access_token']
    
    def _calculate_bbox(self, lat: float, lng: float, radius_m: float) -> list:
        """Calculate bounding box around point."""
        # Approximate: 1 degree ≈ 111km
        lat_offset = radius_m / 111000
        lng_offset = radius_m / (111000 * np.cos(np.radians(lat)))
        
        return [
            lng - lng_offset,
            lat - lat_offset,
            lng + lng_offset,
            lat + lat_offset
        ]
```

```python
# ml-service/services/usgs_client.py
import requests
import numpy as np
import logging

logger = logging.getLogger(__name__)

class USGSClient:
    """Client for USGS 3DEP LiDAR data."""
    
    def __init__(self):
        self.base_url = "https://elevation.nationalmap.gov/arcgis/rest/services"
    
    def fetch_lidar(
        self,
        lat: float,
        lng: float,
        radius_m: float = 100
    ) -> np.ndarray:
        """
        Fetch LiDAR point cloud data.
        
        Args:
            lat: Latitude
            lng: Longitude
            radius_m: Radius around point
        
        Returns:
            Elevation array
        """
        try:
            # Query USGS elevation service
            params = {
                'x': lng,
                'y': lat,
                'units': 'Meters',
                'output': 'json'
            }
            
            response = requests.get(
                f"{self.base_url}/3DEPElevation/ImageServer/identify",
                params=params
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Extract elevation data
            elevation = data.get('value', 0)
            
            # Simplified: return single elevation
            # Production would fetch full point cloud
            logger.info(f"Fetched LiDAR: elevation={elevation}m")
            
            return np.array([elevation])
            
        except Exception as e:
            logger.warning(f"LiDAR fetch failed: {str(e)}")
            return None
```

---
