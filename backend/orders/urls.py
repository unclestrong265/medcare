from rest_framework.routers import DefaultRouter

from .views import DeliveryViewSet, OrderViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("deliveries", DeliveryViewSet, basename="delivery")

urlpatterns = router.urls
