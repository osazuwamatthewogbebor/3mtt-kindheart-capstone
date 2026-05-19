// ===== PHASE 3: PERFORMANCE OPTIMIZATION UTILITIES =====
// This module provides performance-critical utilities for scalability

// Debounce function - prevents rapid function calls (e.g., search, resize)
function debounce(func, delay = 300) {
    let timeoutId;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle function - limits function execution frequency (e.g., scroll, mouse move)
function throttle(func, delay = 300) {
    let lastCallTime = 0;
    return function throttled(...args) {
        const now = Date.now();
        if (now - lastCallTime >= delay) {
            func.apply(this, args);
            lastCallTime = now;
        }
    };
}

// Simple API response cache with TTL (Time To Live)
const apiCache = {
    store: {},
    
    set: function(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
        this.store[key] = {
            data: value,
            timestamp: Date.now(),
            ttl: ttl
        };
    },
    
    get: function(key) {
        const item = this.store[key];
        if (!item) return null;
        
        // Check if cache has expired
        if (Date.now() - item.timestamp > item.ttl) {
            delete this.store[key];
            return null;
        }
        
        return item.data;
    },
    
    clear: function() {
        this.store = {};
    },
    
    remove: function(key) {
        delete this.store[key];
    },
    
    // Get cache statistics
    getStats: function() {
        return {
            totalCached: Object.keys(this.store).length,
            cacheSize: Object.keys(this.store).reduce((size, key) => {
                return size + JSON.stringify(this.store[key]).length;
            }, 0)
        };
    }
};

// Fetch with caching support
async function cachedFetch(url, options = {}, cacheKey = null, ttl = 5 * 60 * 1000) {
    const key = cacheKey || url;
    
    // Check cache for GET requests only
    if (!options.method || options.method === 'GET') {
        const cached = apiCache.get(key);
        if (cached) {
            console.log(`Cache hit for: ${key}`);
            return Promise.resolve(cached);
        }
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache successful GET responses
        if (!options.method || options.method === 'GET') {
            apiCache.set(key, data, ttl);
        }
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Lazy load images using Intersection Observer API
function lazyLoadImages(selector = 'img[data-lazy]') {
    // Fallback for browsers without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll(selector).forEach(img => {
            if (img.dataset.lazy) {
                img.src = img.dataset.lazy;
                img.removeAttribute('data-lazy');
            }
        });
        return;
    }
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.lazy) {
                    // Load image
                    img.src = img.dataset.lazy;
                    img.removeAttribute('data-lazy');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px' // Start loading 50px before visible
    });
    
    // Observe all lazy-load images
    document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
    });
}

// Pagination helper - divide data into pages
function paginate(items, pageSize, pageNumber) {
    const totalPages = Math.ceil(items.length / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
        items: items.slice(startIndex, endIndex),
        pageNumber: pageNumber,
        pageSize: pageSize,
        totalItems: items.length,
        totalPages: totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
    };
}

// Virtual scrolling helper for rendering large lists efficiently
function createVirtualScroller(containerSelector, itemHeight, renderItem) {
    const container = document.querySelector(containerSelector);
    if (!container) return null;
    
    let data = [];
    let scrollTop = 0;
    
    function updateVisibleItems() {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, data.length);
        
        container.innerHTML = '';
        
        // Add offset padding
        const offsetDiv = document.createElement('div');
        offsetDiv.style.height = (startIndex * itemHeight) + 'px';
        container.appendChild(offsetDiv);
        
        // Render only visible items
        for (let i = startIndex; i < endIndex; i++) {
            const element = renderItem(data[i], i);
            container.appendChild(element);
        }
    }
    
    return {
        setData: function(newData) {
            data = newData;
            updateVisibleItems();
        },
        onScroll: function(e) {
            scrollTop = e.target.scrollTop;
            updateVisibleItems();
        }
    };
}

// Request deduplication - prevents duplicate API requests in flight
const requestCache = {};

function dedupFetch(url, options = {}) {
    const key = `${options.method || 'GET'}-${url}`;
    
    // Return existing request promise if already in flight
    if (!requestCache[key]) {
        requestCache[key] = fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .finally(() => {
                // Clean up request cache after completion
                delete requestCache[key];
            });
    }
    
    return requestCache[key];
}

// Initialize performance monitoring
function initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Log slow network requests (> 3 seconds)
                    if (entry.duration > 3000) {
                        console.warn(`Slow API request: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                    }
                }
            });
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        } catch (e) {
            console.log('Performance API not fully available');
        }
    }
}

// Measure function execution time for debugging
function measurePerformance(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = (end - start).toFixed(2);
    
    if (duration > 100) {
        console.warn(`${label} took ${duration}ms (slow operation)`);
    } else {
        console.log(`${label} took ${duration}ms`);
    }
    
    return result;
}

// Batch DOM updates to improve performance using requestIdleCallback
function batchDOMUpdates(fn) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(fn);
    } else {
        // Fallback to setTimeout for browsers without requestIdleCallback
        setTimeout(fn, 0);
    }
}

// Batch multiple DOM updates together
function batchUpdates(updates) {
    return new Promise((resolve) => {
        batchDOMUpdates(() => {
            updates.forEach(update => update());
            resolve();
        });
    });
}

// Optimize image loading with compression hints
function optimizeImageUrl(url, width = null, quality = 'auto') {
    // For real CDN, you could add query parameters for optimization
    // Example: url?w=300&q=auto
    if (!url) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    if (width) {
        return `${url}${separator}w=${width}&q=${quality}`;
    }
    return url;
}

// Simple request rate limiter
function createRateLimiter(maxRequests = 10, timeWindow = 60000) {
    let requestTimes = [];
    
    return function() {
        const now = Date.now();
        // Remove old requests outside the time window
        requestTimes = requestTimes.filter(time => now - time < timeWindow);
        
        if (requestTimes.length >= maxRequests) {
            const oldestRequest = requestTimes[0];
            const waitTime = timeWindow - (now - oldestRequest);
            return { allowed: false, waitTime };
        }
        
        requestTimes.push(now);
        return { allowed: true, waitTime: 0 };
    };
}

// Prefetch data for faster navigation
function prefetchData(url, headers = {}) {
    return fetch(url, {
        method: 'GET',
        headers: { ...headers },
        priority: 'low'
    }).catch(err => console.log('Prefetch failed:', err.message));
}

// Initialize performance optimizations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize lazy loading for all images marked with data-lazy
    lazyLoadImages('img[data-lazy]');
    
    // Initialize performance monitoring
    initPerformanceMonitoring();
});
