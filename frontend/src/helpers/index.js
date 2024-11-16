const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${apiUrl}/${cleanEndpoint}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching from:', url);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(requiresAuth),
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { 
      success: false, 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
    };
  }
};

export const postMethod = async (endpoint, body, requiresAuth = false) => {
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: createHeaders(requiresAuth),
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const putMethod = async (endpoint, body, requiresAuth = false) => {
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
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

export const deleteMethod = async (url, payload, token = '') => {
  try {
    const response = await fetch(apiUrl + url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.success === false && json.message === 'Token Expired') {
        localStorage.clear();
        window.location.replace('/');
      }
      return json;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return { success: false, error: 'Invalid JSON response' };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: error.message };
  }
}; 