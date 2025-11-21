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
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
export function apiGet(endpoint: string, token?: string): Promise<any> {
  return apiRequest(endpoint, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * POST request
 */
export function apiPost(endpoint: string, data: any, token?: string): Promise<any> {
  return apiRequest(endpoint, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 */
export function apiPut(endpoint: string, data: any, token?: string): Promise<any> {
  return apiRequest(endpoint, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export function apiDelete(endpoint: string, token?: string): Promise<any> {
  return apiRequest(endpoint, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
