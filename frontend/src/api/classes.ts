import apiClient from './client';

export type ClassItem = {
  id: number;
  title: string;
  description: string;
  start_datetime: string;
  instructor?: number | null;
  instructor_username?: string | null;
  participants_count?: number;
  enrolled?: boolean;
};

type Paginated<T> = {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

const extractResults = <T>(data: T[] | Paginated<T>): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

export const getClasses = async (): Promise<ClassItem[]> => {
  const { data } = await apiClient.get<ClassItem[] | Paginated<ClassItem>>('/api/classes/');
  return extractResults(data);
};

export const getClass = async (id: number): Promise<ClassItem> => {
  const { data } = await apiClient.get<ClassItem>(`/api/classes/${id}/`);
  return data;
};

export const createClass = async (payload: Partial<ClassItem>): Promise<ClassItem> => {
  const { data } = await apiClient.post<ClassItem>('/api/classes/', payload);
  return data;
};

export const updateClass = async (id: number, payload: Partial<ClassItem>): Promise<ClassItem> => {
  const { data } = await apiClient.put<ClassItem>(`/api/classes/${id}/`, payload);
  return data;
};

export const deleteClass = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/classes/${id}/`);
};
