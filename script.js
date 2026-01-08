// ImgBB API Configuration
// Get your free API key at: https://api.imgbb.com/
const IMGBB_API_KEY = 'de6f2de2e6780eaa56e9ff8aba676d56'; // Replace with your ImgBB API key

// Get all navigation items and screens
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
// Analytics listings mapping (keeps reference to original batch/listing)
let analyticsListings = [];
// Track which batches are collapsed in analytics view
let collapsedBatches = new Set();

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

// Pricing (Analytics) select/deselect all handlers
function selectAllPricing() {
    const cards = document.querySelectorAll('#analytics-grid .analytics-card');
    cards.forEach(c => c.classList.add('selected'));
    updatePricingSelectedCount();
}

function deselectAllPricing() {
    const cards = document.querySelectorAll('#analytics-grid .analytics-card');
    cards.forEach(c => c.classList.remove('selected'));
    updatePricingSelectedCount();
}

// Update the selected count badge in the analytics header
function updatePricingSelectedCount() {
    // Primary: update the Edit button's inline count and enable/disable the button
    const editBtn = document.getElementById('edit-selected-btn');
    const countSpan = document.getElementById('edit-selected-count');
    const selectedCount = document.querySelectorAll('#analytics-grid .analytics-card.selected').length;

    if (countSpan) {
        if (selectedCount > 0) {
            // show as (N)
            countSpan.textContent = `(${selectedCount})`;
            countSpan.style.display = 'inline';
        } else {
            // Hide the count when zero so the button reads just "Edit" and doesn't show 0
            countSpan.textContent = '';
            countSpan.style.display = 'none';
        }
    }

    if (editBtn) {
        if (selectedCount > 0) {
            editBtn.disabled = false;
            editBtn.setAttribute('aria-disabled', 'false');
            editBtn.classList.remove('disabled');
        } else {
            editBtn.disabled = true;
            editBtn.setAttribute('aria-disabled', 'true');
            editBtn.classList.add('disabled');
        }
    }

    // Backwards compatibility: if the old header badge exists, keep it in sync
    const countEl = document.getElementById('pricing-selected-count');
    if (countEl) {
        if (selectedCount > 0) {
            countEl.textContent = `${selectedCount} selected`;
            countEl.classList.remove('hidden');
            countEl.style.display = 'inline-flex';
        } else {
            countEl.textContent = '0 selected';
            countEl.classList.add('hidden');
            countEl.style.display = 'none';
        }
    }
}

// Wire up buttons (they may not exist on initial load)
document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'select-all-pricing') {
        selectAllPricing();
    }
    if (e.target && e.target.id === 'deselect-all-pricing') {
        deselectAllPricing();
    }
});

// Add smooth transition style
navItems.forEach(item => {
    item.style.transition = 'all 0.2s ease';
});

// Log when the page loads
console.log('Bulk Listing Editor loaded');
console.log('Navigation items initialized:', navItems.length);

// Idle time tracking
let lastActionTime = Date.now();
let totalIdleTime = 0;
const IDLE_THRESHOLD = 2000; // 2 seconds in milliseconds

function recordAction() {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime;

    // If more than 2 seconds have passed, count it as idle time
    if (timeSinceLastAction > IDLE_THRESHOLD) {
        const idleTime = timeSinceLastAction - IDLE_THRESHOLD;
        totalIdleTime += idleTime;
        console.log(`Idle for ${(idleTime / 1000).toFixed(2)}s. Total idle: ${(totalIdleTime / 1000).toFixed(2)}s`);
    }

    lastActionTime = now;
}

// Track various user actions
document.addEventListener('click', recordAction);
document.addEventListener('input', recordAction);
document.addEventListener('change', recordAction);
document.addEventListener('keydown', recordAction);

// Initialize tracking when page loads
window.addEventListener('load', function () {
    lastActionTime = Date.now();
    totalIdleTime = 0;
});

