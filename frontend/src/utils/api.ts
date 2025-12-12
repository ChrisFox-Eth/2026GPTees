/**
 * @module utils/api
 * @description API utility functions for making HTTP requests to the backend.
 * Provides a thin wrapper around fetch with automatic JSON handling, error
 * normalization, and Bearer token authentication support.
 * @since 2025-11-21
 */

/**
 * @constant {string} API_URL
 * @description Base URL for API requests, sourced from environment or defaulting to localhost
 * @private
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * @function apiRequest
 * @description Core API request function that handles fetch, JSON parsing, and error handling.
 * Automatically sets Content-Type to application/json and attaches Bearer token if provided.
 *
 * @param {string} endpoint - API endpoint path (e.g., '/api/orders')
 * @param {RequestInit} [options={}] - Standard fetch options (method, body, headers, etc.)
 * @param {string | null} [token] - Optional JWT token for Authorization header
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @throws {Error} When response is not ok (status >= 400), with message from API or generic fallback
 *
 * @example
 * const data = await apiRequest('/api/orders', { method: 'GET' }, authToken);
 *
 * @example
 * const result = await apiRequest('/api/designs', {
 *   method: 'POST',
 *   body: JSON.stringify({ prompt: 'A sunset' })
 * }, token);
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<any> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * @function apiGet
 * @description Convenience wrapper for GET requests
 *
 * @param {string} endpoint - API endpoint path
 * @param {string | null} [token] - Optional JWT token for authentication
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @example
 * const orders = await apiGet('/api/orders', token);
 */
export function apiGet(endpoint: string, token?: string | null): Promise<any> {
  return apiRequest(
    endpoint,
    {
      method: 'GET',
    },
    token
  );
}

/**
 * @function apiPost
 * @description Convenience wrapper for POST requests with JSON body
 *
 * @param {string} endpoint - API endpoint path
 * @param {any} data - Request body data (will be JSON stringified)
 * @param {string | null} [token] - Optional JWT token for authentication
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @example
 * const order = await apiPost('/api/orders', { items: cartItems }, token);
 */
export function apiPost(endpoint: string, data: any, token?: string | null): Promise<any> {
  return apiRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token
  );
}

/**
 * @function apiPut
 * @description Convenience wrapper for PUT requests with JSON body
 *
 * @param {string} endpoint - API endpoint path
 * @param {any} data - Request body data (will be JSON stringified)
 * @param {string | null} [token] - Optional JWT token for authentication
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @example
 * const updated = await apiPut('/api/orders/123', { status: 'shipped' }, token);
 */
export function apiPut(endpoint: string, data: any, token?: string | null): Promise<any> {
  return apiRequest(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    token
  );
}

/**
 * @function apiPatch
 * @description Convenience wrapper for PATCH requests with JSON body
 *
 * @param {string} endpoint - API endpoint path
 * @param {any} data - Partial data to update (will be JSON stringified)
 * @param {string | null} [token] - Optional JWT token for authentication
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @example
 * const patched = await apiPatch('/api/designs/456', { approved: true }, token);
 */
export function apiPatch(endpoint: string, data: any, token?: string | null): Promise<any> {
  return apiRequest(
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token
  );
}

/**
 * @function apiDelete
 * @description Convenience wrapper for DELETE requests
 *
 * @param {string} endpoint - API endpoint path
 * @param {string | null} [token] - Optional JWT token for authentication
 * @returns {Promise<any>} Parsed JSON response data
 *
 * @example
 * await apiDelete('/api/cart/item/789', token);
 */
export function apiDelete(endpoint: string, token?: string | null): Promise<any> {
  return apiRequest(
    endpoint,
    {
      method: 'DELETE',
    },
    token
  );
}
