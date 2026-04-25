import apiClient from '../../lib/api/client';

export interface Budget {
  totalLimit: number;
  categories: Record<string, number>;
  monthlyReset: boolean;
  strictMode: boolean;
  thresholds: { warning: number; critical: number };
}

export const apiGetBudget = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: Budget }>('/budgets');
  return data.data;
};

export const apiSaveBudget = async (budget: Partial<Budget>) => {
  const { data } = await apiClient.put<{ success: boolean; data: Budget }>('/budgets', budget);
  return data.data;
};