// Function to create a listing item
function createListingItem(index) {
    const item = document.createElement('div');
    item.className = 'listing-item';

    // Store creation timestamp on the element
    item.dataset.createdAt = Date.now();
    item.dataset.completedAt = '';

    // Store images array as data attribute
    item.dataset.images = JSON.stringify([]);

    item.innerHTML = `
        <div class="listing-thumbnail" data-has-image="false">
            <svg class="thumbnail-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <img class="thumbnail-image" style="display: none;" alt="Listing image">
            <div class="image-count-badge" style="display: none;"></div>
        </div>
        <div class="listing-fields">
            <input type="text" class="listing-input title-input" placeholder="Title">
            <input type="text" class="listing-input sku-input" placeholder="SKU">
            <input type="text" class="listing-input qty-input" placeholder="Quantity">
            <input type="text" class="listing-input price-input" placeholder="Price">
            <select class="listing-select condition-select">
                <option value="">Condition</option>
                <option value="Near Mint or Better">Near Mint or Better</option>
                <option value="Lightly Played (Excellent)">Lightly Played (Excellent)</option>
                <option value="Moderately Played (Very Good)">Moderately Played (Very Good)</option>
                <option value="Heavily Played (Poor)">Heavily Played (Poor)</option>
            </select>
            <select class="listing-select type-select">
                <option value="">Type</option>
                <option value="Trainer">Trainer</option>
                <option value="Trainer-Item">Trainer-Item</option>
                <option value="Trainer-Stadium">Trainer-Stadium</option>
                <option value="Trainer-Supporter">Trainer-Supporter</option>
                <option value="Technical Machine">Technical Machine</option>
                <option value="Pokémon">Pokémon</option>
                <option value="Energy-Basic">Energy-Basic</option>
                <option value="Energy-Special">Energy-Special</option>
            </select>
            <select class="listing-select finish-select">
                <option value="">Finish</option>
                <option value="Foil">Foil</option>
                <option value="Holo">Holo</option>
                <option value="Regular">Regular</option>
                <option value="Reverse Holo">Reverse Holo</option>
            </select>
            <select class="listing-select rarity-select">
                <option value="">Rarity</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="rare-holo">Rare Holo</option>
                <option value="rare-holo-ex">Rare Holo EX</option>
                <option value="rare-holo-gx">Rare Holo GX</option>
                <option value="rare-holo-v">Rare Holo V</option>
                <option value="rare-holo-vmax">Rare Holo VMAX</option>
                <option value="rare-holo-vstar">Rare Holo VSTAR</option>
                <option value="rare-ultra">Rare Ultra</option>
                <option value="rare-secret">Rare Secret</option>
                <option value="rare-rainbow">Rare Rainbow</option>
                <option value="amazing-rare">Amazing Rare</option>
                <option value="radiant-rare">Radiant Rare</option>
                <option value="promo">Promo</option>
            </select>
            <input type="text" class="listing-input character-input" placeholder="Character Name">
            <input type="text" class="listing-input set-input" placeholder="Set">
            <input type="text" class="listing-input card-number-input" placeholder="Card Number">
            <select class="listing-select specialty-select">
                <option value="">Specialty</option>
                <option value="BREAK">BREAK</option>
                <option value="EX">EX</option>
                <option value="GX">GX</option>
                <option value="LEGEND">LEGEND</option>
                <option value="Level Up">Level Up</option>
                <option value="MEGA">MEGA</option>
                <option value="PRIME">PRIME</option>
                <option value="Restored">Restored</option>
                <option value="SP">SP</option>
                <option value="TAG TEAM">TAG TEAM</option>
                <option value="V">V</option>
                <option value="VMAX">VMAX</option>
            </select>
            <select class="listing-select game-select">
                <option value="">Game</option>
                <option value="mtg">Magic: The Gathering</option>
                <option value="pokemon">Pokemon TCG</option>
                <option value="yugioh">Yu-Gi-Oh!</option>
                <option value="lorcana">Disney Lorcana</option>
                <option value="onepiece">One Piece</option>
            </select>
            <input type="text" class="listing-input description-input" placeholder="Description">
        </div>
        <button class="delete-btn" aria-label="Delete listing">
            <svg class="delete-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
        </button>
    `;

    // Add thumbnail click functionality - show carousel on click
    const thumbnail = item.querySelector('.listing-thumbnail');
    let currentListingItem = null; // Track which listing is being edited

    thumbnail.addEventListener('click', function (e) {
        // Get images array from data attribute
        const images = JSON.parse(item.dataset.images || '[]');

        if (images.length > 0) {
            // Show carousel with all images
            openCarousel(images, 0, item);
        } else {
            // Open image panel if no images
            openImagePanel(item);
        }
    });

    // Add delete functionality
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function () {
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        setTimeout(() => {
            item.remove();
        }, 200);
    });

    // Add select change handler to update text color and track timing
    const selectElements = item.querySelectorAll('.listing-select');

    selectElements.forEach(selectElement => {
        // Set initial color based on value
        if (selectElement.value === '') {
            selectElement.style.color = 'var(--text-dim)';
        } else {
            selectElement.style.color = 'var(--text)';
        }

        selectElement.addEventListener('change', function () {
            // Remove error state when user selects an option
            this.classList.remove('field-error');
            if (this.value === '') {
                this.style.color = 'var(--text-dim)';
            } else {
                this.style.color = 'var(--text)';
            }
            checkListingComplete(item);
            saveCurrentListings();
        });
    });

    // Add input event listeners to all fields to track start and check completion
    const titleInput = item.querySelector('.title-input');
    const skuInput = item.querySelector('.sku-input');
    const qtyInput = item.querySelector('.qty-input');
    const priceInput = item.querySelector('.price-input');
    const characterInput = item.querySelector('.character-input');
    const setInput = item.querySelector('.set-input');
    const cardNumberInput = item.querySelector('.card-number-input');
    const descriptionInput = item.querySelector('.description-input');

    const allInputs = [
        titleInput, skuInput, qtyInput, priceInput,
        characterInput, setInput, cardNumberInput, descriptionInput
    ];

    allInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function () {
                // Remove error state when user starts typing
                this.classList.remove('field-error');
                checkListingComplete(item);
                saveCurrentListings();
            });
        }
    });

    // Auto-fill character name, set, card number, and description from title
    if (titleInput && characterInput && setInput && cardNumberInput && descriptionInput) {
        titleInput.addEventListener('input', function () {
            const title = this.value.trim();

            // Extract first word for character name
            const firstWord = title.split(/\s+/)[0] || '';
            characterInput.value = firstWord;

            // Extract card number (pattern: ###/###)
            const cardNumberMatch = title.match(/(\d+\/\d+)/);
            if (cardNumberMatch) {
                cardNumberInput.value = cardNumberMatch[1];
            }

            // Extract set name (look for pattern starting with abbreviation followed by colon, like "SV:", "SV10:", "SHSH05:")
            let setName = '';
            if (cardNumberMatch) {
                const beforeCardNumber = title.substring(0, cardNumberMatch.index).trim();
                // Match pattern like "SV: White Flare", "SV10: Temporal Forces", "SHSH05: Battle Styles" etc.
                const setMatch = beforeCardNumber.match(/\b([A-Z]{2,}\d*:\s*.+?)$/);
                if (setMatch) {
                    setName = setMatch[1].trim();
                    setInput.value = setName;
                }
            }

            // Auto-fill description
            if (cardNumberMatch && setName) {
                // Get text before the set (e.g., "Blitzle Pokeball")
                const beforeSet = title.substring(0, title.indexOf(setName)).trim();
                const cardNumber = cardNumberMatch[1];

                // Get condition from end of title and convert to full name
                const conditionMap = {
                    'NM': 'Near Mint',
                    'LP': 'Lightly Played',
                    'MP': 'Moderately Played',
                    'HP': 'Heavily Played',
                    'DMG': 'Damaged'
                };

                // Look for condition at the end
                const afterCardNumber = title.substring(cardNumberMatch.index + cardNumber.length).trim();
                let conditionText = '';
                for (const [abbr, full] of Object.entries(conditionMap)) {
                    if (afterCardNumber.toUpperCase().includes(abbr)) {
                        conditionText = full;
                        break;
                    }
                }

                // Build description: "Blitzle Pokeball from SV: White Flare 031/086 Near Mint"
                descriptionInput.value = `${beforeSet} from ${setName} ${cardNumber}${conditionText ? ' ' + conditionText : ''}`;
            }
        });
    }

    // Restore saved data if available
    const savedListings = JSON.parse(localStorage.getItem('currentEditorListings') || '[]');
    if (savedListings[index]) {
        const saved = savedListings[index];
        if (titleInput) titleInput.value = saved.title || '';
        if (skuInput) skuInput.value = saved.sku || '';
        if (qtyInput) qtyInput.value = saved.qty || '';
        if (priceInput) priceInput.value = saved.price || '';
        if (characterInput) characterInput.value = saved.character || '';
        if (setInput) setInput.value = saved.set || '';
        if (cardNumberInput) cardNumberInput.value = saved.cardNumber || '';
        if (descriptionInput) descriptionInput.value = saved.description || '';

        const conditionSelect = item.querySelector('.condition-select');
        const typeSelect = item.querySelector('.type-select');
        const finishSelect = item.querySelector('.finish-select');
        const raritySelect = item.querySelector('.rarity-select');
        const specialtySelect = item.querySelector('.specialty-select');
        const gameSelect = item.querySelector('.game-select');

        if (conditionSelect) {
            conditionSelect.value = saved.condition || '';
            conditionSelect.style.color = saved.condition ? 'var(--text)' : 'var(--text-dim)';
        }
        if (typeSelect) {
            typeSelect.value = saved.type || '';
            typeSelect.style.color = saved.type ? 'var(--text)' : 'var(--text-dim)';
        }
        if (finishSelect) {
            finishSelect.value = saved.finish || '';
            finishSelect.style.color = saved.finish ? 'var(--text)' : 'var(--text-dim)';
        }
        if (raritySelect) {
            raritySelect.value = saved.rarity || '';
            raritySelect.style.color = saved.rarity ? 'var(--text)' : 'var(--text-dim)';
        }
        if (specialtySelect) {
            specialtySelect.value = saved.specialty || '';
            specialtySelect.style.color = saved.specialty ? 'var(--text)' : 'var(--text-dim)';
        }
        if (gameSelect) {
            gameSelect.value = saved.game || '';
            gameSelect.style.color = saved.game ? 'var(--text)' : 'var(--text-dim)';
        }

        // Restore images if available
        if (saved.images && Array.isArray(saved.images)) {
            item.dataset.images = JSON.stringify(saved.images);
            updateListingThumbnail(item);
        } else if (saved.image) {
            // Legacy support: convert single image to array
            item.dataset.images = JSON.stringify([saved.image]);
            updateListingThumbnail(item);
        }
    }

    return item;
}

// Function to save current listings to localStorage
function saveCurrentListings() {
    const container = document.getElementById('listings-container');
    if (!container) return;

    const listingItems = container.querySelectorAll('.listing-item');
    const listings = Array.from(listingItems).map(item => ({
        title: item.querySelector('.title-input')?.value || '',
        sku: item.querySelector('.sku-input')?.value || '',
        qty: item.querySelector('.qty-input')?.value || '',
        price: item.querySelector('.price-input')?.value || '',
        condition: item.querySelector('.condition-select')?.value || '',
        type: item.querySelector('.type-select')?.value || '',
        finish: item.querySelector('.finish-select')?.value || '',
        rarity: item.querySelector('.rarity-select')?.value || '',
        character: item.querySelector('.character-input')?.value || '',
        set: item.querySelector('.set-input')?.value || '',
        cardNumber: item.querySelector('.card-number-input')?.value || '',
        specialty: item.querySelector('.specialty-select')?.value || '',
        game: item.querySelector('.game-select')?.value || '',
        description: item.querySelector('.description-input')?.value || '',
        images: JSON.parse(item.dataset.images || '[]')
    }));

    localStorage.setItem('currentEditorListings', JSON.stringify(listings));
}

// Function to check if a listing row is complete and add visual indicator
function checkListingComplete(listingItem) {
    const titleInput = listingItem.querySelector('.title-input');
    const skuInput = listingItem.querySelector('.sku-input');
    const priceInput = listingItem.querySelector('.price-input');
    const qtyInput = listingItem.querySelector('.qty-input');
    const descriptionInput = listingItem.querySelector('.description-input');
    const conditionSelect = listingItem.querySelector('.condition-select');
    const typeSelect = listingItem.querySelector('.type-select');
    const finishSelect = listingItem.querySelector('.finish-select');
    const raritySelect = listingItem.querySelector('.rarity-select');
    const characterInput = listingItem.querySelector('.character-input');
    const setInput = listingItem.querySelector('.set-input');
    const cardNumberInput = listingItem.querySelector('.card-number-input');
    const specialtySelect = listingItem.querySelector('.specialty-select');
    const gameSelect = listingItem.querySelector('.game-select');

    // Check if all fields are filled
    const isComplete = titleInput?.value.trim() !== '' &&
        skuInput?.value.trim() !== '' &&
        priceInput?.value.trim() !== '' &&
        qtyInput?.value.trim() !== '' &&
        descriptionInput?.value.trim() !== '' &&
        conditionSelect?.value !== '' &&
        typeSelect?.value !== '' &&
        finishSelect?.value !== '' &&
        raritySelect?.value !== '' &&
        characterInput?.value.trim() !== '' &&
        setInput?.value.trim() !== '' &&
        cardNumberInput?.value.trim() !== '' &&
        gameSelect?.value !== '';

    if (isComplete) {
        // Add visual indicator that listing is complete
        listingItem.classList.add('listing-complete');

        // Remove error state from all fields when complete
        const allFields = [
            titleInput, skuInput, priceInput, qtyInput, descriptionInput,
            conditionSelect, typeSelect, finishSelect, raritySelect,
            characterInput, setInput, cardNumberInput, specialtySelect, gameSelect
        ];
        allFields.forEach(field => {
            if (field) field.classList.remove('field-error');
        });
    } else {
        // Remove complete indicator if fields are incomplete
        listingItem.classList.remove('listing-complete');
    }
}

