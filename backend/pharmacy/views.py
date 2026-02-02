from django.conf import settings
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Profile
from accounts.permissions import MedicinePermission, PharmacyPermission, get_user_role
from .models import Medicine, Pharmacy
from .serializers import (
    MedicineSerializer,
    PharmacyActivationSerializer,
    PharmacyPublicSerializer,
    PharmacyRegistrationSerializer,
    PharmacySerializer,
    PharmacyVerificationSerializer,
)


class PharmacyViewSet(viewsets.ModelViewSet):
    serializer_class = PharmacySerializer
    permission_classes = [IsAuthenticated, PharmacyPermission]

    def get_queryset(self):
        queryset = Pharmacy.objects.all()
        if self.request.user.is_staff:
            return queryset
        role = get_user_role(self.request.user)
        if role == Profile.ROLE_PHARMACY:
            return queryset.filter(owner=self.request.user)
        return queryset.filter(is_active=True, is_verified=True)

    def get_permissions(self):
        if self.action == "verify":
            return [AllowAny()]
        if self.action == "activation":
            return [IsAdminUser()]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return PharmacyRegistrationSerializer
        if self.action == "verify":
            return PharmacyVerificationSerializer
        if self.action == "activation":
            return PharmacyActivationSerializer
        if self.action in {"list", "retrieve"}:
            role = get_user_role(self.request.user)
            if not self.request.user.is_staff and role != Profile.ROLE_PHARMACY:
                return PharmacyPublicSerializer
        return PharmacySerializer

    def perform_create(self, serializer):
        role = get_user_role(self.request.user)
        if self.request.user.is_staff:
            pharmacy = serializer.save(
                owner=self.request.user,
                is_active=False,
                is_verified=False,
            )
            self._send_verification_email(pharmacy)
            return
        if role == Profile.ROLE_PHARMACY:
            pharmacy = serializer.save(
                owner=self.request.user,
                is_active=False,
                is_verified=False,
            )
            self._send_verification_email(pharmacy)
            return
        raise PermissionDenied("Only pharmacy accounts can create pharmacies.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        pharmacy = serializer.instance
        output_serializer = PharmacySerializer(
            pharmacy, context=self.get_serializer_context()
        )
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_update(self, serializer):
        if self.request.user.is_staff:
            serializer.save()
            return
        serializer.save(owner=self.request.user)

    def _send_verification_email(self, pharmacy: Pharmacy) -> None:
        recipient = pharmacy.owner_email or getattr(pharmacy.owner, "email", "")
        if not recipient:
            return
        token = pharmacy.verification_token
        base_url = getattr(settings, "PHARMACY_VERIFICATION_URL", "")
        verification_url = ""
        if base_url:
            separator = "&" if "?" in base_url else "?"
            verification_url = f"{base_url}{separator}token={token}"

        message_lines = [
            f"Hello {pharmacy.owner_name or getattr(pharmacy.owner, 'username', '')},",
            "",
            "Your pharmacy registration is almost complete.",
            f"Verification code: {token}",
        ]
        if verification_url:
            message_lines.append(f"Verification link: {verification_url}")

        send_mail(
            subject="Verify your pharmacy registration",
            message="\n".join(message_lines),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[recipient],
            fail_silently=False,
        )
        pharmacy.verification_sent_at = timezone.now()
        pharmacy.save(update_fields=["verification_sent_at"])

    @action(detail=False, methods=["post"], authentication_classes=[])
    def verify(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        pharmacy = get_object_or_404(Pharmacy, verification_token=token)
        if pharmacy.is_verified:
            return Response(
                {"detail": "Pharmacy already verified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pharmacy.mark_verified()
        output_serializer = PharmacySerializer(
            pharmacy, context=self.get_serializer_context()
        )
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def activation(self, request, pk=None):
        pharmacy = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pharmacy.is_active = serializer.validated_data["is_active"]
        pharmacy.save(update_fields=["is_active"])
        output_serializer = PharmacySerializer(
            pharmacy, context=self.get_serializer_context()
        )
        return Response(output_serializer.data, status=status.HTTP_200_OK)


class MedicineViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, MedicinePermission]

    def get_queryset(self):
        queryset = Medicine.objects.select_related("pharmacy")
        if self.request.user.is_staff:
            return queryset
        role = get_user_role(self.request.user)
        if role == Profile.ROLE_PHARMACY:
            return queryset.filter(pharmacy__owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        pharmacy = serializer.validated_data["pharmacy"]
        if not self.request.user.is_staff and pharmacy.owner_id != self.request.user.id:
            raise PermissionDenied(
                "You do not have permission to add medicines to this pharmacy."
            )
        serializer.save()
