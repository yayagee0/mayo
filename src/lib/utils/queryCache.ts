/**
 * Query caching utilities for Supabase data
 * Implements caching for reflections, posts, and Q&A with invalidation rules
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number
  maxEntries?: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private maxEntries = 100

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL
    this.maxEntries = options.maxEntries || this.maxEntries
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(pattern: string | RegExp): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          keysToDelete.push(key)
        }
      } else {
        if (pattern.test(key)) {
          keysToDelete.push(key)
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Get cache stats for debugging
  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: valid / (valid + expired) || 0
    }
  }
}

// Singleton cache instance
export const queryCache = new QueryCache({
  ttl: 5 * 60 * 1000, // 5 minutes for most queries
  maxEntries: 100
})

// Cache key generators
export function getCacheKey(table: string, filters: Record<string, any> = {}): string {
  const filterString = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  
  return `${table}${filterString ? `?${filterString}` : ''}`
}

// Cache invalidation helpers
export function invalidateReflections(): void {
  queryCache.invalidate('reflections')
}

export function invalidateItems(): void {
  queryCache.invalidate('items')
}

export function invalidateInteractions(): void {
  queryCache.invalidate('interactions')
}

export function invalidateIslamicQuestions(): void {
  queryCache.invalidate('islamic_questions')
}

// Enhanced query wrapper with caching
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(cacheKey)
  if (cached !== null) {
    return cached
  }

  // Execute query and cache result
  try {
    const result = await queryFn()
    queryCache.set(cacheKey, result, ttl)
    return result
  } catch (error) {
    // Don't cache errors
    throw error
  }
}