// Store uploaded photos for distribution
let uploadedPhotos = [];

// Photo upload handling
const uploadBox = document.querySelector('.upload-box');
const fileInput = document.querySelector('.file-input');

if (uploadBox && fileInput) {
    // Make upload box clickable
    uploadBox.addEventListener('click', function (e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', async function (e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Show progress
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = progressContainer?.querySelector('.progress-text');

        if (progressContainer) {
            progressContainer.style.display = 'block';
            if (progressText) {
                progressText.textContent = `Uploading ${files.length} images to ImgBB...`;
            }
        }

        // Upload all files to ImgBB
        const uploadPromises = files.map((file, index) => {
            return uploadToImgBB(file).then(url => {
                // Update progress
                if (progressFill) {
                    const progress = ((index + 1) / files.length) * 100;
                    progressFill.style.width = progress + '%';
                }
                return url;
            }).catch(error => {
                console.error(`Failed to upload ${file.name}:`, error);
                return null;
            });
        });

        try {
            const urls = await Promise.all(uploadPromises);
            uploadedPhotos = urls.filter(url => url !== null);

            // Update upload box to show success
            const uploadText = uploadBox.querySelector('.upload-text');
            if (uploadText) {
                uploadText.textContent = `${uploadedPhotos.length} photos ready`;
                uploadText.style.color = 'var(--positive)';
            }

            // Hide progress after brief delay
            setTimeout(() => {
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                    progressFill.style.width = '0%';
                }
            }, 1000);

        } catch (error) {
            alert('Some images failed to upload. Please try again.');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }
    });
}

// Continue button - Generate listings and switch to editor
const continueBtn = document.getElementById('continue-to-editor');
if (continueBtn) {
    continueBtn.addEventListener('click', function () {
        // Get all required input fields
        const numListingsInput = document.querySelector('input[placeholder="Num. Listings"]');
        const conditionSelect = document.getElementById('batch-condition-select');
        const minPriceInput = document.querySelector('input[placeholder="Min. Price"]');
        const finishSelect = document.getElementById('batch-finish-select');
        const categorySelect = document.getElementById('batch-category-select');

        // Check which fields are empty (game, condition, and finish are now required)
        const emptyFields = [];
        [numListingsInput, minPriceInput].forEach(input => {
            if (input && input.value.trim() === '') {
                emptyFields.push(input);
            }
        });

        // Check if game is selected
        if (categorySelect && categorySelect.value === '') {
            emptyFields.push(categorySelect);
        }

        // Check if condition is selected
        if (conditionSelect && conditionSelect.value === '') {
            emptyFields.push(conditionSelect);
        }

        // Check if finish is selected
        if (finishSelect && finishSelect.value === '') {
            emptyFields.push(finishSelect);
        }

        // If any fields are empty, shake them and don't continue
        if (emptyFields.length > 0) {
            emptyFields.forEach(input => {
                input.classList.add('shake', 'field-error');
                // Remove shake animation class after animation completes
                setTimeout(() => {
                    input.classList.remove('shake');
                }, 500);
            });
            return; // Don't proceed to editor
        }

        const numListings = parseInt(numListingsInput?.value) || 7;

        // Capture batch title/SKU
        const batchTitleInput = document.getElementById('batch-title-input');
        currentBatchTitle = batchTitleInput?.value || '';

        // Reset current batch index (we're creating a new batch)
        currentBatchIndex = null;

        // Generate listing items
        const container = document.getElementById('listings-container');
        container.innerHTML = ''; // Clear existing items

        // Get selected game, condition, and finish
        const selectedGame = categorySelect?.value || '';
        const selectedCondition = conditionSelect?.value || '';
        const selectedFinish = finishSelect?.value || '';
        const minPrice = minPriceInput?.value || '';

        // Generate listings
        const listingItems = [];

        for (let i = 0; i < numListings; i++) {
            const item = createListingItem(i);

            // Auto-fill game field and disable it
            if (selectedGame) {
                const gameSelect = item.querySelector('.game-select');
                if (gameSelect) {
                    gameSelect.value = selectedGame;
                    gameSelect.style.color = 'var(--text)';
                    gameSelect.disabled = true;
                    gameSelect.style.cursor = 'not-allowed';
                    gameSelect.style.opacity = '0.7';
                }
            }

            // Auto-fill condition field and disable it
            if (selectedCondition) {
                const conditionSelect = item.querySelector('.condition-select');
                if (conditionSelect) {
                    // Map batch condition values to listing condition values
                    const conditionMap = {
                        'Near Mint or better': 'Near Mint or Better',
                        'Lightly Played or better': 'Lightly Played (Excellent)',
                        'Moderately Played': 'Moderately Played (Very Good)',
                        'Heavily Played': 'Heavily Played (Poor)'
                    };
                    const mappedCondition = conditionMap[selectedCondition] || selectedCondition;
                    conditionSelect.value = mappedCondition;
                    conditionSelect.style.color = 'var(--text)';
                    conditionSelect.disabled = true;
                    conditionSelect.style.cursor = 'not-allowed';
                    conditionSelect.style.opacity = '0.7';
                }
            }

            // Auto-fill finish field and disable it
            if (selectedFinish) {
                const finishSelectElement = item.querySelector('.finish-select');
                if (finishSelectElement) {
                    finishSelectElement.value = selectedFinish;
                    finishSelectElement.style.color = 'var(--text)';
                    finishSelectElement.disabled = true;
                    finishSelectElement.style.cursor = 'not-allowed';
                    finishSelectElement.style.opacity = '0.7';
                }
            }

            // Auto-fill price field
            if (minPrice) {
                const priceInput = item.querySelector('.price-input');
                if (priceInput) {
                    priceInput.value = minPrice;
                }
            }

            // Initialize empty images array
            item.dataset.images = JSON.stringify([]);

            container.appendChild(item);
            listingItems.push(item);
        }

        // Distribute photos sequentially based on photos/listings ratio
        const photosPerListing = Math.floor(uploadedPhotos.length / numListings);
        let photoIndex = 0;

        for (let i = 0; i < numListings && photoIndex < uploadedPhotos.length; i++) {
            const item = listingItems[i];
            const images = [];

            // Add photosPerListing photos to this listing
            for (let j = 0; j < photosPerListing && photoIndex < uploadedPhotos.length; j++) {
                images.push(uploadedPhotos[photoIndex]);
                photoIndex++;
            }

            item.dataset.images = JSON.stringify(images);
        }

        // Update all thumbnails after distribution
        listingItems.forEach(item => {
            updateListingThumbnail(item);
        });

        // Clear uploaded photos after distribution
        uploadedPhotos = [];

        // Reset upload box text
        const uploadText = uploadBox?.querySelector('.upload-text');
        if (uploadText) {
            uploadText.textContent = 'Import Photos';
            uploadText.style.color = '';
        }


        // Populate editor title field
        const editorTitleInput = document.getElementById('editor-title-input');
        if (editorTitleInput) {
            editorTitleInput.value = currentBatchTitle;
        }

        // Disable continue button and show progress bar
        continueBtn.disabled = true;
        continueBtn.style.opacity = '0.5';
        continueBtn.style.cursor = 'not-allowed';

        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        if (progressContainer && progressFill) {
            progressContainer.style.display = 'block';

            // Animate progress bar over 2 seconds
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                progressFill.style.width = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 100); // Update every 100ms to reach 100% in 2000ms
        }

        // Switch to editor screen after 2 second delay
        setTimeout(() => {
            switchScreen('editor');
            console.log(`Generated ${numListings} listing items`);

            // Hide progress bar and reset
            if (progressContainer && progressFill) {
                progressContainer.style.display = 'none';
                progressFill.style.width = '0%';
            }

            // Re-enable button
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
        }, 2000);
    });
}

