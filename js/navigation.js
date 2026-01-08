// Navigation and Screen Management

// Get all navigation items and screens
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

// Sidebar toggle functionality
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        console.log('Sidebar toggled:', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
    });
}

// Function to switch screens
function switchScreen(screenName) {
    // Hide all screens
    screens.forEach(screen => screen.classList.remove('active'));

    // Show the target screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Clear listings when navigating away from editor
    if (screenName !== 'editor') {
        const container = document.getElementById('listings-container');
        if (container) {
            container.innerHTML = '';
        }
        // Clear saved listings only when going to home or list screen (not batches after save)
        if (screenName === 'home' || screenName === 'list') {
            localStorage.removeItem('currentEditorListings');
        }
    }

    // Clear upload form when navigating away from list screen
    if (screenName !== 'list') {
        const batchTitleInput = document.getElementById('batch-title-input');
        const numListingsInput = document.querySelector('input[placeholder="Num. Listings"]');
        const photosPerListingInput = document.querySelector('input[placeholder="Photos / Listing"]');
        const minPriceInput = document.querySelector('input[placeholder="Min. Price"]');
        const roiInput = document.querySelector('input[placeholder="ROI"]');
        const categorySelect = document.getElementById('batch-category-select');

        if (batchTitleInput) batchTitleInput.value = '';
        if (numListingsInput) numListingsInput.value = '';
        if (photosPerListingInput) photosPerListingInput.value = '';
        if (minPriceInput) minPriceInput.value = '';
        if (roiInput) roiInput.value = '';
        if (categorySelect) {
            categorySelect.value = '';
            categorySelect.style.color = 'var(--text-dim)';
        }
    }

    // Populate analytics grid only when navigating to analytics
    if (screenName === 'analytics') {
        populateAnalyticsGrid();
    }

    // Render batches when navigating to batches screen
    if (screenName === 'batches') {
        renderBatches();
    }
}

// Add click event listeners to each nav item
navItems.forEach(item => {
    item.addEventListener('click', function () {
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));

        // Add active class to clicked item
        this.classList.add('active');

        // Remove focus to prevent persistent highlight
        this.blur();

        // Get the screen type from data attribute
        let screen = this.getAttribute('data-screen');

        // Map 'images' nav to 'batches' screen
        if (screen === 'images') {
            screen = 'batches';
        }

        // Switch to the appropriate screen
        switchScreen(screen);

        // Log the click
        console.log(`Navigated to: ${screen}`);

        // Optional: Add visual feedback
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });

    // Add keyboard navigation support
    item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
});

// Add smooth transition style
navItems.forEach(item => {
    item.style.transition = 'all 0.2s ease';
});

// Log when the page loads
console.log('Bulk Listing Editor loaded');
console.log('Navigation items initialized:', navItems.length);
