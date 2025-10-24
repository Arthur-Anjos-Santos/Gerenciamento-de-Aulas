from rest_framework.routers import DefaultRouter
from .views import EnrollmentViewSet

router = DefaultRouter()
router.register('', EnrollmentViewSet, basename='enrollments')

urlpatterns = router.urls
