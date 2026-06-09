/*
 * cache-utils.js
 * Production-ready frontend caching utilities using localStorage.
 * - Provides safe localStorage helpers with TTL
 * - Implements a cache-first strategy: show cached data immediately,
 *   fetch fresh data in the background, and update the UI when new data differs.
 * - Designed for non-sensitive public data only (categories, campaign listings).
 * - Does NOT store authentication tokens, user profile, donations, payments, or admin data.
 *
 * Integration:
 * - Include this file after `config.js` (so `API` is available) and before page scripts.
 *   <script src="assets/js/config.js"></script>
 *   <script src="assets/js/cache-utils.js"></script>
 *
 * Primary helpers:
 * - CacheUtils.setLocalCache(key, data, ttlMs)
 * - CacheUtils.getLocalCache(key)
 * - CacheUtils.removeLocalCache(key)
 * - CacheUtils.cacheFirst(options) -> implements cache-first strategy
 * - CacheUtils.getCategoriesCached(renderCached, renderFresh)
 * - CacheUtils.loadCampaignsCached(opts)
 *
 * TTL notes:
 * - Categories: cached for 30 minutes by default (rarely changes)
 * - Campaign listings: cached for 5 minutes as requested
 * - When cached data is shown, a background fetch attempts to refresh it;
 *   if the response differs, the cache is updated and `renderFresh` is called.
 */

