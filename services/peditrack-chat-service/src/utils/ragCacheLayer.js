'use strict';

/**
 * RAG Caching Layer — Performance Optimization
 *
 * Problem:
 *   Repeated parent queries caused slow, redundant RAG lookups.
 *   With re-ranking enabled the retrieval pipeline takes 20-25 seconds
 *   on CPU, which violates the strict 4-second timeout required for
 *   the live voice path.
 *
 * Solution:
 *   JS Map-based caching layer keyed on query|topK|threshold.
 *   TTL = 5 minutes. Max 200 entries (LRU eviction).
 *   Repeated or identical queries return instant cache hits,
 *   bypassing the expensive RAG retrieval and re-ranking steps entirely.
 */

// ---------------------------------------------------------------------------
// Cache Configuration
// ---------------------------------------------------------------------------

const CACHE_TTL_MS      = 5 * 60 * 1000;   // 5 minutes — matches slide spec
const CACHE_MAX_ENTRIES = 200;              // Max 200 entries — matches slide spec

// ---------------------------------------------------------------------------
// Cache Store
// JS Map preserves insertion order, enabling simple LRU eviction
// by removing the first (oldest) key when the limit is reached.
// ---------------------------------------------------------------------------

const ragCache = new Map();

// ---------------------------------------------------------------------------
// Build Cache Key
//
// Key format:  query|topK|threshold
// Including topK and threshold ensures that the same query asked with
// different retrieval parameters does not return a mismatched result.
// ---------------------------------------------------------------------------

function buildCacheKey(query, topK, similarityThreshold) {
    const normalizedQuery = query.trim().toLowerCase();
    return `${normalizedQuery}|${topK}|${similarityThreshold}`;
}

// ---------------------------------------------------------------------------
// Get from Cache
//
// Returns the cached RAG result if it exists and has not expired.
// Returns null on a cache miss so the caller falls through to the
// actual RAG retrieval pipeline.
// ---------------------------------------------------------------------------

function getCached(query, topK, similarityThreshold) {
    const key   = buildCacheKey(query, topK, similarityThreshold);
    const entry = ragCache.get(key);

    if (!entry) {
        // Cache miss — no entry exists for this key
        return null;
    }

    const isExpired = Date.now() > entry.expiresAt;
    if (isExpired) {
        // Entry existed but its 5-minute TTL has elapsed — treat as miss
        ragCache.delete(key);
        return null;
    }

    // Cache hit — return stored result instantly (0ms vs 20-25s cold fetch)
    console.log(`⚡ RAG cache HIT: "${query.substring(0, 60)}" [topK=${topK}]`);
    return entry.result;
}

// ---------------------------------------------------------------------------
// Set to Cache
//
// Stores a RAG result under the composite key query|topK|threshold.
// Applies LRU eviction if the 200-entry limit is reached before inserting.
// ---------------------------------------------------------------------------

function setCached(query, topK, similarityThreshold, result) {
    const key = buildCacheKey(query, topK, similarityThreshold);

    // LRU eviction: when at capacity, delete the oldest inserted entry
    if (!ragCache.has(key) && ragCache.size >= CACHE_MAX_ENTRIES) {
        const oldestKey = ragCache.keys().next().value;
        ragCache.delete(oldestKey);
        console.log(`🗑️  RAG cache evicted oldest entry (limit: ${CACHE_MAX_ENTRIES})`);
    }

    ragCache.set(key, {
        result,
        cachedAt:  Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS,
    });

    console.log(`💾 RAG cache SET: "${query.substring(0, 60)}" (size: ${ragCache.size}/${CACHE_MAX_ENTRIES})`);
}

// ---------------------------------------------------------------------------
// getOrFetch — Main Entry Point
//
// 1. Check the cache using the composite key.
// 2. On hit  → return instantly (bypasses RAG + re-ranker entirely).
// 3. On miss → call fetchFn() which runs the full RAG pipeline,
//              then store the result in cache before returning.
//
// This is the function that would be called from rag.service.js
// in place of the direct axios POST to /api/rag/retrieve.
// ---------------------------------------------------------------------------

async function getOrFetch(query, topK, similarityThreshold, fetchFn) {
    // Step 1: Check cache
    const cached = getCached(query, topK, similarityThreshold);
    if (cached) {
        return cached;  // Instant return — no RAG call made
    }

    // Step 2: Cache miss — run the full retrieval pipeline (20-25s with re-ranker)
    console.log(`🔍 RAG cache MISS — running retrieval: "${query.substring(0, 60)}"`);
    const result = await fetchFn();

    // Step 3: Store successful results so the next identical query is instant
    if (result && result.success) {
        setCached(query, topK, similarityThreshold, result);
    }

    return result;
}

// ---------------------------------------------------------------------------
// invalidate — Force remove a specific query from cache
//
// Called when the knowledge base is updated so stale results
// are not served for queries that were cached before the update.
// ---------------------------------------------------------------------------

function invalidate(query, topK, similarityThreshold) {
    const key = buildCacheKey(query, topK, similarityThreshold);
    ragCache.delete(key);
}

// ---------------------------------------------------------------------------
// flush — Wipe the entire cache
//
// Useful after a bulk knowledge base re-ingestion.
// ---------------------------------------------------------------------------

function flush() {
    ragCache.clear();
    console.log('🗑️  RAG cache flushed');
}

// ---------------------------------------------------------------------------
// stats — Inspect current cache state
// ---------------------------------------------------------------------------

function stats() {
    return {
        size:        ragCache.size,
        max_entries: CACHE_MAX_ENTRIES,
        ttl_ms:      CACHE_TTL_MS,
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    getOrFetch,
    getCached,
    setCached,
    invalidate,
    flush,
    stats,
};
