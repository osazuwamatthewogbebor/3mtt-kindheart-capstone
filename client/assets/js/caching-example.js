// Example: API Response Caching Implementation
// This file shows how to integrate caching into existing API calls

// ===== CACHING STRATEGY =====
// 
// Cache Duration Guidelines:
// - User profile: 10 minutes (changes when user updates)
// - Campaign list: 5 minutes (updates as donations come in)
// - Campaign details: 2 minutes (progress changes frequently)
// - Categories: 30 minutes (rarely changes)
// - Donation history: 1 minute (new donations frequent)
// - Admin stats: 1 minute (real-time monitoring)

// EXAMPLE 1: Cache Configuration
// ===============================

const CACHE_CONFIG = {
    campaigns: {
        ttl: 5 * 60 * 1000,      // 5 minutes
        key: 'campaigns-list'
    },
    campaignDetail: {
        ttl: 2 * 60 * 1000,      // 2 minutes
        key: 'campaign-detail'
    },
    categories: {
        ttl: 30 * 60 * 1000,     // 30 minutes
        key: 'categories-list'
    },
    userProfile: {
        ttl: 10 * 60 * 1000,     // 10 minutes
        key: 'user-profile'
    },
    donations: {
        ttl: 1 * 60 * 1000,      // 1 minute
        key: 'my-donations'
    },
    myCampaigns: {
        ttl: 3 * 60 * 1000,      // 3 minutes
        key: 'my-campaigns'
    }
};


// EXAMPLE 2: Fetch Campaigns with Caching
// ========================================

async function loadCampaignsWithCache() {
    try {
        // Use cached fetch instead of regular fetch
        const data = await cachedFetch(
            API.CAMPAIGNS,
            { headers: getAuthHeaders() },
            CACHE_CONFIG.campaigns.key,
            CACHE_CONFIG.campaigns.ttl
        );
        
        console.log('Campaigns loaded (may be from cache)');
        return data;
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        throw error;
    }
}


// EXAMPLE 3: Fetch Campaign Details with Caching
// ===============================================

async function loadCampaignDetailsWithCache(campaignId) {
    try {
        const cacheKey = `${CACHE_CONFIG.campaignDetail.key}-${campaignId}`;
        
        const data = await cachedFetch(
            `${API.CAMPAIGNS}/${campaignId}`,
            { headers: getAuthHeaders() },
            cacheKey,
            CACHE_CONFIG.campaignDetail.ttl
        );
        
        console.log(`Campaign ${campaignId} loaded (may be from cache)`);
        return data;
        
    } catch (error) {
        console.error('Error loading campaign details:', error);
        throw error;
    }
}


// EXAMPLE 4: Fetch Categories with Long Cache
// ============================================

async function loadCategoriesWithCache() {
    try {
        const data = await cachedFetch(
            API.CATEGORIES,
            { headers: getAuthHeaders() },
            CACHE_CONFIG.categories.key,
            CACHE_CONFIG.categories.ttl  // 30 min - rarely changes
        );
        
        console.log('Categories loaded (cached for 30 minutes)');
        return data;
        
    } catch (error) {
        console.error('Error loading categories:', error);
        throw error;
    }
}


// EXAMPLE 5: Fetch User Profile with Cache
// =========================================

async function loadUserProfileWithCache() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const data = await cachedFetch(
            API.ME,
            { headers: getAuthHeaders() },
            CACHE_CONFIG.userProfile.key,
            CACHE_CONFIG.userProfile.ttl
        );
        
        console.log('User profile loaded (cached for 10 minutes)');
        return data;
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}


// EXAMPLE 6: Short-lived Cache for Real-time Data
// ===============================================

async function loadMyDonationsWithCache() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const data = await cachedFetch(
            API.MY_DONATIONS,
            { headers: getAuthHeaders() },
            CACHE_CONFIG.donations.key,
            CACHE_CONFIG.donations.ttl  // Only 1 minute for near real-time
        );
        
        console.log('Your donations loaded (1-minute cache for freshness)');
        return data;
        
    } catch (error) {
        console.error('Error loading donations:', error);
        throw error;
    }
}


// EXAMPLE 7: Manual Cache Management
// ===================================

// Clear cache when user logs out
function clearAuthCache() {
    apiCache.remove(CACHE_CONFIG.userProfile.key);
    apiCache.remove(CACHE_CONFIG.donations.key);
    apiCache.remove(CACHE_CONFIG.myCampaigns.key);
    console.log('User-specific cache cleared');
}

// Clear cache when user updates profile
function clearProfileCache() {
    apiCache.remove(CACHE_CONFIG.userProfile.key);
    console.log('Profile cache cleared');
}

// Clear donations cache after creating new donation
function clearDonationsCache() {
    apiCache.remove(CACHE_CONFIG.donations.key);
    console.log('Donations cache cleared');
}

// Refresh specific campaign cache
function refreshCampaignCache(campaignId) {
    const cacheKey = `${CACHE_CONFIG.campaignDetail.key}-${campaignId}`;
    apiCache.remove(cacheKey);
    console.log(`Campaign ${campaignId} cache cleared`);
}

// Clear all caches (on major page reload)
function clearAllCache() {
    apiCache.clear();
    console.log('All caches cleared');
}


// EXAMPLE 8: Integrate into campaigns.js
// ======================================

/**
 * Replace existing fetch calls in campaigns.js with:
 */