(function (window) {
    'use strict';

    const CacheUtils = {};

    CacheUtils.get = function (key) {
        return CacheUtils.getLocalCache(key);
    };

    CacheUtils.set = function (key, data, ttl) {
        return CacheUtils.setLocalCache(key, data, ttl);
    };

    CacheUtils.clear = function (key) {
        return CacheUtils.removeLocalCache(key);
    };

    CacheUtils.isValid = function (key) {
        const cached = CacheUtils.getLocalCache(key);
        return !!(cached && !cached.isExpired);
    };

    // Safe localStorage wrapper to avoid exceptions (quota, private mode)
    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('localStorage.setItem failed', e);
            return false;
        }
    }

    function safeGetItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage.getItem failed', e);
            return null;
        }
    }

    function safeRemoveItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('localStorage.removeItem failed', e);
            return false;
        }
    }

    // Store an object with timestamp and TTL into localStorage
    // key: string
    // data: any (will be JSON.stringified)
    // ttlMs: number (milliseconds)
    CacheUtils.setLocalCache = function (key, data, ttlMs) {
        if (!key) return false;
        try {
            const payload = {
                ts: Date.now(),
                ttl: Number.isFinite(ttlMs) ? ttlMs : 0,
                data: data
            };
            return safeSetItem(key, JSON.stringify(payload));
        } catch (e) {
            console.warn('setLocalCache error', e);
            return false;
        }
    };

    // Get cached entry. Returns { data, ts, ttl, isExpired } or null
    CacheUtils.getLocalCache = function (key) {
        if (!key) return null;
        try {
            const raw = safeGetItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            const ts = parsed.ts || 0;
            const ttl = parsed.ttl || 0;
            const isExpired = ttl > 0 && (Date.now() - ts) > ttl;
            return {
                data: parsed.data,
                ts: ts,
                ttl: ttl,
                isExpired: isExpired
            };
        } catch (e) {
            console.warn('getLocalCache error', e);
            return null;
        }
    };

    CacheUtils.removeLocalCache = function (key) {
        return safeRemoveItem(key);
    };

    function clearKeysWithPrefix(prefix) {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.indexOf(prefix) === 0) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            console.warn('clearKeysWithPrefix failed', e);
        }
    }

    // Deep compare helper (fast-path: length check, fallback to JSON)
    function isDifferent(a, b) {
        try {
            if (a === b) return false;
            if (Array.isArray(a) && Array.isArray(b)) {
                if (a.length !== b.length) return true;
            }
            return JSON.stringify(a) !== JSON.stringify(b);
        } catch (e) {
            return true;
        }
    }

    /*
     * cacheFirst
     * - options.key: localStorage key
     * - options.ttl: cache TTL in ms
     * - options.fetcher: async function that returns fresh data (e.g., () => fetch(...).then(r=>r.json()))
     * - options.renderCached: function(data) called synchronously if cached data exists
     * - options.renderFresh: function(data) called when fresh data arrives and differs
     * - options.onError: function(err) called when fetch fails and no cached data exists
     *
     * Behavior:
     * 1. If cached data exists, call `renderCached` immediately.
     * 2. Always attempt `fetcher()` in background.
     * 3. If fetch succeeds and data differs, update cache and call `renderFresh`.
     * 4. If fetch fails and no cached data existed, call `onError` so the caller can present a UI message.
     */
    CacheUtils.cacheFirst = async function (options) {
        const { key, ttl = 0, fetcher, renderCached, renderFresh, onError } = options || {};

        if (!key || typeof fetcher !== 'function') {
            throw new Error('cacheFirst requires `key` and `fetcher`');
        }

        const cached = CacheUtils.getLocalCache(key);
        const hadCached = !!(cached && cached.data);

        if (hadCached && typeof renderCached === 'function') {
            try { renderCached(cached.data); } catch (e) { console.warn('renderCached error', e); }
        }

        // Background fetch
        try {
            const fresh = await fetcher();

            // If fetcher returned a Response-like object, try to handle it
            const data = (fresh && typeof fresh === 'object' && ('data' in fresh) && Object.keys(fresh).length > 1) ? fresh : fresh;

            const needsUpdate = !hadCached || isDifferent((cached && cached.data) || null, data);

            if (needsUpdate) {
                try { CacheUtils.setLocalCache(key, data, ttl); } catch (e) { console.warn('Failed to set cache', e); }
                if (typeof renderFresh === 'function') {
                    try { renderFresh(data); } catch (e) { console.warn('renderFresh error', e); }
                }
            }
            return data;
        } catch (err) {
            console.warn('cacheFirst fetcher failed', err);
            if (hadCached) {
                return cached.data;
            }
            if (typeof onError === 'function') onError(err);
            return null;
        }
    };

    // ----- Specific utilities for the crowdfunding app -----

    // 1) Categories cache using localStorage (requirement #1)
    // - Key: 'kindheart-categories'
    // - TTL: 30 minutes (default)
    CacheUtils.CATEGORIES_KEY = 'kindheart-categories';
    CacheUtils.CATEGORIES_TTL = 30 * 60 * 1000;

    CacheUtils.getCategoriesKey = function () {
        return CacheUtils.CATEGORIES_KEY;
    };

    CacheUtils.getCategoriesCached = function (renderCached, renderFresh, onError) {
        return CacheUtils.cacheFirst({
            key: CacheUtils.CATEGORIES_KEY,
            ttl: CacheUtils.CATEGORIES_TTL,
            fetcher: async () => {
                const res = await fetch(API.CATEGORIES, { method: 'GET', headers: getAuthHeaders() });
                if (!res.ok) throw new Error(`Failed to fetch categories (${res.status})`);
                return await res.json();
            },
            renderCached,
            renderFresh,
            onError: onError || function (err) {
                console.error('Unable to load categories', err);
            }
        });
    };

    // 2) Campaign listings cache using localStorage (requirement #2)
    // - Key: 'kindheart-campaigns' or include query params
    // - TTL: 5 minutes
    CacheUtils.CAMPAIGNS_KEY_BASE = 'kindheart-campaigns';
    CacheUtils.CAMPAIGNS_TTL = 5 * 60 * 1000;

    CacheUtils.getCampaignsKey = function (params = '') {
        return params ? `${CacheUtils.CAMPAIGNS_KEY_BASE}:${params}` : CacheUtils.CAMPAIGNS_KEY_BASE;
    };

    CacheUtils.getCampaignKey = function (campaignId) {
        return campaignId ? `campaign_${campaignId}` : 'campaign_';
    };

    CacheUtils.clearCampaignCaches = function (campaignId) {
        clearKeysWithPrefix(CacheUtils.CAMPAIGNS_KEY_BASE);
        if (campaignId) {
            CacheUtils.clear(CacheUtils.getCampaignKey(campaignId));
            CacheUtils.clear(CacheUtils.getCampaignsKey(`?id=${campaignId}`));
        }
    };

    CacheUtils.clearDonationCaches = function (campaignId) {
        clearKeysWithPrefix(CacheUtils.CAMPAIGNS_KEY_BASE);
        if (campaignId) {
            CacheUtils.clear(CacheUtils.getCampaignKey(campaignId));
            CacheUtils.clear(CacheUtils.getCampaignsKey(`?id=${campaignId}`));
        }
    };

    /*
     * loadCampaignsCached
     * - options:
     *    - renderCached(data)
     *    - renderFresh(data)
     *    - onError(err)
     *    - params: string (query string to attach, e.g., '?limit=6')
     */
    CacheUtils.loadCampaignsCached = function (options) {
        const { renderCached, renderFresh, onError, params = '' } = options || {};
        const key = CacheUtils.getCampaignsKey(params);

        return CacheUtils.cacheFirst({
            key: key,
            ttl: CacheUtils.CAMPAIGNS_TTL,
            fetcher: async () => {
                const url = `${API.CAMPAIGNS}${params}`;
                const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
                if (!res.ok) throw new Error(`Failed to fetch campaigns (${res.status})`);
                return await res.json();
            },
            renderCached,
            renderFresh,
            onError: onError || function (err) {
                console.error('Unable to load campaigns', err);
            }
        });
    };

    // Export to global
    window.CacheUtils = CacheUtils;

})(window);
