from rest_framework.permissions import BasePermission, SAFE_METHODS

def is_admin(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.groups.filter(name='admin').exists()))

def is_instructor(user):
    return bool(user and user.is_authenticated and user.groups.filter(name='instructor').exists())

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)

class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return is_instructor(request.user)

class IsAdminOrInstructor(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (is_admin(u) or is_instructor(u)))

class ReadOnlyOrAdminInstructor(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return IsAdminOrInstructor().has_permission(request, view)
