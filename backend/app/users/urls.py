from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MeView, ChangePasswordView, AvatarUploadView, UsersSearchView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/avatar/', AvatarUploadView.as_view(), name='me-avatar'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('users/', UsersSearchView.as_view(), name='users-search'),
]
