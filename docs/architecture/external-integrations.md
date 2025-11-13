# External Integrations

## Google Maps Places API

**Purpose:** Address autocomplete  
**Authentication:** API Key  
**Rate Limits:** 1000 requests/day (free tier)

```typescript
// Usage in PlaceAutocomplete component
import { useMapsLibrary } from '@vis.gl/react-google-maps'

export function PlaceAutocomplete({ onPlaceSelect }) {
  const places = useMapsLibrary('places')
  
  useEffect(() => {
    if (!places) return
    
    const autocomplete = new places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    })
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      onPlaceSelect(place)
    })
  }, [places])
  
  return <input ref={inputRef} />
}
```

## Sentinel Hub API

**Purpose:** Sentinel-2 satellite imagery  
**Authentication:** OAuth 2.0 Client Credentials  
**Rate Limits:** 30,000 processing units/month (free tier)  
**Cost:** Free for MVP, $0.02/processing unit after

## USGS 3DEP

**Purpose:** LiDAR elevation data  
**Authentication:** None (public API)  
**Rate Limits:** None documented  
**Cost:** Free

## AWS Services

**SQS:** Message queue for async ML processing  
**Lambda:** Serverless compute for ML pipeline  
**S3:** Object storage for images and PDFs  
**CloudWatch:** Logging and monitoring

---
