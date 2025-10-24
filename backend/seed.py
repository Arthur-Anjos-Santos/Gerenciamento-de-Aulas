import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

g_admin, _ = Group.objects.get_or_create(name='admin')
g_instr, _ = Group.objects.get_or_create(name='instructor')

U = get_user_model()

def ensure_user(username, email, password, is_staff=False, is_superuser=False, groups=None):
    user, _ = U.objects.get_or_create(username=username, defaults={"email": email, "is_active": True})
    if email and user.email != email:
        user.email = email
    user.is_staff = is_staff
    user.is_superuser = is_superuser
    user.set_password(password)
    user.save()
    if groups is not None:
        user.groups.set(groups)
    return user

ensure_user("instrutor1", "instrutor1@example.com", "Senha@123", is_staff=True, groups=[g_instr])
ensure_user("instrutor2", "instrutor2@example.com", "Senha@123", is_staff=True, groups=[g_instr])
ensure_user("admin", "admin@example.com", "Admin@123", is_staff=True, is_superuser=True, groups=[g_admin])

for i in range(1, 6):
    ensure_user(f"aluno{i}", f"aluno{i}@example.com", "Senha@123", is_staff=False, is_superuser=False, groups=[])
print("ok")
