from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from accounts.models import Profile
from accounts.permissions import DeliveryPermission, OrderPermission, get_user_role
from .models import Delivery, Order
from .serializers import DeliverySerializer, OrderCreateSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, OrderPermission]
    serializer_class = OrderSerializer

    def get_queryset(self):
        queryset = Order.objects.select_related("user", "pharmacy").prefetch_related(
            "items__medicine"
        )
        if self.request.user.is_staff:
            return queryset
        role = get_user_role(self.request.user)
        if role == Profile.ROLE_CUSTOMER:
            return queryset.filter(user=self.request.user)
        if role == Profile.ROLE_PHARMACY:
            return queryset.filter(pharmacy__owner=self.request.user)
        return queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff can update orders.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff can delete orders.")
        instance.delete()


class DeliveryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, DeliveryPermission]
    serializer_class = DeliverySerializer

    def get_queryset(self):
        queryset = Delivery.objects.select_related("order", "courier", "order__pharmacy")
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(courier=self.request.user)

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff can create deliveries.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff can update deliveries.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only staff can delete deliveries.")
        instance.delete()
