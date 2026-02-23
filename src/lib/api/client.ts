// Unified API Client with error handling, retry logic, and request deduplication
// Provides consistent patterns across all external API calls

interface ApiClientOptions {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  retryBackoffMultiplier?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    status?: number;
  };
}

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private retryBackoffMultiplier: number;
  private requestCache = new Map<string, Promise<unknown>>();

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout ?? 10000;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.retryBackoffMultiplier = options.retryBackoffMultiplier ?? 2;
  }

  /**
   * Execute a GET request with deduplication, retry logic, and error handling
   */
  async get<T>(
    path: string,
    options?: { params?: Record<string, string | number> }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.params);

    // Return cached promise if request is already in flight
    const cached = this.requestCache.get(url);
    if (cached) {
      return cached as Promise<ApiResponse<T>>;
    }

    const promise = this.executeWithRetry<T>(url);
    this.requestCache.set(url, promise);

    // Clean up cache after request completes
    promise.finally(() => {
      this.requestCache.delete(url);
    });

    return promise;
  }

  /**
   * Execute a POST request with retry logic and error handling
   */
  async post<T>(
    path: string,
    body?: Record<string, unknown>,
    options?: { params?: Record<string, string | number> }
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options?.params);
    return this.executeWithRetry<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Build full URL from path and query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Execute request with automatic retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(url, options);

        if (response.success) {
          return response;
        }

        // If response has an error, check if we should retry
        if (response.error) {
          const shouldRetry = this.shouldRetry(response.error.status, attempt);
          if (!shouldRetry) {
            return response;
          }
          lastError = new ApiError(
            response.error.code,
            response.error.message,
            response.error.status
          );
        }
      } catch (error) {
        lastError = error instanceof ApiError
          ? error
          : new ApiError('UNKNOWN_ERROR', String(error), undefined, error);

        const shouldRetry = this.shouldRetry(lastError.status, attempt);
        if (!shouldRetry) {
          return {
            success: false,
            error: {
              code: lastError.code,
              message: lastError.message,
              status: lastError.status,
            },
          };
        }
      }

      // Wait before retrying with exponential backoff
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(this.retryBackoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: {
        code: lastError?.code ?? 'MAX_RETRIES_EXCEEDED',
        message: lastError?.message ?? 'Request failed after maximum retries',
        status: lastError?.status,
      },
    };
  }

  /**
   * Execute single request with timeout
   */
  private async executeRequest<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(
          'TIMEOUT',
          `Request timeout after ${this.timeout}ms`,
          undefined,
          error
        );
      }

      throw new ApiError(
        'FETCH_ERROR',
        `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error
      );
    }
  }

  /**
   * Determine if request should be retried based on status code
   */
  private shouldRetry(status: number | undefined, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;

    // Don't retry on client errors (4xx) except for rate limits and timeouts
    if (status && status >= 400 && status < 500) {
      return status === 408 || status === 429; // Timeout or Rate Limited
    }

    // Retry on server errors (5xx) and network errors
    return true;
  }
}

export { ApiError };
