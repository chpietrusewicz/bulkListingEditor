// Analytics and Pricing Management

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
