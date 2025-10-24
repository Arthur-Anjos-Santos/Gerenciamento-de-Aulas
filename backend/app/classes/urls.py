from rest_framework.routers import DefaultRouter
from .views import ClassViewSet

router = DefaultRouter()
router.register('', ClassViewSet, basename='classes')
urlpatterns = router.urls
