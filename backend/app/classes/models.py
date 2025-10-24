from django.db import models
from django.conf import settings

class Class(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_datetime = models.DateTimeField()
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='instructor_classes',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_datetime']
