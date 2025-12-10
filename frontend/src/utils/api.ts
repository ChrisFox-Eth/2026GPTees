/**
 * @module utils/api
 * @description API utility functions for making HTTP requests
 * @since 2025-11-21
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint path
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Response data
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
 * GET request
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
 * POST request
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
 * PUT request
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
 * PATCH request
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
 * DELETE request
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
