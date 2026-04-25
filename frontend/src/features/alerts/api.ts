import apiClient from '../../lib/api/client';

export interface Alert {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  isAcknowledged: boolean;
  actionUrl?: string;
  createdAt: string;
}

export const apiGetAlerts = async (params: { page?: number; limit?: number; isAcknowledged?: boolean } = {}) => {
  const { data } = await apiClient.get<{ success: boolean; data: { alerts: Alert[]; total: number; page: number; totalPages: number } }>('/alerts', { params });
  return data.data;
};

export const apiAcknowledgeAlert = async (id: string) => {
  const { data } = await apiClient.patch<{ success: boolean; data: Alert }>('/alerts/' + id + '/acknowledge');
  return data.data;
};
