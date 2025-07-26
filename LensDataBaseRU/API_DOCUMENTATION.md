# LensDataBase API Documentation

## Overview

This document describes the API endpoints and data structures used by the LensDataBase Swift Playground application. The app integrates with external APIs to provide comprehensive camera lens and rental information.

## Base Configuration

### Primary API Endpoint
```
https://lksrental.site/api.php?action=all
```

### Local Data Sources
- `Resources/CAMERADATA.json` - Camera specifications and recording formats
- Local caching for offline functionality

## API Endpoints

### 1. Get All Lens Data

**Endpoint:** `GET https://lksrental.site/api.php?action=all`

**Description:** Retrieves comprehensive lens database including lenses, rentals, and inventory information.

**Response Format:**
```json
{
  "success": boolean,
  "database": {
    "rentals": [Rental],
    "lenses": [Lens],
    "inventory": [InventoryItem]
  }
}
```

**Success Response Example:**
```json
{
  "success": true,
  "database": {
    "rentals": [
      {
        "id": "R001",
        "name": "Professional Camera Rental",
        "address": "123 Film Street, Los Angeles, CA",
        "phone": "+1-555-CAMERA",
        "website": "https://example-rental.com"
      }
    ],
    "lenses": [
      {
        "id": "L001",
        "display_name": "ARRI Signature Prime 25mm T1.8",
        "manufacturer": "ARRI",
        "lens_name": "Signature Prime 25mm",
        "format": "Spherical Prime",
        "focal_length": "25",
        "aperture": "T1.8",
        "close_focus_in": "12",
        "close_focus_cm": "30",
        "image_circle": "46.3",
        "length": "110",
        "front_diameter": "95",
        "squeeze_factor": null,
        "lens_format": "FF"
      }
    ],
    "inventory": [
      {
        "id": "INV001",
        "rental_id": "R001",
        "lens_id": "L001",
        "display_name": "ARRI Signature Prime 25mm T1.8",
        "notes": "Excellent condition, recently serviced"
      }
    ]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Data Models

### Lens Model

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique lens identifier | "L001" |
| `display_name` | String | Full display name | "ARRI Signature Prime 25mm T1.8" |
| `manufacturer` | String | Lens manufacturer | "ARRI" |
| `lens_name` | String | Model name | "Signature Prime 25mm" |
| `format` | String | Lens format category | "Spherical Prime" |
| `focal_length` | String | Focal length specification | "25" or "24-70" |
| `aperture` | String | Maximum aperture | "T1.8" or "f/2.8" |
| `close_focus_in` | String | Minimum focus distance (inches) | "12" |
| `close_focus_cm` | String | Minimum focus distance (cm) | "30" |
| `image_circle` | String | Image circle diameter (mm) | "46.3" |
| `length` | String | Physical length (mm) | "110" |
| `front_diameter` | String | Front element diameter (mm) | "95" |
| `squeeze_factor` | String? | Anamorphic squeeze factor | "2x" or null |
| `lens_format` | String | Sensor format compatibility | "FF", "S35", "S16", "MFT" |

### Camera Model

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique camera identifier | "CAM001" |
| `manufacturer` | String | Camera manufacturer | "RED" |
| `model` | String | Camera model | "V-RAPTOR 8K VV" |
| `sensor` | String | Sensor type | "FF" |
| `sensorWidth` | String | Sensor width (mm) | "40.96" |
| `sensorHeight` | String | Sensor height (mm) | "21.60" |
| `imageCircle` | String | Required image circle (mm) | "46.31" |

### Recording Format Model

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique format identifier | "FMT001" |
| `cameraId` | String | Associated camera ID | "CAM001" |
| `manufacturer` | String | Camera manufacturer | "RED" |
| `model` | String | Camera model | "V-RAPTOR 8K VV" |
| `sensorWidth` | String | Sensor width (mm) | "40.96" |
| `sensorHeight` | String | Sensor height (mm) | "21.60" |
| `recordingFormat` | String | Recording format name | "8K FF" |
| `recordingWidth` | String | Recording width (pixels) | "8192" |
| `recordingHeight` | String | Recording height (pixels) | "4320" |
| `recordingImageCircle` | String | Required image circle (mm) | "46.31" |

### Rental Model

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique rental house identifier | "R001" |
| `name` | String | Rental house name | "Professional Camera Rental" |
| `address` | String | Physical address | "123 Film Street, LA, CA" |
| `phone` | String | Contact phone | "+1-555-CAMERA" |
| `website` | String | Website URL | "https://example.com" |

### Inventory Item Model

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique inventory identifier | "INV001" |
| `rental_id` | String | Associated rental house ID | "R001" |
| `lens_id` | String | Associated lens ID | "L001" |
| `display_name` | String? | Custom display name | "ARRI Signature 25mm" |
| `notes` | String? | Additional notes | "Excellent condition" |

## Enumerations

### Focal Length Categories

| Category | Range | Description |
|----------|-------|-------------|
| `all` | All | No filtering |
| `ultraWide` | ≤12mm | Ultra wide angle lenses |
| `wide` | 13-35mm | Wide angle lenses |
| `standard` | 36-70mm | Standard/normal lenses |
| `tele` | 71-180mm | Telephoto lenses |
| `superTele` | 181mm+ | Super telephoto lenses |

### Lens Format Categories

| Category | Formats | Description |
|----------|---------|-------------|
| `s16` | S16 | Super 16mm format |
| `s35` | S35, S35+ | Super 35mm format |
| `ff` | FF, VV, LF, 65 | Full frame/large format |
| `mft` | MFT, Unknown | Micro Four Thirds and others |

### Data Loading States

| State | Description |
|-------|-------------|
| `idle` | No operation in progress |
| `loading` | Data is being fetched |
| `loaded` | Data successfully loaded |
| `error(String)` | Error occurred with message |

### Active Tab States

| Tab | Description |
|-----|-------------|
| `rentalView` | Rental houses and settings |
| `allLenses` | Main lens browsing interface |
| `favorites` | User's favorite lenses |

## Error Handling

### Network Errors
- **Connection timeout**: Automatic retry with exponential backoff
- **Invalid response**: Fallback to cached data
- **API unavailable**: Local data mode with user notification

### Data Validation
- **Missing fields**: Default values applied automatically
- **Invalid types**: Flexible decoding with type conversion
- **Malformed JSON**: Error state with user-friendly message

### Error Response Format
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Data Processing

### Flexible Decoding
The app implements flexible JSON decoding that handles:
- String/Number type variations
- Missing optional fields
- Different date formats
- Null value handling

### Example Flexible Decoding Implementation
```swift
private static func decodeFlexible(container: KeyedDecodingContainer<CodingKeys>, key: CodingKeys) throws -> String? {
    if let stringValue = try? container.decode(String.self, forKey: key) {
        return stringValue
    } else if let intValue = try? container.decode(Int.self, forKey: key) {
        return String(intValue)
    } else if let doubleValue = try? container.decode(Double.self, forKey: key) {
        return String(doubleValue)
    } else if let boolValue = try? container.decode(Bool.self, forKey: key) {
        return boolValue ? "true" : "false"
    } else {
        return nil
    }
}
```

## Caching Strategy

### Local Storage
- **Favorites**: Persistent storage using UserDefaults
- **Recent searches**: Temporary cache for session
- **API responses**: Core Data or JSON file caching

### Cache Invalidation
- **Time-based**: 24-hour cache expiration
- **Manual refresh**: Pull-to-refresh gesture
- **Version checking**: API version header comparison

## Rate Limiting

### API Limits
- Maximum 60 requests per minute
- Bulk data fetching preferred over individual requests
- Automatic retry with exponential backoff

### Best Practices
- Cache responses locally
- Batch multiple operations
- Use appropriate HTTP headers
- Implement circuit breaker pattern

## Authentication

Currently, the API does not require authentication. Future versions may implement:
- API key authentication
- Rate limiting per key
- Premium feature access control

## Versioning

### API Versioning Strategy
- URL-based versioning: `/api/v1/`, `/api/v2/`
- Header-based versioning: `Accept: application/vnd.api+json;version=1`
- Backward compatibility maintenance for 2 major versions

### App Compatibility
- Minimum supported API version: v1.0
- Graceful degradation for newer API features
- Feature flag system for API capabilities

## Development Notes

### Testing
- Mock API responses for unit tests
- Integration tests with live API
- Error scenario simulation
- Performance testing with large datasets

### Monitoring
- API response time tracking
- Error rate monitoring
- Data quality validation
- User experience metrics

### Security
- HTTPS-only communication
- Certificate pinning (production)
- Input validation and sanitization
- No sensitive data in URLs

---

*This documentation is maintained alongside the LensDataBase Swift Playground application. For questions or updates, please refer to the project repository.*