const API_BASE_URL = 'http://localhost:5000';

export const getToken = () => localStorage.getItem('token');

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || 'Request failed';
    } catch (e) {
      errorMessage = errorText || `HTTP error! status: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Response text:', text);
  }

  if (!text || text.trim() === '') {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text);
    throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
  }
};

const createHeaders = (requiresAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getMethod = async (endpoint, requiresAuth = false) => {
  try {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${API_BASE_URL}/api/${cleanEndpoint}`;
    
    console.log('Making GET request to:', url);
    
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

  if (!response.ok) {
    const error = new Error('HTTP error! status: ' + response.status);
    error.status = response.status;
    throw error;
  }

    const data = await response.json();
    return {
      success: true,
      data
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const postMethod = async (endpoint, body, requiresAuth = false) => {
  try {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const url = `${API_BASE_URL}/api/${cleanEndpoint}`;
    
    console.log('Making POST request to:', url);
    
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using token:', token);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const putMethod = async (endpoint, body, requiresAuth = false) => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Putting to:', url);
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: createHeaders(requiresAuth),
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteMethod = async (endpoint, body = null, requiresAuth = false) => {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/${cleanEndpoint}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Deleting from:', url);
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: createHeaders(requiresAuth),
      ...(body && { body: JSON.stringify(body) }),
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}; 