import apiClient from '../../lib/api/client';

export const apiGetCategoryHeatmap = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: any }>('/analytics/category-heatmap');
  return data.data;
};

export const apiGetSavingsStreak = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: { currentStreak: number; bestStreak: number; history: any[] } }>('/analytics/savings-streak');
  return data.data;
};

export const apiGetTriggerMap = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: any }>('/analytics/trigger-map');
  return data.data;
};

export const apiGetWeeklyReport = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: any }>('/analytics/weekly-report');
  return data.data;
};

export const apiGetCounterfactual = async () => {
  const { data } = await apiClient.get<{ success: boolean; data: any }>('/analytics/counterfactual');
  return data.data;
};

export const apiGetAiInsight = async (payload: any) => {
  const { data } = await apiClient.post<{ success: boolean; data: { insight: string } }>('/analytics/ai-insight', payload);
  return data.data;
};

