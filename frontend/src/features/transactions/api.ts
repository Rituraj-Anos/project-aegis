import apiClient from '../../lib/api/client';

export interface Transaction {
  _id: string;
  amount: number;
  category: string;
  merchantName: string;
  description?: string;
  date: string;
  source: 'csv' | 'manual' | 'mock_api';
  isIntercepted: boolean;
  tags: string[];
  isRecurring: boolean;
}

export const apiGetTransactions = async (params: { page?: number; limit?: number; category?: string; search?: string }) => {
  const { data } = await apiClient.get<{ success: boolean; data: { transactions: Transaction[]; total: number; page: number; totalPages: number } }>('/transactions', { params });
  return data.data;
};

export const apiCreateTransaction = async (txData: Partial<Transaction>) => {
  const { data } = await apiClient.post<{ success: boolean; data: Transaction }>('/transactions', txData);
  return data.data;
};

export const apiUploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ success: boolean; data: { imported: number; skipped: number } }>('/transactions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data.data;
};

export const apiDeleteTransaction = async (id: string) => {
  const { data } = await apiClient.delete<{ success: boolean }>('/transactions/' + id);
  return data;
};

export const apiStartMockFeed = async () => {
  const { data } = await apiClient.post<{ success: boolean; data: { started: boolean } }>('/transactions/mock-feed');
  return data.data;
};

export const apiStopMockFeed = async () => {
  return { stopped: true };
};
