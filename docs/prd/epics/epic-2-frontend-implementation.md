# Epic 2: Frontend Implementation

**Epic Goal:** Build the mobile-first web application with all four screens per UX specification.

**Epic Priority:** P0 (Must-have for MVP)

---

## Story 2.1: Address Input Screen (Screen 1)

**As a** contractor  
**I want** to enter a property address with autocomplete  
**So that** I can quickly start a roof analysis

**Acceptance Criteria:**
- [ ] Address input page implemented (`app/page.tsx`)
- [ ] Google Maps Places Autocomplete integrated
- [ ] Input validation (must select from autocomplete)
- [ ] Error states displayed for invalid addresses
- [ ] "Analyze Roof" button enabled only when valid address selected
- [ ] Navigation to processing screen on submission
- [ ] Mobile-responsive (matches UX spec exactly)
- [ ] Accessibility: ARIA labels, keyboard navigation

**Priority:** P0  
**Estimated Effort:** 4 hours  
**Dependencies:** Story 1.1, Story 1.4

**UI Components:**
- AddressInput component
- PlaceAutocomplete component  
- Button, Input, Card from shadcn/ui

---

## Story 2.2: Processing Screen (Screen 2)

**As a** contractor  
**I want** to see a loading state while my analysis processes  
**So that** I know the system is working

**Acceptance Criteria:**
- [ ] Processing page implemented (`app/analyze/page.tsx`)
- [ ] Spinning loader with sage green color
- [ ] Display submitted address
- [ ] Status text: "Analyzing Roof" and "Processing satellite and LiDAR data..."
- [ ] Automatic navigation from Screen 1
- [ ] Poll for results every 2 seconds (starts after 2 seconds)
- [ ] Poll starts 2 seconds after page load (not immediately)
- [ ] Poll interval: exactly 2 seconds between requests
- [ ] Stop polling on navigation away from page
- [ ] Show 'Taking longer than expected' message after 30s
- [ ] Navigate to results when status = "completed"
- [ ] Navigate to mobile assist when status = "needs_assist"
- [ ] Timeout after 30s: show retry button
- [ ] Timeout after 60s: redirect to mobile assist

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 2.1

---

## Story 2.3: Results Screen (Screen 3a)

**As a** contractor  
**I want** to view detailed roof measurements and export them  
**So that** I can use the data for my bids

**Acceptance Criteria:**
- [ ] Results page implemented (`app/results/page.tsx`)
- [ ] Display all measurements from API (area, perimeter, pitch, slope)
- [ ] Complexity indicator with progress bar
- [ ] Feature count display (vents, chimneys, etc.)
- [ ] Accuracy indicators (±3% notation)
- [ ] Satellite image display
- [ ] Share button with native share API (mobile) or copy link (desktop)
- [ ] Export PDF button (client-side generation)
- [ ] Mobile-responsive grid layout
- [ ] Loading states for images
- [ ] Error handling for missing analysis

**Priority:** P0  
**Estimated Effort:** 5 hours  
**Dependencies:** Story 2.2

**UI Components:**
- MeasurementCard component
- ComplexityIndicator component
- Results header with actions

---

## Story 2.4: Mobile Assist Screen (Screen 3b)

**As a** contractor  
**I want** to capture supplementary photos when satellite data is insufficient  
**So that** I can still get accurate measurements

**Acceptance Criteria:**
- [ ] Mobile assist page implemented (`app/assist/page.tsx`)
- [ ] Explanation of why photos needed (low confidence)
- [ ] Three photo guides: front, left side, right side
- [ ] Camera modal with guidance overlay
- [ ] Photo preview after capture
- [ ] Re-take functionality
- [ ] Submit button enabled when all 3 photos captured
- [ ] Loading state during photo upload
- [ ] Navigate to results after enhanced processing
- [ ] Image compression before upload (max 1920px, 85% quality)

**Priority:** P0  
**Estimated Effort:** 6 hours  
**Dependencies:** Story 2.3

**UI Components:**
- PhotoGuideCard component
- CameraModal component (react-webcam)
- Photo thumbnail grid

---

## Story 2.5: PDF Export Functionality

**As a** contractor  
**I want** to export measurements as a PDF  
**So that** I can share with clients and save for records

**Acceptance Criteria:**
- [ ] PDF generation implemented (jsPDF + html2canvas)
- [ ] PDF includes: address, date, all measurements, satellite image
- [ ] Professional formatting matching brand guidelines
- [ ] Generated filename: "RoofReport_[Address]_[Date].pdf"
- [ ] Download triggered on button click
- [ ] Loading indicator during generation
- [ ] Works on mobile devices
- [ ] PDF size optimized (<5MB)

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 2.3

**Technical Notes:**
- Client-side generation (no server processing)
- Lazy load jsPDF and html2canvas
- Use pdf-generator.ts utility

---
