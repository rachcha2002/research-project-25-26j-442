'use strict';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CACHE_TTL_MS         = parseInt(process.env.CACHE_TTL_MS         || '600000');  // 10 min
const VOICE_CACHE_TTL_MS   = parseInt(process.env.VOICE_CACHE_TTL_MS   || '120000');  // 2 min
const CACHE_MAX_ENTRIES    = parseInt(process.env.CACHE_MAX_ENTRIES     || '500');
const SIMILARITY_THRESHOLD = parseFloat(process.env.QUERY_SIM_THRESHOLD || '0.85');   // Jaccard

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeQuery(query) {
    const STOP_WORDS = new Set([
        'a','an','the','is','are','was','were','be','been','being',
        'have','has','had','do','does','did','will','would','could',
        'should','may','might','shall','can','need','dare','ought',
        'i','my','me','we','our','you','your','he','she','it','they',
        'what','when','where','why','how','which','who','whom',
        'and','or','but','if','because','as','until','while',
        'of','at','by','for','with','about','against','between',
        'into','through','during','before','after','above','below',
        'to','from','up','down','in','out','on','off','over','under',
    ]);

    return query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w))
        .sort()
        .join(' ');
}

function jaccardSimilarity(a, b) {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 1.0 : intersection / union;
}

// ---------------------------------------------------------------------------
// CacheEntry
// ---------------------------------------------------------------------------

class CacheEntry {
    constructor(normalizedQuery, result, ttlMs) {
        this.normalizedQuery = normalizedQuery;
        this.result          = result;
        this.createdAt       = Date.now();
        this.expiresAt       = Date.now() + ttlMs;
        this.hits            = 0;
    }

    isExpired() {
        return Date.now() > this.expiresAt;
    }

    touch() {
        this.hits++;
        return this;
    }
}

// ---------------------------------------------------------------------------
// CacheStats
// ---------------------------------------------------------------------------

class CacheStats {
    constructor() {
        this.hits        = 0;
        this.misses      = 0;
        this.evictions   = 0;
        this.expirations = 0;
        this.startedAt   = Date.now();
    }

    get total()   { return this.hits + this.misses; }
    get hitRate() { return this.total === 0 ? 0 : (this.hits / this.total * 100).toFixed(1); }

    summary() {
        const uptime = Math.round((Date.now() - this.startedAt) / 1000);
        return {
            uptime_s:    uptime,
            hits:        this.hits,
            misses:      this.misses,
            evictions:   this.evictions,
            expirations: this.expirations,
            hit_rate:    `${this.hitRate}%`,
        };
    }
}

// ---------------------------------------------------------------------------
// RAGQueryCache
// ---------------------------------------------------------------------------

class RAGQueryCache {
    constructor() {
        this._store = new Map();
        this._stats = new CacheStats();

        this._sweepInterval = setInterval(() => this._sweep(), 2 * 60 * 1000);
        this._sweepInterval.unref?.();
    }

    get(query) {
        const key = normalizeQuery(query);

        if (this._store.has(key)) {
            const entry = this._store.get(key);
            if (entry.isExpired()) {
                this._store.delete(key);
                this._stats.expirations++;
                this._stats.misses++;
                return null;
            }
            this._stats.hits++;
            return { ...entry.touch().result, _cache: { hit: true, type: 'exact', hits: entry.hits } };
        }

        for (const [storedKey, entry] of this._store.entries()) {
            if (entry.isExpired()) continue;
            const sim = jaccardSimilarity(key, storedKey);
            if (sim >= SIMILARITY_THRESHOLD) {
                this._stats.hits++;
                return { ...entry.touch().result, _cache: { hit: true, type: 'similar', similarity: sim.toFixed(2), hits: entry.hits } };
            }
        }

        this._stats.misses++;
        return null;
    }

    set(query, result, ttlMs = CACHE_TTL_MS) {
        const key = normalizeQuery(query);

        if (!this._store.has(key) && this._store.size >= CACHE_MAX_ENTRIES) {
            const oldest = this._store.keys().next().value;
            this._store.delete(oldest);
            this._stats.evictions++;
        }

        this._store.set(key, new CacheEntry(key, result, ttlMs));
    }

