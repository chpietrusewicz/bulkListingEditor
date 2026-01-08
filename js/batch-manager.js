// Batch Management

// Function to save batches to localStorage and Firebase
function saveBatches() {
    localStorage.setItem('batches', JSON.stringify(batches));
    console.log('Batches saved to localStorage');

    // Also save to Firebase if enabled
    if (typeof saveBatchesToFirebase === 'function') {
        saveBatchesToFirebase(batches);
    }
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
