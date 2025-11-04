// API Configuration Utility for Production Deployment
// This ensures all API calls work both locally and on Render

/**
 * Get the base API URL dynamically based on environment
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = () => {
  // CRITICAL: For local development, always use localhost
  // Check if we're in development mode (not production build)
  const isDevelopment = import.meta.env.DEV || !import.meta.env.PROD;
  
  // Force localhost for development to avoid hitting Render backend
  if (isDevelopment) {
    console.log('🔧 [API Config] Development mode detected - using localhost:3001');
    return 'http://localhost:3001';
  }
  
  // Check for environment variables (for production/staging)
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 [API Config] Using VITE_API_URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // For production builds, use the same host as the frontend
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    const url = `${protocol}//${host}`;
    console.log('🔧 [API Config] Production mode - using same host:', url);
    return url;
  }
  
  // Default fallback to localhost
  console.log('🔧 [API Config] Default fallback - using localhost:3001');
  return 'http://localhost:3001';
};

/**
 * Get the full API URL with /api path
 * @returns {string} The full API URL
 */
export const getApiUrl = () => {
  return `${getApiBaseUrl()}/api`;
};

/**
 * Get the WebSocket URL for real-time connections
 * @returns {string} The WebSocket URL
 */
export const getWebSocketUrl = () => {
  // Check for explicit WebSocket URL first
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Derive from base URL
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - The API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const url = `${getApiUrl()}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ API Request failed:`, error);
    throw error;
  }
};

// Log configuration on import for debugging
console.log('🔧 API Configuration:');
console.log('  Environment:', import.meta.env.MODE || 'development');
console.log('  Production build:', import.meta.env.PROD || false);
console.log('  Base URL:', getApiBaseUrl());
console.log('  API URL:', getApiUrl());
console.log('  WebSocket URL:', getWebSocketUrl());

if (import.meta.env.VITE_API_URL) {
  console.log('  Using VITE_API_URL:', import.meta.env.VITE_API_URL);
}
if (import.meta.env.VITE_WS_URL) {
  console.log('  Using VITE_WS_URL:', import.meta.env.VITE_WS_URL);
}