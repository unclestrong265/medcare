from rest_framework.routers import DefaultRouter

from .views import MedicineViewSet, PharmacyViewSet

router = DefaultRouter()
router.register("pharmacies", PharmacyViewSet, basename="pharmacy")
router.register("medicines", MedicineViewSet, basename="medicine")

urlpatterns = router.urls
