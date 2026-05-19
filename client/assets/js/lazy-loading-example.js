// Example: Image Lazy-Loading Implementation
// This file shows how to integrate lazy-loading into existing pages

// EXAMPLE 1: Campaigns Page - Lazy Load Campaign Cards
// =====================================================

/**
 * Update HTML:
 * <img src="placeholder.jpg" data-lazy="campaign-image.jpg" alt="Campaign">
 * 
 * The performance.js module automatically initializes lazy loading,
 * but you can also manually initialize it:
 */

function initCampaignLazyLoading() {
    // Initialize lazy loading for campaign images
    lazyLoadImages('img[data-lazy]');
    
    console.log('Campaign images set to lazy load');
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    initCampaignLazyLoading();
});


// EXAMPLE 2: Dynamic Image Updates - Force Lazy Load on New Images
// =================================================================

function addLazyLoadToNewImages() {
    // When new campaign cards are added dynamically, ensure they lazy load
    const newImages = document.querySelectorAll('img[data-lazy]');
    
    if (!('IntersectionObserver' in window)) {
        // Fallback for older browsers
        newImages.forEach(img => {
            if (img.dataset.lazy) {
                img.src = img.dataset.lazy;
            }
        });
        return;
    }
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.lazy) {
                    img.src = img.dataset.lazy;
                    img.removeAttribute('data-lazy');
                    imageObserver.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    newImages.forEach(img => {
        if (img.dataset.lazy) {
            imageObserver.observe(img);
        }
    });
}


// EXAMPLE 3: Campaigns with Optimized Images
// ===========================================

function renderCampaignCard(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card';
    
    // Use data-lazy for images + optimized URL
    const imageUrl = optimizeImageUrl(campaign.imageUrl, 400, 'auto');
    
    card.innerHTML = `
        <div class="campaign-image-wrapper">
            <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3C/svg%3E"
                data-lazy="${imageUrl}"
                alt="${campaign.title}"
                class="campaign-image"
                loading="lazy"
            >
        </div>
        <div class="campaign-info">
            <h3>${campaign.title}</h3>
            <p class="campaign-category">${campaign.category}</p>
            <div class="campaign-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${campaign.progressPercentage}%"></div>
                </div>
                <span class="progress-text">${campaign.amountRaised} of ${campaign.goal}</span>
            </div>
        </div>
    `;
    
    return card;
}


// EXAMPLE 4: Re-initialize Lazy Loading After Content Update
// ===========================================================

function updateCampaignList(campaigns) {
    const container = document.getElementById('campaignsList');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Batch DOM updates for better performance
    batchDOMUpdates(() => {
        campaigns.forEach(campaign => {
            const card = renderCampaignCard(campaign);
            container.appendChild(card);
        });
    });
    
    // Re-initialize lazy loading for new images
    addLazyLoadToNewImages();
}


// EXAMPLE 5: Prefetch Images on Hover (Optional Advanced)
// ========================================================

function initImagePrefetch() {
    document.addEventListener('mouseover', (e) => {
        const img = e.target;
        if (img.tagName === 'IMG' && img.dataset.lazy) {
            // Prefetch the lazy image on hover
            prefetchData(img.dataset.lazy);
        }
    });
}


// EXAMPLE 6: Loading State Handling
// ==================================

function renderCampaignWithLoadingState(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card loading';
    
    const imageUrl = optimizeImageUrl(campaign.imageUrl, 400, 'auto');
    
    // Use a low-quality placeholder with blur effect
    const placeholderUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';
    
    card.innerHTML = `
        <div class="campaign-image-wrapper">
            <img 
                src="${placeholderUrl}"
                data-lazy="${imageUrl}"
                alt="${campaign.title}"
                class="campaign-image"
                onload="this.parentElement.classList.remove('loading')"
                onerror="this.parentElement.classList.add('error')"
            >
            <div class="image-placeholder">
                <i class="fas fa-image"></i>
            </div>
        </div>
        <div class="campaign-info">
            <h3>${campaign.title}</h3>
            <p class="campaign-category">${campaign.category}</p>
            <div class="campaign-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${campaign.progressPercentage}%"></div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}


// EXAMPLE 7: CSS for Loading States
// ==================================

const lazyLoadStyles = `
    <style>
        /* Loading state for images */
        .campaign-image-wrapper.loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Error state */
        .campaign-image-wrapper.error {
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .campaign-image-wrapper.error .image-placeholder {
            color: #ccc;
            font-size: 3rem;
        }
        
        /* Actual image styling */
        .campaign-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 0.3s ease;
        }
        
        /* Fade in animation for loaded images */
        .campaign-image[data-lazy]:not([data-lazy=""]) {
            opacity: 1;
        }
    </style>
`;


// EXAMPLE 8: Integration into Campaigns.js
// ========================================

/**
 * In campaigns.js, replace the existing image loading with:
 */

async function loadCampaigns() {
    try {
        // Use cached fetch for better performance
        const data = await cachedFetch(
            API.CAMPAIGNS,
            { headers: getAuthHeaders() },
            'campaigns-list',
            5 * 60 * 1000  // Cache for 5 minutes
        );
        
        const campaigns = data.data || [];
        const container = document.getElementById('campaignsList');
        
        if (campaigns.length === 0) {
            container.innerHTML = '<p>No campaigns found</p>';
            return;
        }
        
        // Batch DOM updates for better performance
        batchUpdates([
            () => {
                container.innerHTML = '';
                campaigns.forEach(campaign => {
                    const card = renderCampaignWithLoadingState(campaign);
                    container.appendChild(card);
                });
            }
        ]).then(() => {
            // Initialize lazy loading for all images
            lazyLoadImages('img[data-lazy]');
            
            // Optional: Prefetch images on hover
            initImagePrefetch();
        });
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        showToast('Failed to load campaigns', 'error');
    }
}


// EXAMPLE 9: Responsive Images with Lazy Loading
// ===============================================

function renderResponsiveImage(campaign) {
    // Different image sizes for different devices
    const sizes = {
        mobile: 300,
        tablet: 500,
        desktop: 800
    };
    
    // Get appropriate image URL based on typical device
    const imageUrl = optimizeImageUrl(campaign.imageUrl, 500, 'auto');
    
    return `
        <img 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 375'%3E%3C/svg%3E"
            data-lazy="${imageUrl}"
            alt="${campaign.title}"
            class="campaign-image"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        >
    `;
}


// EXAMPLE 10: Performance Monitoring
// ===================================

function logImagePerformance() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.initiatorType === 'img') {
                    console.log(`Image loaded: ${entry.name} (${entry.duration.toFixed(0)}ms)`);
                    
                    // Log slow image loads
                    if (entry.duration > 2000) {
                        console.warn(`Slow image: ${entry.name} took ${entry.duration.toFixed(0)}ms`);
                    }
                }
            }
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    logImagePerformance();
});
