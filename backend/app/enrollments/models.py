from django.db import models
from django.contrib.auth import get_user_model
from app.classes.models import Class

User = get_user_model()

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    class_ref = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('student','class_ref')]
        ordering = ['-created_at']
