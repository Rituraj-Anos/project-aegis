import apiClient from '../../lib/api/client';
import type { User } from '../../auth/AuthProvider';

export const apiUpdateProfile = async (userData: Partial<User>) => {
  const { data } = await apiClient.patch<{ success: boolean; data: User }>('/users/me', userData);
  return data.data;
};

export const apiDeleteAccount = async () => {
  const { data } = await apiClient.delete<{ success: boolean }>('/users/me');
  return data;
};

export const apiUpdateCoachState = async (state: 0 | 1 | 2) => {
  const { data } = await apiClient.patch<{ success: boolean; data: User }>('/users/me/coach-state', { coachState: state });
  return data.data;
};
