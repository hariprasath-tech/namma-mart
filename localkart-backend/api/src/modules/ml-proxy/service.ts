import { config } from '../../config.js';
import { AppError } from '../../plugins/errors.js';

interface StaleCacheEntry<T> {
  data: T;
  cachedAt: number;
}

export class MLProxyService {
  private baseUrl: string;
  private circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private cooldownMs = 10000; // 10s cooldown when OPEN
  private cache = new Map<string, StaleCacheEntry<any>>();

  constructor(baseUrl = config.ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  private checkCircuit(): boolean {
    if (this.circuitState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.circuitState = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  private recordSuccess() {
    this.failureCount = 0;
    this.circuitState = 'CLOSED';
  }

  private recordFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 3) {
      this.circuitState = 'OPEN';
    }
  }

  public getCircuitStatus() {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }

  /**
   * Dispatches an HTTP request to ML microservice with 3s timeout, 1 retry, and stale fallback.
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    const isCircuitPermitted = this.checkCircuit();

    if (!isCircuitPermitted) {
      // Circuit OPEN: Immediately fallback to stale cache if present
      if (cacheKey && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        return {
          ...cached.data,
          meta: { ...(cached.data as any).meta, stale: true },
        };
      }
      throw new AppError(
        503,
        'ML_SERVICE_UNAVAILABLE',
        'ML inference circuit breaker is open.',
        'The machine learning service is recovering. Fallback telemetry is active.'
      );
    }

    // Try request with 1 retry
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

      try {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`ML service returned HTTP ${res.status}: ${res.statusText}`);
        }

        const data = (await res.json()) as T;
        this.recordSuccess();

        // Update stale cache
        if (cacheKey) {
          this.cache.set(cacheKey, { data, cachedAt: Date.now() });
        }

        return data;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 100)); // Short backoff before retry
        }
      }
    }

    // Both attempts failed: record circuit failure
    this.recordFailure();

    // Check if stale fallback available
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        ...cached.data,
        meta: { ...(cached.data as any).meta, stale: true },
      };
    }

    throw new AppError(
      503,
      'ML_SERVICE_DOWN',
      `ML microservice request failed: ${lastError?.message || 'Timeout'}`,
      'Please verify that the FastAPI ML container or service is started.'
    );
  }

  // Pre-configured typed calls matching ML endpoints:
  async getCrowd(shopId: string) {
    return this.request<any>(`/crowd/live?shopId=${shopId}`, { method: 'GET' }, `crowd_${shopId}`);
  }

  async getFootfallByHour(shopId: string, date: string) {
    return this.request<number[]>(`/footfall/${shopId}?date=${date}`, { method: 'GET' }, `footfall_${shopId}_${date}`);
  }

  async getZones(shopId: string) {
    return this.request<any[]>(`/zones/${shopId}`, { method: 'GET' }, `zones_${shopId}`);
  }

  async getForecast(shopId: string, productId: string, days = 7) {
    return this.request<any[]>(`/forecast/${shopId}/${productId}?days=${days}`, { method: 'GET' }, `forecast_${shopId}_${productId}`);
  }

  async getAssociations(shopId: string) {
    return this.request<any[]>(`/associations/${shopId}`, { method: 'GET' }, `assoc_${shopId}`);
  }
}

export const mlProxy = new MLProxyService();
