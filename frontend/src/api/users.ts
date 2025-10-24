import apiClient from './client';

export type UserLite = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
};

type Paginated<T> = { results: T[]; count?: number; next?: string | null; previous?: string | null };

export const searchStudents = async (q?: string): Promise<UserLite[]> => {
  const { data } = await apiClient.get<UserLite[] | Paginated<UserLite>>('/api/users/', { params: { q } });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Paginated<UserLite>).results)) {
    return (data as Paginated<UserLite>).results;
  }
  return [];
};
