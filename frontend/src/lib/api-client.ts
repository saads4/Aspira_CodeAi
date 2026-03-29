// ─── API Client — Aspira TAT Monitor ────────────────────────────────────────
// Centralised HTTP client that wraps fetch with:
//   • Base URL from env
//   • Automatic retry with exponential backoff (network errors)
//   • Timeout enforcement
//   • Normalised error shape
//   • Request deduplication guard for concurrent identical requests
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// In the browser: use relative URLs so Next.js rewrites proxy to the backend.
// In SSR: use the full URL from env.
const BASE_URL = "http://localhost:5000";

// In-flight request deduplication map (GET only)
const inflight = new Map<string, Promise<Response>>();

/**
 * Core fetch wrapper with timeout + retry.
 */
async function fetchWithRetry(
  url: string,
  options: RequestOptions = {},
): Promise<Response> {
  const { timeout = 10_000, retries = 3, retryDelay = 500, ...fetchOptions } = options;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeout);

  const isGet = !fetchOptions.method || fetchOptions.method === 'GET';
  const cacheKey = isGet ? url : null;

  // Deduplicate in-flight GETs
  if (cacheKey && inflight.has(cacheKey)) {
    clearTimeout(tid);
    return inflight.get(cacheKey)!;
  }

  const attempt = async (attemptsLeft: number): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      return response;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') throw err;
      if (attemptsLeft <= 1) throw err;
      await delay(retryDelay * (retries - attemptsLeft + 1));
      return attempt(attemptsLeft - 1);
    }
  };

  const promise = attempt(retries).finally(() => {
    clearTimeout(tid);
    if (cacheKey) inflight.delete(cacheKey);
  });

  if (cacheKey) inflight.set(cacheKey, promise);

  return promise;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic JSON request helper. Throws ApiError on non-2xx.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetchWithRetry(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    });
  } catch (err: unknown) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(408, 'TIMEOUT', 'Request timed out');
    }
    throw new ApiError(0, 'NETWORK_ERROR', `Network error: ${(err as Error).message}`);
  }

  // Parse response body once
  let data: any;

  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError(response.status, 'PARSE_ERROR', 'Failed to parse JSON response');
  }

  if (!response.ok) {
    const message = data?.message || `HTTP ${response.status}`;
    throw new ApiError(response.status, 'API_ERROR', message);
  }

  return data as T;
}

// ─── Typed API methods ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { method: 'GET', ...options });
  },

  post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },
};

// ─── Query string builder ───────────────────────────────────────────────────
export function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}