// Batches storage
const defaultBatches = [];

// Load batches from localStorage or use empty array
let batches = JSON.parse(localStorage.getItem('batches') || '[]');
let currentBatchListings = [];
let currentBatchIndex = null; // Track which batch is being edited
let currentBatchTitle = ''; // Track the title/SKU for the current batch

// Function to save batches to localStorage
function saveBatches() {
    localStorage.setItem('batches', JSON.stringify(batches));
    console.log('Batches saved to localStorage');
}

// Function to create a batch card
function createBatchCard(batch, index) {
    const card = document.createElement('div');
    card.className = 'batch-card';
    card.setAttribute('data-batch-id', index);

    // Get first image from batch listings
    let firstImage = '';
    if (batch.listings && batch.listings.length > 0) {
        for (const listing of batch.listings) {
            // Check images array first
            if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                const validImage = listing.images.find(img => img && img.startsWith('http'));
                if (validImage) {
                    firstImage = validImage;
                    break;
                }
            }
            // Legacy support for old single image property
            else if (listing.image && listing.image.startsWith('http')) {
                firstImage = listing.image;
                break;
            }
        }
    }

    card.innerHTML = `
        <div class="batch-card-content">
            <div class="batch-thumbnail">
                ${firstImage ?
            `<img class="batch-thumbnail-image" src="${firstImage}" alt="Batch preview">` :
            `<svg class="batch-thumbnail-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>`
        }
            </div>
            <div class="batch-info">
                <div class="batch-name">${batch.title || `Batch ${index + 1}`}</div>
                <div class="batch-count">${batch.listings ? batch.listings.length : 0} items</div>
            </div>
            <div class="batch-actions">
                <span class="batch-label batch-export-btn">Export</span>
                <button class="batch-delete-btn" data-batch-id="${index}" aria-label="Delete batch">
                    <svg class="batch-delete-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    // Add click handler for opening batch
    card.addEventListener('click', function (e) {
        if (!e.target.closest('.batch-delete-btn') && !e.target.closest('.batch-export-btn')) {
            openBatch(index);
        }
    });

    // Add delete button handler
    const deleteBtn = card.querySelector('.batch-delete-btn');
    deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showDeleteConfirmation(index);
    });

    // Add export button handler
    const exportBtn = card.querySelector('.batch-export-btn');
    exportBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showExportModal();
    });

    return card;
}

// Function to render all batches
function renderBatches() {
    const grid = document.getElementById('batches-grid');
    grid.innerHTML = '';

    batches.forEach((batch, index) => {
        grid.appendChild(createBatchCard(batch, index));
    });
}

// Function to open a batch (return to editor)
function openBatch(batchIndex) {
    const batch = batches[batchIndex];
    if (!batch) return;

    // Set the current batch index so we know we're editing an existing batch
    currentBatchIndex = batchIndex;
    currentBatchTitle = batch.title || '';

    // Populate editor title field
    const editorTitleInput = document.getElementById('editor-title-input');
    if (editorTitleInput) {
        editorTitleInput.value = currentBatchTitle;
    }

    // Regenerate listings in the editor
    const container = document.getElementById('listings-container');
    container.innerHTML = '';

    batch.listings.forEach((listing, index) => {
        const item = createListingItem(index);

        // Populate the listing item with saved data
        const titleInput = item.querySelector('.title-input');
        const skuInput = item.querySelector('.sku-input');
        const priceInput = item.querySelector('.price-input');
        const qtyInput = item.querySelector('.qty-input');
        const descInput = item.querySelector('.description-input');
        const conditionSelect = item.querySelector('.condition-select');
        const typeSelect = item.querySelector('.type-select');
        const finishSelect = item.querySelector('.finish-select');
        const raritySelect = item.querySelector('.rarity-select');
        const characterInput = item.querySelector('.character-input');
        const setInput = item.querySelector('.set-input');
        const specialtySelect = item.querySelector('.specialty-select');
        const gameSelect = item.querySelector('.game-select');

        if (titleInput && listing.title) titleInput.value = listing.title;
        if (skuInput && listing.sku) skuInput.value = listing.sku;
        if (priceInput && listing.price) priceInput.value = listing.price;
        if (qtyInput && listing.qty) qtyInput.value = listing.qty;
        if (descInput && listing.description) descInput.value = listing.description;
        if (characterInput && listing.character) characterInput.value = listing.character;
        if (setInput && listing.set) setInput.value = listing.set;

        const cardNumberInput = item.querySelector('.card-number-input');
        if (cardNumberInput && listing.cardNumber) cardNumberInput.value = listing.cardNumber;

        if (conditionSelect && listing.condition) {
            conditionSelect.value = listing.condition;
            conditionSelect.style.color = 'var(--text)';
        }
        if (typeSelect && listing.type) {
            typeSelect.value = listing.type;
            typeSelect.style.color = 'var(--text)';
        }
        if (finishSelect && listing.finish) {
            finishSelect.value = listing.finish;
            finishSelect.style.color = 'var(--text)';
        }
        if (raritySelect && listing.rarity) {
            raritySelect.value = listing.rarity;
            raritySelect.style.color = 'var(--text)';
        }
        if (specialtySelect && listing.specialty) {
            specialtySelect.value = listing.specialty;
            specialtySelect.style.color = 'var(--text)';
        }
        if (gameSelect && listing.game) {
            gameSelect.value = listing.game;
            gameSelect.style.color = 'var(--text)';
            gameSelect.disabled = true;
            gameSelect.style.cursor = 'not-allowed';
            gameSelect.style.opacity = '0.7';
        }

        // Restore images if available
        if (listing.images && Array.isArray(listing.images)) {
            item.dataset.images = JSON.stringify(listing.images);
            updateListingThumbnail(item);
        } else if (listing.image) {
            // Legacy support: convert single image to array
            item.dataset.images = JSON.stringify([listing.image]);
            updateListingThumbnail(item);
        }

        container.appendChild(item);
    });

    currentBatchListings = [...batch.listings];

    // Switch to editor screen
    switchScreen('editor');

    console.log(`Opened batch ${batchIndex}`);
}

// Delete confirmation modal
let batchToDelete = null;
const modal = document.getElementById('delete-modal');
const modalCancel = document.getElementById('modal-cancel');
const modalDelete = document.getElementById('modal-delete');

function showDeleteConfirmation(batchIndex) {
    batchToDelete = batchIndex;
    modal.classList.add('active');
}

function hideDeleteConfirmation() {
    modal.classList.remove('active');
    batchToDelete = null;
}

modalCancel.addEventListener('click', hideDeleteConfirmation);

modalDelete.addEventListener('click', function () {
    if (batchToDelete !== null) {
        batches.splice(batchToDelete, 1);
        saveBatches();
        renderBatches();
        hideDeleteConfirmation();
        console.log(`Deleted batch ${batchToDelete}`);
    }
});

// Close modal when clicking outside
modal.addEventListener('click', function (e) {
    if (e.target === modal) {
        hideDeleteConfirmation();
    }
});

