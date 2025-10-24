import apiClient from './client';

export type Me = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  groups?: string[];
  avatar_url?: string | null;
};

export const getMe = async (): Promise<Me> => {
  const { data } = await apiClient.get<Me>('/api/auth/me/');
  return data;
};

export const updateMe = async (payload: Partial<Pick<Me, 'first_name' | 'last_name' | 'email'>>): Promise<Me> => {
  const { data } = await apiClient.patch<Me>('/api/auth/me/', payload);
  return data;
};

export const changePassword = async (old_password: string, new_password: string): Promise<void> => {
  await apiClient.post('/api/auth/change-password/', { old_password, new_password });
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await apiClient.post<{ avatar_url: string }>('/api/auth/me/avatar/', fd);
  return data.avatar_url;
};
