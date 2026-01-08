// Configuration and constants
// ImgBB API Configuration
// Get your free API key at: https://api.imgbb.com/
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY_HERE'; // Replace with your ImgBB API key

// Global state variables
// Analytics listings mapping (keeps reference to original batch/listing)
let analyticsListings = [];

// Track which batches are collapsed in analytics view
let collapsedBatches = new Set();

// Batches storage
let batches = JSON.parse(localStorage.getItem('batches') || '[]');
let currentBatchListings = [];
let currentBatchIndex = null; // Track which batch is being edited
let currentBatchTitle = ''; // Track the title/SKU for the current batch

// Store uploaded photos for distribution
let uploadedPhotos = [];

// Carousel state
let carouselImages = [];
let currentCarouselIndex = 0;
let carouselListingItem = null;

// Image panel state
let currentEditingListingItem = null;

// Delete confirmation state
let batchToDelete = null;

// Study 2 metrics (if needed)
let study2Metrics = {
    totalAdjustments: 0,
    autoAdjustments: 0,
    manualAdjustments: 0
};

function saveStudy2Metrics() {
    localStorage.setItem('study2Metrics', JSON.stringify(study2Metrics));
}

// Initialize Firebase when page loads
window.addEventListener('load', function () {
    if (typeof initializeFirebase === 'function') {
        initializeFirebase();
        // Enable real-time sync
        setTimeout(() => {
            if (typeof enableRealtimeSync === 'function') {
                enableRealtimeSync();
            }
        }, 1000);
    }
});