// Save and Quit button - Save batch and go to batches screen
const saveQuitBtn = document.getElementById('save-quit-btn');
if (saveQuitBtn) {
    saveQuitBtn.addEventListener('click', function () {
        // Capture current listings
        const container = document.getElementById('listings-container');
        const listingItems = container.querySelectorAll('.listing-item');

        // Capture batch title from editor
        const editorTitleInput = document.getElementById('editor-title-input');
        currentBatchTitle = editorTitleInput?.value || '';

        const savedListings = Array.from(listingItems).map((item) => {
            return {
                title: item.querySelector('.title-input')?.value || '',
                sku: item.querySelector('.sku-input')?.value || '',
                price: item.querySelector('.price-input')?.value || '',
                qty: item.querySelector('.qty-input')?.value || '',
                description: item.querySelector('.description-input')?.value || '',
                condition: item.querySelector('.condition-select')?.value || '',
                type: item.querySelector('.type-select')?.value || '',
                finish: item.querySelector('.finish-select')?.value || '',
                rarity: item.querySelector('.rarity-select')?.value || '',
                character: item.querySelector('.character-input')?.value || '',
                set: item.querySelector('.set-input')?.value || '',
                cardNumber: item.querySelector('.card-number-input')?.value || '',
                specialty: item.querySelector('.specialty-select')?.value || '',
                game: item.querySelector('.game-select')?.value || '',
                images: JSON.parse(item.dataset.images || '[]')
            };
        });

        // Check if we're editing an existing batch or creating a new one
        if (currentBatchIndex !== null) {
            // Update existing batch
            batches[currentBatchIndex].listings = savedListings;
            batches[currentBatchIndex].timestamp = new Date().toISOString();
            // Update title if it was changed
            if (currentBatchTitle) {
                batches[currentBatchIndex].title = currentBatchTitle;
            }
            console.log(`Updated existing batch ${currentBatchIndex}`);
        } else {
            // Create new batch
            batches.push({
                id: Date.now(),
                title: currentBatchTitle,
                listings: savedListings,
                timestamp: new Date().toISOString()
            });
            console.log('Created new batch');
        }
        saveBatches();

        // Reset current batch index and title
        currentBatchIndex = null;
        currentBatchTitle = '';

        // Show loading spinner
        const loadingOverlay = document.getElementById('save-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Render batches and switch to batches screen after 1 second delay
        setTimeout(() => {
            renderBatches();
            switchScreen('batches');
            console.log('Switched to batches screen');

            // Hide loading spinner
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }, 1000);
    });
}

// Export Modal functionality
const exportModal = document.getElementById('export-modal');
const exportDoneBtn = document.getElementById('export-done-btn');

function showExportModal() {
    exportModal.classList.add('active');
    exportDoneBtn.disabled = true;

    // Reset progress bar animation
    const progressFill = document.querySelector('.export-progress-fill');
    progressFill.style.animation = 'none';
    setTimeout(() => {
        progressFill.style.animation = 'fillProgress 2s ease-out forwards';
    }, 10);

    // Enable Done button after 2 seconds (when export completes)
    setTimeout(() => {
        exportDoneBtn.disabled = false;
    }, 2000);
}

function hideExportModal() {
    exportModal.classList.remove('active');
}

// Export button click handler - find all export buttons
document.addEventListener('click', function (e) {
    if (e.target.closest('.export-btn')) {
        e.stopPropagation();

        // If we're in the editor screen, save the batch first
        const editorScreen = document.getElementById('editor-screen');
        if (editorScreen && editorScreen.classList.contains('active')) {
            // Capture current listings
            const container = document.getElementById('listings-container');
            const listingItems = container.querySelectorAll('.listing-item');

            // Check for empty fields in all listings
            const emptyFields = [];
            listingItems.forEach((item) => {
                const titleInput = item.querySelector('.title-input');
                const skuInput = item.querySelector('.sku-input');
                const priceInput = item.querySelector('.price-input');
                const qtyInput = item.querySelector('.qty-input');
                const descriptionInput = item.querySelector('.description-input');
                const conditionSelect = item.querySelector('.condition-select');
                const typeSelect = item.querySelector('.type-select');
                const finishSelect = item.querySelector('.finish-select');
                const raritySelect = item.querySelector('.rarity-select');
                const characterInput = item.querySelector('.character-input');
                const setInput = item.querySelector('.set-input');
                const cardNumberInput = item.querySelector('.card-number-input');
                const specialtySelect = item.querySelector('.specialty-select');
                const gameSelect = item.querySelector('.game-select');

                if (titleInput?.value.trim() === '') emptyFields.push(titleInput);
                if (skuInput?.value.trim() === '') emptyFields.push(skuInput);
                if (priceInput?.value.trim() === '') emptyFields.push(priceInput);
                if (qtyInput?.value.trim() === '') emptyFields.push(qtyInput);
                if (descriptionInput?.value.trim() === '') emptyFields.push(descriptionInput);
                if (conditionSelect?.value === '') emptyFields.push(conditionSelect);
                if (typeSelect?.value === '') emptyFields.push(typeSelect);
                if (finishSelect?.value === '') emptyFields.push(finishSelect);
                if (raritySelect?.value === '') emptyFields.push(raritySelect);
                if (characterInput?.value.trim() === '') emptyFields.push(characterInput);
                if (setInput?.value.trim() === '') emptyFields.push(setInput);
                if (cardNumberInput?.value.trim() === '') emptyFields.push(cardNumberInput);
                if (specialtySelect?.value === '') emptyFields.push(specialtySelect);
                if (gameSelect?.value === '') emptyFields.push(gameSelect);
            });

            // If any fields are empty, shake them and don't export
            if (emptyFields.length > 0) {
                emptyFields.forEach(field => {
                    field.classList.add('shake', 'field-error');
                    setTimeout(() => {
                        field.classList.remove('shake');
                    }, 500);
                });
                return; // Don't proceed with export
            }

            const savedListings = Array.from(listingItems).map((item) => {
                return {
                    title: item.querySelector('.title-input')?.value || '',
                    sku: item.querySelector('.sku-input')?.value || '',
                    price: item.querySelector('.price-input')?.value || '',
                    qty: item.querySelector('.qty-input')?.value || '',
                    description: item.querySelector('.description-input')?.value || '',
                    condition: item.querySelector('.condition-select')?.value || '',
                    type: item.querySelector('.type-select')?.value || '',
                    finish: item.querySelector('.finish-select')?.value || '',
                    rarity: item.querySelector('.rarity-select')?.value || '',
                    character: item.querySelector('.character-input')?.value || '',
                    set: item.querySelector('.set-input')?.value || '',
                    cardNumber: item.querySelector('.card-number-input')?.value || '',
                    specialty: item.querySelector('.specialty-select')?.value || '',
                    game: item.querySelector('.game-select')?.value || '',
                    images: JSON.parse(item.dataset.images || '[]')
                };
            });

            // Check if we're editing an existing batch or creating a new one
            if (currentBatchIndex !== null) {
                // Update existing batch
                batches[currentBatchIndex].listings = savedListings;
                batches[currentBatchIndex].timestamp = new Date().toISOString();
                console.log(`Updated existing batch ${currentBatchIndex} before export`);
            } else {
                // Create new batch
                batches.push({
                    id: Date.now(),
                    listings: savedListings,
                    timestamp: new Date().toISOString()
                });
                console.log('Created new batch before export');
            }
            saveBatches();

            // Reset current batch index
            currentBatchIndex = null;
        }

        // Generate and download CSV
        generateAndDownloadCSV();
    }
});

// Function to generate and download CSV file for eBay
function generateAndDownloadCSV() {
    // Get all listings from current batch or all batches
    let allListings = [];

    const editorScreen = document.getElementById('editor-screen');
    if (editorScreen && editorScreen.classList.contains('active')) {
        // Export from editor screen - get current listings
        const container = document.getElementById('listings-container');
        const listingItems = container.querySelectorAll('.listing-item');
        allListings = Array.from(listingItems).map((item) => ({
            title: item.querySelector('.title-input')?.value || '',
            sku: item.querySelector('.sku-input')?.value || '',
            price: item.querySelector('.price-input')?.value || '',
            qty: item.querySelector('.qty-input')?.value || '',
            description: item.querySelector('.description-input')?.value || '',
            condition: item.querySelector('.condition-select')?.value || '',
            type: item.querySelector('.type-select')?.value || '',
            finish: item.querySelector('.finish-select')?.value || '',
            rarity: item.querySelector('.rarity-select')?.value || '',
            character: item.querySelector('.character-input')?.value || '',
            set: item.querySelector('.set-input')?.value || '',
            cardNumber: item.querySelector('.card-number-input')?.value || '',
            specialty: item.querySelector('.specialty-select')?.value || '',
            game: item.querySelector('.game-select')?.value || '',
            images: JSON.parse(item.dataset.images || '[]')
        }));
    } else {
        // Export all batches
        batches.forEach(batch => {
            if (batch.listings) {
                allListings.push(...batch.listings);
            }
        });
    }

    if (allListings.length === 0) {
        alert('No listings to export!');
        return;
    }

    // eBay template header - exact copy from template.csv
    const headerLine = '*Action(SiteID=US|Country=US|Currency=USD|Version=1193|CC=UTF-8),CustomLabel,*Category,StoreCategory,*Title,Subtitle,Relationship,RelationshipDetails,ScheduleTime,*ConditionID,CD:Professional Grader - (ID: 27501),CD:Grade - (ID: 27502),CDA:Certification Number - (ID: 27503),CD:Card Condition - (ID: 40001),*C:Game,C:Card Name,C:Character,C:Grade,C:Card Type,C:Speciality,C:Age Level,C:Set,C:Rarity,C:Features,C:Manufacturer,C:Language,C:Finish,C:Attribute/MTG:Color,C:Creature/Monster Type,C:Autographed,C:Card Number,C:Stage,C:Card Size,C:Year Manufactured,C:Graded,C:Professional Grader,C:Card Condition,C:Material,C:Vintage,C:Country of Origin,C:Signed By,C:Convention/Event,C:Franchise,C:Autograph Format,C:Autograph Authentication,C:Certification Number,C:Illustrator,C:HP,C:Attack/Power,C:Defense/Toughness,C:California Prop 65 Warning,C:Cost,C:Autograph Authentication Number,C:Customized,PicURL,GalleryType,VideoID,*Description,*Format,*Duration,*StartPrice,BuyItNowPrice,BestOfferEnabled,BestOfferAutoAcceptPrice,MinimumBestOfferPrice,*Quantity,ImmediatePayRequired,*Location,ShippingType,ShippingService-1:Option,ShippingService-1:Cost,ShippingService-2:Option,ShippingService-2:Cost,*DispatchTimeMax,PromotionalShippingDiscount,ShippingDiscountProfileID,*ReturnsAcceptedOption,ReturnsWithinOption,RefundOption,ShippingCostPaidByOption,AdditionalDetails,ShippingProfileName,ReturnProfileName,PaymentProfileName,ProductCompliancePolicyID,Regional ProductCompliancePolicies,Product Safety Pictograms,Product Safety Statements,Product Safety Component,Regulatory Document Ids,Manufacturer Name,Manufacturer AddressLine1,Manufacturer AddressLine2,Manufacturer City,Manufacturer Country,Manufacturer PostalCode,Manufacturer StateOrProvince,Manufacturer Phone,Manufacturer Email,Manufacturer ContactURL,Responsible Person 1,Responsible Person 1 Type,Responsible Person 1 AddressLine1,Responsible Person 1 AddressLine2,Responsible Person 1 City,Responsible Person 1 Country,Responsible Person 1 PostalCode,Responsible Person 1 StateOrProvince,Responsible Person 1 Phone,Responsible Person 1 Email,Responsible Person 1 ContactURL';

    // Split to get column names
    const columns = headerLine.split(',');
    const totalColumns = columns.length;

    let csvContent = headerLine + '\n';

    // Map condition to eBay condition ID
    const conditionMap = {
        'Near Mint or Better': '3000',
        'Lightly Played (Excellent)': '4000',
        'Moderately Played (Very Good)': '5000',
        'Heavily Played (Poor)': '6000'
    };

    // Add each listing as a row
    allListings.forEach(listing => {
        // Debug: Log listing to check images property
        console.log('Exporting listing:', listing.title, 'Images:', listing.images);

        // Create empty row with correct number of columns
        const row = new Array(totalColumns).fill('');

        // Fill in the columns we have data for
        const conditionID = conditionMap[listing.condition] || '';

        // Find and fill columns by name
        columns.forEach((colName, index) => {
            switch (colName) {
                case '*Action(SiteID=US|Country=US|Currency=USD|Version=1193|CC=UTF-8)':
                    row[index] = 'Add';
                    break;
                case 'CustomLabel':
                    row[index] = escapeCSV(listing.sku);
                    break;
                case '*Category':
                    row[index] = '183454';  // Trading Card Games
                    break;
                case '*Title':
                    row[index] = escapeCSV(listing.title);
                    break;
                case '*ConditionID':
                    row[index] = '4000';
                    break;
                case '*C:Game':
                    // Map game values to eBay format
                    const gameMap = {
                        'pokemon': 'Pokémon TCG',
                        'mtg': 'Magic: The Gathering',
                        'yugioh': 'Yu-Gi-Oh!',
                        'lorcana': 'Disney Lorcana',
                        'onepiece': 'One Piece'
                    };
                    row[index] = escapeCSV(gameMap[listing.game] || listing.game);
                    break;
                case 'C:Card Name':
                    // Leave card name empty
                    row[index] = '';
                    break;
                case 'C:Character':
                    row[index] = escapeCSV(listing.character);
                    break;
                case 'C:Card Type':
                    row[index] = escapeCSV(listing.type);
                    break;
                case 'C:Speciality':
                    row[index] = escapeCSV(listing.specialty);
                    break;
                case 'C:Set':
                    row[index] = escapeCSV(listing.set);
                    break;
                case 'C:Rarity':
                    row[index] = escapeCSV(listing.rarity);
                    break;
                case 'C:Finish':
                    row[index] = escapeCSV(listing.finish);
                    break;
                case 'C:Card Number':
                    row[index] = escapeCSV(listing.cardNumber);
                    break;
                case 'CD:Card Condition - (ID: 40001)':
                    // Map condition to eBay condition descriptor with ID
                    const conditionDescriptorMap = {
                        'Near Mint or Better': 'Near mint or better - (ID: 400010)',
                        'Lightly Played (Excellent)': 'Lightly played (Excellent) - (ID: 400015)',
                        'Moderately Played (Very Good)': 'Moderately played (Very good) - (ID: 400016)',
                        'Heavily Played (Poor)': 'Heavily played (Poor) - (ID: 400017)'
                    };
                    row[index] = conditionDescriptorMap[listing.condition] || '';
                    break;
                case 'PicURL':
                    // Export all images separated by pipe (|) character
                    const images = listing.images || [];
                    const validImages = images.filter(img => img && !img.startsWith('data:'));
                    if (validImages.length > 0) {
                        row[index] = escapeCSV(validImages.join('|'));
                    } else {
                        row[index] = '';
                    }
                    break;
                case '*Description':
                    row[index] = escapeCSV(listing.description);
                    break;
                case '*Format':
                    row[index] = 'FixedPrice';
                    break;
                case '*Duration':
                    row[index] = 'GTC';
                    break;
                case '*StartPrice':
                    row[index] = listing.price;
                    break;
                case '*Quantity':
                    row[index] = listing.qty;
                    break;
                case '*Location':
                    row[index] = 'United States';
                    break;
                case '*DispatchTimeMax':
                    row[index] = '3';
                    break;
                case '*ReturnsAcceptedOption':
                    row[index] = 'ReturnsAccepted';
                    break;
                case 'ShippingProfileName':
                    row[index] = 'Free Domestic Shipping';
                    break;
                case 'ReturnProfileName':
                    row[index] = 'All returns allowed within 30 days';
                    break;
                case 'PaymentProfileName':
                    row[index] = 'Card Payment';
                    break;
            }
        });

        csvContent += row.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `ebay-listings-${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exported ${allListings.length} listings to ${filename}`);
}

// Helper function to escape CSV values
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    value = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

// Done button closes modal and returns to batches
exportDoneBtn.addEventListener('click', function () {
    hideExportModal();
    switchScreen('images');

    // Update nav items if needed
    navItems.forEach(nav => nav.classList.remove('active'));
    const imagesNav = document.querySelector('[data-screen="images"]');
    if (imagesNav) {
        imagesNav.classList.add('active');
    }

    console.log('Export completed, returned to batches');
});

// Close export modal when clicking outside (optional)
exportModal.addEventListener('click', function (e) {
    if (e.target === exportModal && !exportDoneBtn.disabled) {
        hideExportModal();
        switchScreen('batches');
    }
});

// Analytics Screen Functionality
function createAnalyticsCard(data, index) {
    const card = document.createElement('div');
    card.className = 'analytics-card';
    card.dataset.index = index;
    // store batch/listing indexes for editing
    if (typeof data.batchIndex !== 'undefined') card.dataset.batch = data.batchIndex;
    if (typeof data.listingIndex !== 'undefined') card.dataset.listing = data.listingIndex;

    const isPositive = data.percentage >= 0;
    const sign = isPositive ? '+' : '';

    card.innerHTML = `
        <div class="analytics-card-content">
            <div class="analytics-checkbox"></div>
            <div class="analytics-image">
                <svg class="analytics-image-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
            </div>
            <div class="analytics-percentage-value ${isPositive ? 'positive' : 'negative'}">
                ${sign}${data.percentage}%
            </div>
        </div>
    `;

    // Toggle selection on click
    card.addEventListener('click', function () {
        this.classList.toggle('selected');
        updatePricingSelectedCount();
    });

    return card;
}

// Function to populate analytics grid
function populateAnalyticsGrid(timePeriod = 'Month') {
    const analyticsGrid = document.getElementById('analytics-grid');
    const analyticsPercentageElement = document.querySelector('.analytics-percentage');
    if (!analyticsGrid) return;

    // Clear existing cards
    analyticsGrid.innerHTML = '';

    // Define different ranges for each time period
    const ranges = {
        'Week': { min: -1, max: 3 },      // Smaller changes for week
        'Month': { min: -2.5, max: 5 },    // Medium changes for month
        '6 Months': { min: -5, max: 10 },  // Larger changes for 6 months
        'Year': { min: -10, max: 20 }      // Largest changes for year
    };

    const range = ranges[timePeriod] || ranges['Month'];

    // Get all listings from all batches and keep mapping to original listing
    const allListings = [];
    batches.forEach((batch, bIdx) => {
        if (batch.listings && batch.listings.length > 0) {
            batch.listings.forEach((listing, lIdx) => {
                // Generate random percentage based on time period
                const percentage = (Math.random() * (range.max - range.min) + range.min).toFixed(2);
                allListings.push({
                    percentage: parseFloat(percentage),
                    batchIndex: bIdx,
                    listingIndex: lIdx,
                    batchTitle: batch.title || `Batch ${bIdx + 1}`,
                    title: listing.title || `Listing ${lIdx + 1}`,
                    price: listing.price || ''
                });
            });
        }
    });

    // Save mapping for later edits
    analyticsListings = allListings;

    // Calculate average percentage
    if (allListings.length > 0 && analyticsPercentageElement) {
        const totalPercentage = allListings.reduce((sum, item) => sum + item.percentage, 0);
        const averagePercentage = (totalPercentage / allListings.length).toFixed(2);
        const sign = averagePercentage >= 0 ? '+' : '';
        analyticsPercentageElement.textContent = `${sign}${averagePercentage}%`;
    } else if (analyticsPercentageElement) {
        analyticsPercentageElement.textContent = '+0.00%';
    }

    // Group listings by batch
    const groupedByBatch = {};
    allListings.forEach((data, index) => {
        const batchKey = data.batchIndex;
        if (!groupedByBatch[batchKey]) {
            groupedByBatch[batchKey] = {
                batchTitle: data.batchTitle,
                listings: []
            };
        }
        groupedByBatch[batchKey].listings.push({ ...data, globalIndex: index });
    });

    // Render each batch group
    Object.keys(groupedByBatch).sort((a, b) => parseInt(a) - parseInt(b)).forEach(batchKey => {
        const group = groupedByBatch[batchKey];

        // Create batch header with toggle button
        const batchHeader = document.createElement('div');
        batchHeader.className = 'analytics-batch-header';
        batchHeader.dataset.batchKey = batchKey;
        batchHeader.innerHTML = `
            <div class="analytics-batch-header-content">
                <svg class="analytics-batch-toggle" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
                <h3 class="analytics-batch-title">${group.batchTitle}</h3>
                <span class="analytics-batch-count">${group.listings.length} items</span>
            </div>
        `;

        // Create grid container for this batch's cards
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'analytics-batch-cards-grid';
        cardsGrid.dataset.batchKey = batchKey;

        // Add click handler to toggle collapse
        batchHeader.addEventListener('click', function () {
            this.classList.toggle('collapsed');
            const batchKey = this.dataset.batchKey;

            // Update collapsed state tracking
            if (this.classList.contains('collapsed')) {
                collapsedBatches.add(batchKey);
            } else {
                collapsedBatches.delete(batchKey);
            }

            // Toggle the entire cards grid
            cardsGrid.classList.toggle('hidden');
        });

        // Restore collapsed state if this batch was previously collapsed
        if (collapsedBatches.has(batchKey)) {
            batchHeader.classList.add('collapsed');
            cardsGrid.classList.add('hidden');
        }

        analyticsGrid.appendChild(batchHeader);

        // Create cards for this batch
        group.listings.forEach(data => {
            const card = createAnalyticsCard(data, data.globalIndex);
            card.dataset.batchGroup = batchKey;
            cardsGrid.appendChild(card);
        });

        analyticsGrid.appendChild(cardsGrid);
    });

    // Update selected count after populating
    updatePricingSelectedCount();
}

// Filter buttons functionality
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('filter-btn')) {
        // Remove active from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        // Add active to clicked button
        e.target.classList.add('active');

        // Repopulate analytics grid with new time period
        const timePeriod = e.target.textContent.trim();
        populateAnalyticsGrid(timePeriod);
    }
});

