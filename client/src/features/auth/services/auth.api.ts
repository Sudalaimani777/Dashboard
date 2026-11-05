import axios, { isAxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  AuthResponseData,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth.types';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Automatically include and receive HttpOnly cookies
  withCredentials: true,
});

class AuthApiService {
  private handleError(err: unknown, defaultMessage: string): never {
    if (isAxiosError(err)) {
      const responseData = err.response?.data as ApiResponse | undefined;
      const message = responseData?.message || err.message || defaultMessage;
      throw new Error(message);
    }
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(defaultMessage);
  }

  async signup(credentials: RegisterCredentials): Promise<User> {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponseData>>(
        '/auth/signup',
        credentials
      );
      return res.data.data.user;
    } catch (err) {
      this.handleError(err, 'Failed to create account.');
    }
  }

  async signin(credentials: LoginCredentials): Promise<User> {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponseData>>(
        '/auth/signin',
        credentials
      );
      return res.data.data.user;
    } catch (err) {
      this.handleError(err, 'Failed to sign in.');
    }
  }

  async getProfile(): Promise<User> {
    try {
      const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
      return res.data.data.user;
    } catch (err) {
      this.handleError(err, 'Failed to fetch user profile.');
    }
  }

  async signout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<null>>('/auth/signout');
    } catch (err) {
      this.handleError(err, 'Failed to sign out.');
    }
  }
}

export const authApi = new AuthApiService();
