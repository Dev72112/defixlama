// Unified API Client with retry, deduplication, and error handling

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// In-flight request deduplication
const inflightRequests = new Map<string, Promise<any>>();

function getCacheKey(url: string, options?: RequestInit): string {
  return `${options?.method || "GET"}:${url}`;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = 15000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const cacheKey = getCacheKey(url, fetchOptions);

  // Deduplicate identical in-flight GET requests
  if ((!fetchOptions.method || fetchOptions.method === "GET") && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)! as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const retryable = response.status >= 500 || response.status === 429;
          if (retryable && attempt < retries) {
            const backoff = retryDelay * Math.pow(2, attempt);
            await delay(backoff);
            continue;
          }
          throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            url,
            retryable
          );
        }

        return await response.json();
      } catch (err: any) {
        lastError = err;
        if (err instanceof ApiError && !err.retryable) throw err;
        if (err.name === "AbortError") {
          lastError = new ApiError("Request timeout", undefined, url, true);
        }
        if (attempt < retries) {
          await delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new ApiError("Unknown error", undefined, url);
  };

  const promise = execute().finally(() => {
    inflightRequests.delete(cacheKey);
  });

  if (!fetchOptions.method || fetchOptions.method === "GET") {
    inflightRequests.set(cacheKey, promise);
  }

  return promise;
}

// Sequential fetch with delay (for rate-limited APIs like CoinGecko)
export async function sequentialFetch<T, R>(
  items: T[],
  fetcher: (item: T) => Promise<R>,
  delayMs = 300
): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) {
    try {
      results.push(await fetcher(item));
    } catch {
      // Skip failed items
    }
    if (delayMs > 0) await delay(delayMs);
  }
  return results;
}
