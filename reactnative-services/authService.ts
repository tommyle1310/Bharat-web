import axios, { AxiosInstance } from 'axios';
import { useUserStore } from '../reactnative-stores/userStore';

// Auth API has a different base URL than the rest of the app
const AUTH_BASE_URL = 'http://13.203.1.159:8001';
const AUTH_BASE_URL_NAME = `http://13.203.1.159:1310/kmsg/buyer`;

const authClient: AxiosInstance = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authClientName: AxiosInstance = axios.create({
  baseURL: AUTH_BASE_URL_NAME,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Log requests/responses and normalize errors for better visibility
authClient.interceptors.request.use((config) => {
  console.log('[auth] request:', {
    method: config.method,
    url: `${config.baseURL || ''}${config.url || ''}`,
    data: config.data,
    headers: config.headers,
  });
  return config;
});

authClient.interceptors.response.use(
  (response) => {
    console.log('[auth] response:', {
      url: response.config?.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const url = `${error?.config?.baseURL || ''}${error?.config?.url || ''}`;
    const data = error?.response?.data;
    const message = data?.message || error?.message || 'Request failed';
    console.error('[auth] error:', { status, url, data, message });
    return Promise.reject(error);
  }
);

export type BusinessVertical = 'I' | 'B' | 'A';

export interface RegisterPayloadBase {
  name: string;
  phone: string;
  email: string;
  address: string;
  state_id: string;
  city_id: number;
  pin_number: string;
  company_name: string;
  aadhaar_number: string;
  pan_number: string;
  business_vertical: BusinessVertical;
}

export type RegisterPayload =
  | (RegisterPayloadBase & {
      aadhaar_front_image?: any;
      aadhaar_back_image?: any;
      pan_image?: any;
    })
  | FormData;

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  category: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserNameResponse {
  name: string;
  id: number;
  email: string;
  mobile: string;
  business_vertical: string;
  address: string;
  aadhaar_number: string;
  pan_number: string;
  company_name: string;
  pincode: string;
  

}

export interface ForgotPasswordResponse {
  message: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const client = authClient;
    console.log('check payload:', payload);
    const response = await client.post('/register', payload as any, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    console.log('Register response:', response);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await authClient.post('/login', payload);
    console.log('cehck login response:', response);
    return response.data;
  },

  async logout(token?: string): Promise<void> {
    // Get token from parameter or from store
    const authToken = token || useUserStore.getState().token;
    console.log('Logout token:', authToken);
    const config = {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    const result = await authClient.post('/logout', {}, config);
    return result.data;
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    console.log('Refresh token request:', { refreshToken });
    const response = await authClient.post('/refresh', { refreshToken });
    console.log('Refresh token response:', response);
    return response.data;
  },

  async getNameByPhone(phone: string): Promise<UserNameResponse> {
    const response = await authClientName.get(`buyers/name/${phone}`);
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await authClient.post('/forgot-password', { email });
    return response.data;
  },
};

export default authService;