// In campaigns.js - loadCampaigns()
async function loadCampaigns() {
    try {
        // Show loading state
        const container = document.getElementById('campaignsList');
        container.innerHTML = '<p class="loading">Loading campaigns...</p>';
        
        // Use cached fetch
        const data = await loadCampaignsWithCache();
        
        const campaigns = data.data || [];
        
        if (campaigns.length === 0) {
            container.innerHTML = '<p>No campaigns available</p>';
            return;
        }
        
        // Render campaigns...
        container.innerHTML = '';
        campaigns.forEach(campaign => {
            // render campaign card
        });
        
    } catch (error) {
        showToast('Failed to load campaigns', 'error');
    }
}

// In campaign-details.html - loading campaign info
async function loadCampaignDetails(campaignId) {
    try {
        // Use cached fetch
        const data = await loadCampaignDetailsWithCache(campaignId);
        
        // Update UI with data...
        document.getElementById('campaignTitle').textContent = data.title;
        // etc.
        
    } catch (error) {
        showToast('Failed to load campaign', 'error');
    }
}

// In campaign form pages - load categories
async function loadCategories() {
    try {
        const data = await loadCategoriesWithCache();
        
        const categorySelect = document.getElementById('category');
        const categories = data.data || [];
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select a category</option>';
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        showToast('Failed to load categories', 'error');
    }
}


// EXAMPLE 9: Cache Statistics Dashboard
// ======================================

function showCacheStats() {
    const stats = apiCache.getStats();
    
    console.log('=== API Cache Statistics ===');
    console.log(`Cached items: ${stats.totalCached}`);
    console.log(`Cache size: ${(stats.cacheSize / 1024).toFixed(2)} KB`);
    console.log('Cache contents:', apiCache.store);
}

// Display cache stats on page
function renderCacheStats() {
    const stats = apiCache.getStats();
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'cache-stats debug-only';
    statsDiv.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #f5f5f5;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        display: none;
    `;
    
    statsDiv.innerHTML = `
        <strong>Cache Stats</strong><br>
        Items: ${stats.totalCached}<br>
        Size: ${(stats.cacheSize / 1024).toFixed(2)} KB
    `;
    
    document.body.appendChild(statsDiv);
    
    // Show stats when 'C' key is pressed (for debugging)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'c' && e.ctrlKey) {
            statsDiv.style.display = statsDiv.style.display === 'none' ? 'block' : 'none';
        }
    });
}


// EXAMPLE 10: Cache Invalidation on Actions
// ==========================================

// In auth.js - after login, load and cache user profile
async function handleLoginWithCache(email, password) {
    try {
        const response = await fetch(API.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        
        // Pre-cache user profile after login
        const profile = await cachedFetch(
            API.ME,
            { headers: getAuthHeaders() },
            CACHE_CONFIG.userProfile.key,
            CACHE_CONFIG.userProfile.ttl
        );
        
        // Redirect to dashboard
        window.location.href = 'admin-dashboard.html';
        
    } catch (error) {
        showToast('Login failed', 'error');
    }
}

// In auth.js - clear cache on logout
function handleLogout() {
    // Clear cached data
    clearAuthCache();
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = 'login.html';
}

// In campaign form - invalidate campaign list after creating new campaign
async function handleCreateCampaignWithCache(formData) {
    try {
        const response = await fetch(API.CAMPAIGNS, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Campaign creation failed');
        }
        
        const data = await response.json();
        
        // Invalidate caches that now have stale data
        apiCache.remove(CACHE_CONFIG.campaigns.key);
        apiCache.remove(CACHE_CONFIG.myCampaigns.key);
        
        console.log('Campaign created, caches cleared');
        
        // Redirect to campaign details
        window.location.href = `campaign-details.html?id=${data.id}`;
        
    } catch (error) {
        showToast('Failed to create campaign', 'error');
    }
}


// EXAMPLE 11: Smart Cache with Stale-While-Revalidate
// ===================================================

async function cachedFetchWithRevalidate(url, options, cacheKey, ttl) {
    // Return cached data immediately if available
    const cached = apiCache.get(cacheKey);
    if (cached) {
        // Fetch fresh data in background
        fetch(url, options)
            .then(r => r.json())
            .then(data => {
                // Update cache with fresh data
                apiCache.set(cacheKey, data, ttl);
                console.log(`Updated cache: ${cacheKey}`);
            })
            .catch(err => console.log('Background fetch failed'));
        
        // Return cached data immediately
        return Promise.resolve(cached);
    }
    
    // No cache, fetch and cache the data
    return cachedFetch(url, options, cacheKey, ttl);
}


// ===== INTEGRATION CHECKLIST =====
// 
// [ ] Replace fetch() calls with cachedFetch() in:
//     [ ] campaigns.js
//     [ ] campaign-details.html
//     [ ] admin-dashboard.html
//     [ ] my-campaigns.html
//     [ ] my-donations.html
//     [ ] profile.html
// 
// [ ] Add clearCache() calls after mutations:
//     [ ] After creating campaign
//     [ ] After updating campaign
//     [ ] After creating donation
//     [ ] After updating profile
//     [ ] After logging out
// 
// [ ] Test cache behavior:
//     [ ] First load - should fetch from API
//     [ ] Second load (within TTL) - should come from cache
//     [ ] Third load (after TTL expired) - should fetch fresh data
// 
// [ ] Monitor performance:
//     [ ] Console shows "Cache hit" for cached requests
//     [ ] Network tab shows fewer API requests
//     [ ] Page loads faster on repeat visits
