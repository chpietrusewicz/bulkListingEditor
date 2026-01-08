// Photo Upload and Image Management

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

// Function to upload image to ImgBB
async function uploadToImgBB(file) {
    // Check if API key is configured
    if (IMGBB_API_KEY === 'YOUR_API_KEY_HERE') {
        throw new Error('Please configure your ImgBB API key in config.js. Get one free at: https://api.imgbb.com/');
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

// Image Panel Functions
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

// Carousel functionality
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
