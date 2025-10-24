import apiClient from './client';

export interface EnrollmentItem {
  id: number;
  student: number;
  class_ref: number;
  created_at: string;
  class_id?: number;
  class_title?: string;
  class_start_datetime?: string;
}

type Paginated<T> = { results: T[]; count?: number; next?: string | null; previous?: string | null };

const normalize = (data: any): EnrollmentItem[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as Paginated<EnrollmentItem>).results)) {
    return (data as Paginated<EnrollmentItem>).results;
  }
  return [];
};

export const getEnrollments = async (): Promise<EnrollmentItem[]> => {
  const { data } = await apiClient.get<EnrollmentItem[] | Paginated<EnrollmentItem>>('/api/enrollments/');
  return normalize(data);
};

export const getEnrollmentsByClass = async (classId: number): Promise<EnrollmentItem[]> => {
  const { data } = await apiClient.get<EnrollmentItem[] | Paginated<EnrollmentItem>>('/api/enrollments/', {
    params: { class_ref: classId },
  });
  return normalize(data);
};

export const createEnrollment = async (classId: number, studentId?: number): Promise<void> => {
  const payload: any = { class_ref: classId };
  if (studentId) payload.student = studentId;
  await apiClient.post('/api/enrollments/', payload);
};

export const deleteEnrollment = async (enrollmentId: number): Promise<void> => {
  await apiClient.delete(`/api/enrollments/${enrollmentId}/`);
};

export const deleteEnrollmentByClass = async (classId: number): Promise<void> => {
  await apiClient.delete(`/api/enrollments/by-class/${classId}/`);
};

export const deleteEnrollmentByClassForStudent = async (classId: number, studentId: number): Promise<void> => {
  await apiClient.delete(`/api/enrollments/by-class/${classId}/student/${studentId}/`);
};
