import { API_BASE_URL } from '../constants';

const getHeaders = (token?: string, isMultipart: boolean = false) => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  token?: string,
  isMultipart: boolean = false
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(token, isMultipart),
  };

  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok || (result.status === false)) {
      throw new Error(result.message || 'API Request Failed');
    }
    return result;
  } catch (error) {
    console.error(`API Error ${endpoint}:`, error);
    throw error;
  }
};
