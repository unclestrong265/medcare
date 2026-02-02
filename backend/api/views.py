from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Medicine, Order, Prescription
from .permissions import HasServiceRole
from .serializers import MedicineSerializer, OrderSerializer, PrescriptionSerializer


class UserOwnedQuerysetMixin:
    user_field = "user_id"

    def get_queryset(self):
        user_id = getattr(self.request.user, "id", None)
        if not user_id:
            return self.queryset.none()
        return self.queryset.filter(**{self.user_field: user_id})

    def perform_create(self, serializer):
        serializer.save(**{self.user_field: self.request.user.id})


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().order_by("name")
    serializer_class = MedicineSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [HasServiceRole()]


class PrescriptionViewSet(UserOwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Prescription.objects.all().order_by("-created_at")
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]


class OrderViewSet(UserOwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
