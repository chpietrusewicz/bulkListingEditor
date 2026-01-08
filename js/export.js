// CSV Export Functionality

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
