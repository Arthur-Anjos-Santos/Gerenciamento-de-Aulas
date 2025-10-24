from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from app.classes.models import Class
from app.enrollments.models import Enrollment


class ClassAPITests(APITestCase):
    def setUp(self):
        self.User = get_user_model()
        Group.objects.get_or_create(name='admin')
        Group.objects.get_or_create(name='instructor')

        self.admin = self.User.objects.create_user(username='admin', password='pass123')
        self.admin.is_superuser = True
        self.admin.save()

        self.instructor = self.User.objects.create_user(username='instr', password='pass123')
        instructor_group = Group.objects.get(name='instructor')
        self.instructor.groups.add(instructor_group)

        self.student = self.User.objects.create_user(username='student', password='pass123')

        self.class_obj = Class.objects.create(
            title='Future class',
            description='Demo',
            start_datetime=timezone.now() + timedelta(days=2),
            instructor=self.instructor,
        )

    def _future_payload(self):
        return {
            'title': 'Nova aula',
            'description': 'Descricao',
            'start_datetime': (timezone.now() + timedelta(days=7)).isoformat(),
        }

    def test_student_cannot_create_class(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(reverse('classes-list'), self._future_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_can_create_class_and_is_auto_assigned(self):
        self.client.force_authenticate(self.instructor)
        response = self.client.post(reverse('classes-list'), self._future_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['instructor'], self.instructor.id)

    def test_student_cannot_delete_class(self):
        self.client.force_authenticate(self.student)
        url = reverse('classes-detail', args=[self.class_obj.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_participants_count_and_enrolled_flag(self):
        Enrollment.objects.create(class_ref=self.class_obj, student=self.student)

                                            
        self.client.force_authenticate(self.instructor)
        response = self.client.get(reverse('classes-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        results = data.get('results', data)
        item = next((row for row in results if row['id'] == self.class_obj.id), None)
        self.assertIsNotNone(item)
        self.assertEqual(item['participants_count'], 1)

                                    
        self.client.force_authenticate(self.student)
        detail = self.client.get(reverse('classes-detail', args=[self.class_obj.id]))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertTrue(detail.data['enrolled'])
