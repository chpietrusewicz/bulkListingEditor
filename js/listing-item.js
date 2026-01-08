// Listing Item Management

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
        const uploadBox = document.querySelector('.upload-box');
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