    async getOrFetch(query, fetchFn, ttlMs = CACHE_TTL_MS) {
        const cached = this.get(query);
        if (cached) {
            console.log(`⚡ RAG cache HIT  [${cached._cache.type}]  "${query.substring(0, 60)}"`);
            return cached;
        }

        console.log(`🔍 RAG cache MISS — fetching: "${query.substring(0, 60)}"`);
        const result = await fetchFn();
        if (result && result.success) {
            this.set(query, result, ttlMs);
        }
        return result;
    }

    invalidate(query) {
        const key = normalizeQuery(query);
        return this._store.delete(key);
    }

    flush() {
        this._store.clear();
        console.log('🗑️  RAG cache flushed');
    }

    stats() {
        return { ...this._stats.summary(), size: this._store.size, max: CACHE_MAX_ENTRIES };
    }

    _sweep() {
        let removed = 0;
        for (const [key, entry] of this._store.entries()) {
            if (entry.isExpired()) {
                this._store.delete(key);
                removed++;
                this._stats.expirations++;
            }
        }
        if (removed > 0) {
            console.log(`🧹 RAG cache sweep: removed ${removed} expired entries (${this._store.size} remaining)`);
        }
    }
}

// ---------------------------------------------------------------------------
// CachedRAGService
// ---------------------------------------------------------------------------

class CachedRAGService {
    constructor(ragService) {
        this._rag   = ragService;
        this._cache = new RAGQueryCache();
    }

    async retrieveDocuments(query, topK = 6, similarityThreshold = 0.0) {
        return this._cache.getOrFetch(
            query,
            () => this._rag.retrieveDocuments(query, topK, similarityThreshold),
            CACHE_TTL_MS
        );
    }

    async retrieveForVoice(query) {
        return this._cache.getOrFetch(
            query,
            () => this._rag.retrieveForVoice(query),
            VOICE_CACHE_TTL_MS
        );
    }

    async healthCheck() { return this._rag.healthCheck(); }
    async getStats()    { return this._rag.getStats(); }

    cacheStats() { return this._cache.stats(); }
    flushCache() { return this._cache.flush(); }
}

let _cachedRAGServiceInstance = null;

function getCachedRAGService() {
    if (!_cachedRAGServiceInstance) {
        const { getRagService } = require('../services/rag.service');
        _cachedRAGServiceInstance = new CachedRAGService(getRagService());
    }
    return _cachedRAGServiceInstance;
}

// ---------------------------------------------------------------------------
// RedisConversationStore
// ---------------------------------------------------------------------------

class RedisConversationStore {
    constructor(redisClient) {
        this._redis   = redisClient;
        this._prefix  = 'chat:conv:';
        this._ttlSec  = 3600 * 24;
        this._maxMsgs = 100;
    }

    _key(conversationId) {
        return `${this._prefix}${conversationId}`;
    }

    async getHistory(conversationId) {
        const raw = await this._redis.get(this._key(conversationId));
        return raw ? JSON.parse(raw) : [];
    }

    async getConversation(conversationId) {
        return this.getHistory(conversationId);
    }

    async saveConversation(conversationId, messages) {
        const trimmed = messages.slice(-this._maxMsgs);
        await this._redis.set(this._key(conversationId), JSON.stringify(trimmed), 'EX', this._ttlSec);
    }

    async addMessage(conversationId, message) {
        const history = await this.getHistory(conversationId);
        history.push(message);
        await this.saveConversation(conversationId, history);
        return history;
    }

    async clearHistory(conversationId) {
        await this._redis.del(this._key(conversationId));
    }

    async clearConversation(conversationId) {
        return this.clearHistory(conversationId);
    }

    async getConversationCount() {
        const keys = await this._redis.keys(`${this._prefix}*`);
        return keys.length;
    }

    async clearAll() {
        const keys = await this._redis.keys(`${this._prefix}*`);
        if (keys.length > 0) await this._redis.del(...keys);
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    RAGQueryCache,
    CachedRAGService,
    getCachedRAGService,
    RedisConversationStore,
    normalizeQuery,
    jaccardSimilarity,
};
