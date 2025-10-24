import apiClient from './client';

export type InstructorLite = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type Paginated<T> = { results: T[]; count?: number; next?: string | null; previous?: string | null };

export const searchInstructors = async (q?: string): Promise<InstructorLite[]> => {
  const { data } = await apiClient.get<InstructorLite[] | Paginated<InstructorLite>>('/api/instructors/', { params: { q } });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Paginated<InstructorLite>).results)) {
    return (data as Paginated<InstructorLite>).results;
  }
  return [];
};
