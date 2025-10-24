from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from app.classes.models import Class
from app.enrollments.models import Enrollment


class EnrollmentAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        Group.objects.get_or_create(name='admin')
        instructor_group, _ = Group.objects.get_or_create(name='instructor')

        self.instructor = self.User.objects.create_user(username='instr', password='pass123')
        self.instructor.groups.add(instructor_group)

        self.student = self.User.objects.create_user(username='student', password='pass123')
        self.other_student = self.User.objects.create_user(username='student2', password='pass123')

        self.class_obj = Class.objects.create(
            title='Aula teste',
            description='Descricao',
            start_datetime=timezone.now() + timedelta(days=1),
            instructor=self.instructor,
        )

    def test_student_can_enroll_and_cancel(self):
        self.client.force_authenticate(self.student)
        payload = {'class_ref': self.class_obj.id}
        create_resp = self.client.post(reverse('enrollments-list'), payload, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_resp.data['student'], self.student.id)
        enrollment_id = create_resp.data['id']
        self.assertTrue(Enrollment.objects.filter(id=enrollment_id).exists())

                                      
        url = reverse('enrollments-delete-by-class', kwargs={'class_id': self.class_obj.id})
        delete_resp = self.client.delete(url)
        self.assertEqual(delete_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Enrollment.objects.filter(id=enrollment_id).exists())

    def test_duplicate_enrollment_returns_error(self):
        self.client.force_authenticate(self.student)
        payload = {'class_ref': self.class_obj.id}
        first = self.client.post(reverse('enrollments-list'), payload, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post(reverse('enrollments-list'), payload, format='json')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_instructor_can_enroll_another_student(self):
        self.client.force_authenticate(self.instructor)
        payload = {'class_ref': self.class_obj.id, 'student': self.other_student.id}
        response = self.client.post(reverse('enrollments-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student'], self.other_student.id)

                                                         
        url = reverse(
            'enrollments-delete-by-class-and-student',
            kwargs={'class_id': self.class_obj.id, 'student_id': self.other_student.id},
        )
        delete_resp = self.client.delete(url)
        self.assertEqual(delete_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Enrollment.objects.filter(class_ref=self.class_obj, student=self.other_student).exists())
