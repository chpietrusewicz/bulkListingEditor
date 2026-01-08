# Code Organization Guide

## File Structure

```
bulkListingEditor/
├── index.html          - Main HTML structure
├── styles.css          - All CSS styling
├── script.js           - Main JavaScript (organized by sections)
├── icons/              - Navigation and UI icons
└── README_CODE.md      - This file
```

## script.js Organization

The script.js file contains all functionality organized into clear sections:

### 1. **Configuration** (Lines 1-13)

- ImgBB API key
- DOM element references
- Global state variables

### 2. **Navigation System** (Lines 15-120)

- Sidebar toggle
- Screen switching
- Tab navigation handlers

### 3. **Analytics/Pricing Functions** (Lines 122-198)

- Select/deselect functionality
- Count updates
- Filter buttons

### 4. **Time Tracking** (Lines 200-227)

- Idle time monitoring
- Action recording

### 5. **Listing Creation** (Lines 229-525)

- `createListingItem()` - Creates listing UI
- Auto-fill logic for title parsing
- Image thumbnail handling
- Form field validation

### 6. **Data Persistence** (Lines 526-603)

- `saveCurrentListings()` - localStorage save
- `checkListingComplete()` - Validation
- Current session management

### 7. **Image Upload System** (Lines 604-888)

- Photo upload to ImgBB
- Multi-image distribution
- Progress indicators
- Continue button logic

### 8. **Batch Management** (Lines 890-1195)

- Batch CRUD operations
- localStorage integration
- Batch card rendering
- Open/edit batch functionality

### 9. **Save & Export** (Lines 1120-1560)

- Save & Quit button
- Export modal
- CSV generation
- eBay format compliance

### 10. **CSV Export Logic** (Lines 1326-1560)

- `generateAndDownloadCSV()` - Main export function
- Column mapping to eBay template
- Data sanitization
- File download

### 11. **Analytics Screen** (Lines 1561-1735)

- Card generation
- Price change calculations
- Batch grouping
- Time period filtering

### 12. **Image Panel** (Lines 1737-1850)

- Multi-image management
- Grid view
- Add/delete images
- URL input handling

### 13. **ImgBB Integration** (Lines 1854-1980)

- `uploadToImgBB()` - API upload
- Base64 conversion
- Error handling
- Add Photos button

### 14. **Image UI Components** (Lines 1983-2028)

- Panel controls
- URL input
- Upload button handlers

### 15. **Price Editing** (Lines 2030-2155)

- Selected cards editing
- Auto-adjust calculations
- Apply/cancel handlers

### 16. **Image Carousel** (Lines 2157-2251)

- Full-screen image viewer
- Navigation (prev/next)
- Keyboard controls
- Counter display

## Key Constants and Mappings

### Condition Mappings

```javascript
// Batch to Listing condition map (Line ~765)
'Near Mint or better' → 'Near Mint or Better'
'Lightly Played or better' → 'Lightly Played (Excellent)'
'Moderately Played' → 'Moderately Played (Very Good)'
'Heavily Played' → 'Heavily Played (Poor)'

// eBay Condition IDs (Line ~1312)
'Near Mint or Better' → '3000'
'Lightly Played (Excellent)' → '4000'
'Moderately Played (Very Good)' → '5000'
'Heavily Played (Poor)' → '6000'
```

### Game Name Mappings

```javascript
// CSV Export (Line ~1348)
'pokemon' → 'Pokémon TCG'
'mtg' → 'Magic: The Gathering'
'yugioh' → 'Yu-Gi-Oh!'
'lorcana' → 'Disney Lorcana'
'onepiece' → 'One Piece'
```

### Condition Abbreviations

```javascript
// Description parsing (Line ~445)
'NM' → 'Near Mint'
'LP' → 'Lightly Played'
'MP' → 'Moderately Played'
'HP' → 'Heavily Played'
'DMG' → 'Damaged'
```

## Data Flow

### 1. Upload Flow

```
User uploads photos → ImgBB API → URLs returned →
Distribute to listings → Update thumbnails → Ready for editing
```

### 2. Listing Creation

```
Continue button → Generate listing items →
Auto-fill game/condition/finish → Distribute photos →
Open editor screen
```

### 3. Save Flow

```
Save & Quit → Capture all fields →
Save to localStorage → Update/create batch →
Navigate to batches screen
```

### 4. Export Flow

```
Export button → Validate fields → Generate CSV →
Map to eBay format → Download file
```

## Key Functions Reference

### Listing Management

- `createListingItem(index)` - Create new listing UI element
- `checkListingComplete(listingItem)` - Validate all required fields
- `saveCurrentListings()` - Persist to localStorage
- `updateListingThumbnail(listingItem)` - Update image preview

### Batch Operations

- `saveBatches()` - Save all batches to localStorage
- `createBatchCard(batch, index)` - Generate batch card UI
- `renderBatches()` - Populate batches grid
- `openBatch(batchIndex)` - Load batch into editor

### Image Handling

- `uploadToImgBB(file)` - Upload image and get URL
- `addImageToListing(url)` - Add image to listing's array
- `deleteImage(index)` - Remove image from listing
- `openCarousel(images, startIndex, listingItem)` - Full-screen viewer

### Export

- `generateAndDownloadCSV()` - Main export function
- `escapeCSV(value)` - Sanitize CSV values

### Screen Management

- `switchScreen(screenName)` - Navigate between screens
- `showExportModal()` / `hideExportModal()` - Export progress
- `showDeleteConfirmation(index)` - Delete confirmation modal

## Storage Structure

### localStorage Keys

- `batches` - Array of all saved batches
- `currentEditorListings` - Current session listings

### Batch Object Structure

```javascript
{
  id: timestamp,
  title: "Batch Title",
  listings: [ /* array of listing objects */ ],
  timestamp: ISO string
}
```

### Listing Object Structure

```javascript
{
  title: string,
  sku: string,
  qty: string,
  price: string,
  description: string,
  condition: string,
  type: string,
  finish: string,
  rarity: string,
  character: string,
  set: string,
  cardNumber: string,
  specialty: string,
  game: string,
  images: string[] // Array of image URLs
}
```

## Auto-Fill Logic

The title input automatically fills other fields using pattern matching:

### Pattern: `Character Type Set Code: Set Name CardNumber Condition`

**Example:** `Blitzle Pokeball SV: White Flare 031/086 NM`

Extracts:

- **Character:** First word → `Blitzle`
- **Set:** Pattern `[A-Z]{2,}\d*: ...` → `SV: White Flare`
- **Card Number:** Pattern `\d+/\d+` → `031/086`
- **Description:** `{Character Type} from {Set} {CardNumber} {Condition}`
  → `Blitzle Pokeball from SV: White Flare 031/086 Near Mint`

## Future Improvements

### Possible Enhancements:

1. **Module System** - Split into separate ES6 modules
2. **TypeScript** - Add type safety
3. **Testing** - Unit tests for core functions
4. **API Abstraction** - Separate API layer for ImgBB
5. **State Management** - Consider Redux/Zustand for complex state
6. **React/Vue** - Modern framework for better componentization

### Quick Wins:

1. Extract constants to top of file
2. Add JSDoc comments to functions
3. Break large functions into smaller utilities
4. Add error boundary handlers
5. Improve async/await error handling
