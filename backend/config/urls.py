from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import ProfileViewSet, UserViewSet
from orders.views import DeliveryViewSet, OrderViewSet
from pharmacy.views import MedicineViewSet, PharmacyViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("profiles", ProfileViewSet, basename="profile")
router.register("pharmacies", PharmacyViewSet, basename="pharmacy")
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("orders", OrderViewSet, basename="order")
router.register("deliveries", DeliveryViewSet, basename="delivery")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_login"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh_alias"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]