// Image Panel Functions
let currentEditingListingItem = null;

function openImagePanel(listingItem) {
    currentEditingListingItem = listingItem;
    const panel = document.getElementById('image-panel');

    // Render current images
    renderImagesGrid();

    panel.classList.add('open');
}

function renderImagesGrid() {
    if (!currentEditingListingItem) return;

    const imagesGrid = document.getElementById('images-grid');
    const images = JSON.parse(currentEditingListingItem.dataset.images || '[]');

    if (images.length === 0) {
        imagesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <svg style="width: 64px; height: 64px; margin-bottom: 12px; opacity: 0.5;" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
                <p>No images yet. Upload or paste a URL below.</p>
            </div>
        `;
        return;
    }

    imagesGrid.innerHTML = images.map((url, index) => `
        <div class="image-grid-item" data-index="${index}">
            <img src="${url}" alt="Image ${index + 1}">
            <button class="image-grid-item-delete" data-index="${index}" aria-label="Delete image">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </button>
        </div>
    `).join('');

    // Add click handlers for delete buttons
    imagesGrid.querySelectorAll('.image-grid-item-delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            deleteImage(index);
        });
    });

    // Add click handlers to view images in carousel
    imagesGrid.querySelectorAll('.image-grid-item').forEach(item => {
        item.addEventListener('click', function () {
            const index = parseInt(this.dataset.index);
            openCarousel(images, index, currentEditingListingItem);
        });
    });
}

function addImageToListing(url) {
    if (!currentEditingListingItem || !url) return;

    const images = JSON.parse(currentEditingListingItem.dataset.images || '[]');
    images.push(url);
    currentEditingListingItem.dataset.images = JSON.stringify(images);

    updateListingThumbnail(currentEditingListingItem);
    renderImagesGrid();
    saveCurrentListings();
}

function deleteImage(index) {
    if (!currentEditingListingItem) return;

    const images = JSON.parse(currentEditingListingItem.dataset.images || '[]');
    images.splice(index, 1);
    currentEditingListingItem.dataset.images = JSON.stringify(images);

    updateListingThumbnail(currentEditingListingItem);
    renderImagesGrid();
    saveCurrentListings();
}

function updateListingThumbnail(listingItem) {
    const images = JSON.parse(listingItem.dataset.images || '[]');
    const thumbnailImg = listingItem.querySelector('.thumbnail-image');
    const thumbnailIcon = listingItem.querySelector('.thumbnail-icon');
    const thumbnailDiv = listingItem.querySelector('.listing-thumbnail');
    const badge = listingItem.querySelector('.image-count-badge');

    if (images.length > 0) {
        thumbnailImg.src = images[0];
        thumbnailImg.style.display = 'block';
        thumbnailIcon.style.display = 'none';
        thumbnailDiv.setAttribute('data-has-image', 'true');

        if (images.length > 1) {
            badge.textContent = images.length;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } else {
        thumbnailImg.style.display = 'none';
        thumbnailIcon.style.display = 'block';
        thumbnailDiv.setAttribute('data-has-image', 'false');
        badge.style.display = 'none';
    }
}

function closeImagePanel() {
    const panel = document.getElementById('image-panel');
    panel.classList.remove('open');
    currentEditingListingItem = null;
}

// Function to upload image to ImgBB
async function uploadToImgBB(file) {
    // Check if API key is configured
    if (IMGBB_API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error('Please configure your ImgBB API key in script.js. Get one free at: https://api.imgbb.com/');
    }

    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
    });
    reader.readAsDataURL(file);

    const base64Data = await base64Promise;

    // Upload to ImgBB
    const formData = new FormData();
    formData.append('image', base64Data);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.data.url; // Returns the direct image URL
}

// Add Photos button functionality (in editor screen)
const addPhotosBtn = document.getElementById('add-photos-btn');
const addPhotosInput = document.getElementById('add-photos-input');

if (addPhotosBtn && addPhotosInput) {
    addPhotosBtn.addEventListener('click', function () {
        addPhotosInput.click();
    });

    addPhotosInput.addEventListener('change', async function (e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const container = document.getElementById('listings-container');
        const listingItems = container.querySelectorAll('.listing-item');

        if (listingItems.length === 0) {
            alert('No listings to add photos to!');
            return;
        }

        // Show progress overlay
        const loadingOverlay = document.getElementById('save-loading');
        const loadingText = loadingOverlay?.querySelector('.loading-text');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            if (loadingText) {
                loadingText.textContent = `Uploading ${files.length} photos to ImgBB...`;
            }
        }

        try {
            // Upload all files to ImgBB
            const uploadPromises = files.map((file) => {
                return uploadToImgBB(file).catch(error => {
                    console.error(`Failed to upload ${file.name}:`, error);
                    return null;
                });
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const validUrls = uploadedUrls.filter(url => url !== null);

            if (validUrls.length === 0) {
                alert('All uploads failed. Please try again.');
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                return;
            }

            // Update loading text
            if (loadingText) {
                loadingText.textContent = 'Distributing photos across listings...';
            }

            // Distribute photos across all listings
            const photosPerListing = Math.floor(validUrls.length / listingItems.length);
            let photoIndex = 0;

            for (let i = 0; i < listingItems.length && photoIndex < validUrls.length; i++) {
                const item = listingItems[i];
                const existingImages = JSON.parse(item.dataset.images || '[]');

                // Add photosPerListing photos to this listing
                for (let j = 0; j < photosPerListing && photoIndex < validUrls.length; j++) {
                    existingImages.push(validUrls[photoIndex]);
                    photoIndex++;
                }

                item.dataset.images = JSON.stringify(existingImages);
                updateListingThumbnail(item);
            }

            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }

            // Show success message
            alert(`Successfully added ${validUrls.length} photos to ${listingItems.length} listings!`);

            // Reset input
            addPhotosInput.value = '';

        } catch (error) {
            console.error('Error adding photos:', error);
            alert('Failed to add photos. Please try again.');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    });
}

// Image panel close button
const imagePanelClose = document.getElementById('image-panel-close');
if (imagePanelClose) {
    imagePanelClose.addEventListener('click', closeImagePanel);
}

// Image upload button
const imageUploadBtn = document.querySelector('.image-upload-btn');
if (imageUploadBtn) {
    imageUploadBtn.addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async function (e) {
            const file = e.target.files[0];
            if (file && currentEditingListingItem) {
                try {
                    // Upload to ImgBB
                    const imageUrl = await uploadToImgBB(file);

                    // Add image to listing
                    addImageToListing(imageUrl);

                    alert('Image uploaded to ImgBB successfully!');
                } catch (error) {
                    alert('Failed to upload image to ImgBB: ' + error.message);
                }
            }
        };
        input.click();
    });
}

// Handle URL input for images
const imageUrlInput = document.getElementById('image-url-input');
if (imageUrlInput) {
    imageUrlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const url = this.value.trim();
            if (url && currentEditingListingItem) {
                addImageToListing(url);
                this.value = ''; // Clear input
            }
        }
    });
}

// Edit selected analytics -> open price edit screen
const editFloatingBtn = document.querySelector('.edit-btn-floating');
if (editFloatingBtn) {
    editFloatingBtn.addEventListener('click', function () {
        const selectedCards = Array.from(document.querySelectorAll('#analytics-grid .analytics-card.selected'));
        if (selectedCards.length === 0) {
            alert('Please select one or more listings to edit prices.');
            return;
        }
        openPriceEditForSelected(selectedCards);
    });
}

function openPriceEditForSelected(cards) {
    const container = document.getElementById('price-edit-list');
    if (!container) return;
    container.innerHTML = '';

    cards.forEach(card => {
        const batchIdx = parseInt(card.dataset.batch, 10);
        const listingIdx = parseInt(card.dataset.listing, 10);
        // Safely get listing
        const listing = (batches[batchIdx] && batches[batchIdx].listings && batches[batchIdx].listings[listingIdx]) ? batches[batchIdx].listings[listingIdx] : null;

        const title = listing?.title || (card.dataset.title || 'Listing');
        const price = listing?.price || '';

        // Get market percentage from the analytics card
        const percentageElement = card.querySelector('.analytics-percentage-value');
        const percentageText = percentageElement?.textContent || '0%';
        const marketPercent = parseFloat(percentageText);
        const isPositive = marketPercent >= 0;

        const item = document.createElement('div');
        item.className = 'price-edit-item';
        item.innerHTML = `
            <div class="pe-title">${escapeHtml(title)}</div>
            <div class="pe-price-info">
                <div class="pe-current-price">
                    <span class="pe-label">Current Price:</span>
                    <span class="pe-value">$${price || '0.00'}</span>
                </div>
                <div class="pe-market-change">
                    <span class="pe-label">Market Change:</span>
                    <span class="pe-change-value ${isPositive ? 'positive' : 'negative'}">${percentageText}</span>
                </div>
                <div class="pe-new-price-field">
                    <label class="pe-label">New Price:</label>
                    <input class="pe-input" type="text" placeholder="Enter new price" data-batch="${batchIdx}" data-listing="${listingIdx}" data-current-price="${price}" data-market-percent="${marketPercent}" value="" />
                    <button class="pe-auto-btn" type="button">Auto Adjust</button>
                </div>
            </div>
        `;

        container.appendChild(item);

        // Add auto adjust button functionality
        const autoBtn = item.querySelector('.pe-auto-btn');
        const input = item.querySelector('.pe-input');

        autoBtn.addEventListener('click', function () {
            const currentPrice = parseFloat(price) || 0;
            if (currentPrice > 0) {
                const adjustedPrice = currentPrice * (1 + marketPercent / 100);
                input.value = adjustedPrice.toFixed(2);

                // Mark this input as auto-adjusted for Study 2 tracking
                input.dataset.autoAdjusted = 'true';
            }
        });
    });

    // Switch to edit screen
    switchScreen('price-edit');

    // Wire apply / cancel
    const applyBtn = document.getElementById('apply-price-changes');
    const cancelBtn = document.getElementById('cancel-price-edit');

    if (applyBtn) {
        applyBtn.onclick = function () {
            const inputs = container.querySelectorAll('.pe-input');
            const studyType = parseInt(localStorage.getItem('studyType') || '0');

            inputs.forEach(inp => {
                const b = parseInt(inp.dataset.batch, 10);
                const l = parseInt(inp.dataset.listing, 10);
                const newPrice = inp.value;
                const currentPrice = inp.dataset.currentPrice;

                // Track Study 2 metrics: count adjustments where price was changed
                if (studyType === 2 && newPrice && newPrice !== currentPrice) {
                    study2Metrics.totalAdjustments++;
                    if (inp.dataset.autoAdjusted === 'true') {
                        study2Metrics.autoAdjustments++;
                    } else {
                        study2Metrics.manualAdjustments++;
                    }
                    saveStudy2Metrics();
                }

                if (batches[b] && batches[b].listings && batches[b].listings[l]) {
                    batches[b].listings[l].price = newPrice;
                }
            });
            saveBatches();

            // Return to analytics and refresh grid
            switchScreen('analytics');
            populateAnalyticsGrid();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            switchScreen('analytics');
        };
    }
}

// Simple HTML escape for title strings
function escapeHtml(str) {
    return String(str).replace(/[&<>"'`]/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;", "`": "&#96;" })[s];
    });
}

// Carousel functionality
let carouselImages = [];
let currentCarouselIndex = 0;
let carouselListingItem = null;

function openCarousel(images, startIndex = 0, listingItem = null) {
    carouselImages = images.filter(img => img); // Filter out empty images
    if (carouselImages.length === 0) return;

    currentCarouselIndex = startIndex;
    carouselListingItem = listingItem;
    const modal = document.getElementById('carousel-modal');
    modal.classList.add('open');

    updateCarouselImage();
}

function closeCarousel() {
    const modal = document.getElementById('carousel-modal');
    modal.classList.remove('open');
    carouselImages = [];
    currentCarouselIndex = 0;
    carouselListingItem = null;
}

function updateCarouselImage() {
    const img = document.getElementById('carousel-image');
    const counter = document.getElementById('carousel-counter');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');

    if (carouselImages.length > 0) {
        img.src = carouselImages[currentCarouselIndex];
        counter.textContent = `${currentCarouselIndex + 1} / ${carouselImages.length}`;

        // Show/hide navigation buttons based on number of images
        if (carouselImages.length === 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

function nextCarouselImage() {
    if (carouselImages.length > 0) {
        currentCarouselIndex = (currentCarouselIndex + 1) % carouselImages.length;
        updateCarouselImage();
    }
}

function prevCarouselImage() {
    if (carouselImages.length > 0) {
        currentCarouselIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
        updateCarouselImage();
    }
}

// Carousel event listeners
const carouselClose = document.getElementById('carousel-close');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const carouselOverlay = document.querySelector('.carousel-overlay');

if (carouselClose) {
    carouselClose.addEventListener('click', closeCarousel);
}

if (carouselPrev) {
    carouselPrev.addEventListener('click', prevCarouselImage);
}

if (carouselNext) {
    carouselNext.addEventListener('click', nextCarouselImage);
}

if (carouselOverlay) {
    carouselOverlay.addEventListener('click', closeCarousel);
}

// Keyboard navigation for carousel
document.addEventListener('keydown', function (e) {
    const modal = document.getElementById('carousel-modal');
    if (modal && modal.classList.contains('open')) {
        if (e.key === 'Escape') {
            closeCarousel();
        } else if (e.key === 'ArrowLeft') {
            prevCarouselImage();
        } else if (e.key === 'ArrowRight') {
            nextCarouselImage();
        }
    }
});
