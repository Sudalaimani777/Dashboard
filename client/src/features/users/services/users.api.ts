import { isAxiosError } from 'axios';
import { travelApiClient } from '../../travel/services/travel.api';
import type {
  CreateUserPayload,
  DirectoryUser,
  UpdateUserPayload,
} from '../utils/users.utils';

function extractError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const msg =
      (err.response?.data as { message?: string; error?: string } | undefined)?.message ||
      (err.response?.data as { error?: string } | undefined)?.error ||
      err.message;
    return new Error(msg || fallback);
  }
  return err instanceof Error ? err : new Error(fallback);
}

export const usersApi = {
  async listUsers(): Promise<DirectoryUser[]> {
    try {
      const res = await travelApiClient.get<{ data: { users: DirectoryUser[] } }>('/users');
      return res.data.data.users;
    } catch (err) {
      throw extractError(err, 'Failed to load team directory.');
    }
  },

  async createUser(payload: CreateUserPayload): Promise<DirectoryUser> {
    try {
      const res = await travelApiClient.post<{ data: { user: DirectoryUser } }>('/users', payload);
      return res.data.data.user;
    } catch (err) {
      throw extractError(err, 'Failed to create member.');
    }
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<DirectoryUser> {
    try {
      const res = await travelApiClient.patch<{ data: { user: DirectoryUser } }>(
        `/users/${id}`,
        payload
      );
      return res.data.data.user;
    } catch (err) {
      throw extractError(err, 'Failed to update member.');
    }
  },
};
