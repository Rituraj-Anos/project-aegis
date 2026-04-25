import apiClient from '../../lib/api/client';

export const apiGetShadow = async (amount: number) => {
  const { data } = await apiClient.post<{ success: boolean; data: any }>('/shadow/calculate', { amount });
  return data.data;
};
