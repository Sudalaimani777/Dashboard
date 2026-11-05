import type {
  ApiResponse,
  AuthResponseData,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth.types';

const API_BASE_URL = 'http://localhost:5000/api';

class AuthApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Include cookies so HttpOnly session cookie is saved & sent automatically
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'An unexpected authentication error occurred.');
      }

      return data;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Network error. Unable to reach authentication server.');
    }
  }

  async signup(credentials: RegisterCredentials): Promise<User> {
    const res = await this.request<AuthResponseData>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data.user;
  }

  async signin(credentials: LoginCredentials): Promise<User> {
    const res = await this.request<AuthResponseData>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return res.data.user;
  }

  async getProfile(): Promise<User> {
    const res = await this.request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
    return res.data.user;
  }

  async signout(): Promise<void> {
    await this.request<null>('/auth/signout', {
      method: 'POST',
    });
  }
}

export const authApi = new AuthApiService();
