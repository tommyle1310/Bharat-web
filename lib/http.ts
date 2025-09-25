import axios, { AxiosInstance } from 'axios';

export const buyerApi: AxiosInstance = axios.create({
	baseURL: 'http://13.203.1.159:1310/kmsg/buyer',
	timeout: 120000,
	headers: { 'Content-Type': 'application/json' },
});

export const authApi: AxiosInstance = axios.create({
	baseURL: 'http://13.203.1.159:8002',
	timeout: 15000,
	headers: { 'Content-Type': 'application/json' },
});

// Optional: attach token from localStorage (web-only) under 'web-token'
buyerApi.interceptors.request.use((config) => {
	try {
		const token = typeof window !== 'undefined' ? localStorage.getItem('web-token') : null;
		if (token) {
			(config.headers as any).Authorization = `Bearer ${token}`;
		}
	} catch {}
	return config;
});

authApi.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('web-token') : null;
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

buyerApi.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error.config;
		if (error?.response?.status === 401 && !original._retry) {
			original._retry = true;
			try {
				const refresh = typeof window !== 'undefined' ? localStorage.getItem('web-refresh') : null;
				if (!refresh) throw error;
				const r = await authApi.post('/refresh', { refreshToken: refresh });
				const accessToken = r.data?.accessToken;
				if (accessToken && typeof window !== 'undefined') {
					localStorage.setItem('web-token', accessToken);
				}
				original.headers.Authorization = `Bearer ${accessToken}`;
				return buyerApi(original);
			} catch (e) {
				return Promise.reject(e);
			}
		}
		return Promise.reject(error);
	}
);
