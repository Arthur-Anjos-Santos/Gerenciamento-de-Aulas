from django.db import models
from django.conf import settings
import os

def avatar_upload_to(instance, filename):
    base, ext = os.path.splitext(filename or "")
    ext = (ext or ".png").lower()
    return f"avatars/{instance.user_id}{ext}"

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
