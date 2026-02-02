import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Medicine, Pharmacy

User = get_user_model()
PHONE_PATTERN = re.compile(r"^[0-9+()\\s-]{7,}$")


def normalize_license_number(value: str) -> str:
    return value.strip().upper()


class PharmacySerializer(serializers.ModelSerializer):
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="owner", write_only=True, required=False
    )
    location = serializers.CharField(source="address", write_only=True, required=False)

    class Meta:
        model = Pharmacy
        fields = [
            "id",
            "owner",
            "owner_id",
            "name",
            "license_number",
            "address",
            "location",
            "contact_email",
            "contact_phone",
            "owner_name",
            "owner_email",
            "owner_phone",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def validate_license_number(self, value):
        if value is None:
            raise serializers.ValidationError("License number is required.")
        normalized = normalize_license_number(value)
        if not normalized:
            raise serializers.ValidationError("License number is required.")
        request = self.context.get("request")
        existing_license = ""
        if self.instance and self.instance.license_number:
            existing_license = self.instance.license_number.upper()
        if (
            existing_license
            and normalized != existing_license
            and not getattr(getattr(request, "user", None), "is_staff", False)
        ):
            raise serializers.ValidationError("Only admins can change license numbers.")
        existing = Pharmacy.objects.filter(license_number__iexact=normalized)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("License number already exists.")
        return normalized

    def validate_contact_phone(self, value):
        if value == "":
            raise serializers.ValidationError("Contact phone is required.")
        if value and not PHONE_PATTERN.match(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_contact_email(self, value):
        if value == "":
            raise serializers.ValidationError("Contact email is required.")
        return value

    def validate_owner_phone(self, value):
        if value == "":
            raise serializers.ValidationError("Owner phone is required.")
        if value and not PHONE_PATTERN.match(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_owner_email(self, value):
        if value == "":
            raise serializers.ValidationError("Owner email is required.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        owner_email = attrs.get("owner_email")
        if (
            owner_email
            and user
            and getattr(user, "email", "")
            and not getattr(user, "is_staff", False)
            and owner_email.lower() != user.email.lower()
        ):
            raise serializers.ValidationError(
                {"owner_email": "Owner email must match your account email."}
            )
        return attrs


class PharmacyPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = [
            "id",
            "name",
            "address",
            "contact_email",
            "contact_phone",
        ]
        read_only_fields = fields


class PharmacyRegistrationSerializer(serializers.ModelSerializer):
    location = serializers.CharField(source="address", write_only=True, required=False)

    class Meta:
        model = Pharmacy
        fields = [
            "id",
            "name",
            "license_number",
            "address",
            "location",
            "contact_email",
            "contact_phone",
            "owner_name",
            "owner_email",
            "owner_phone",
        ]
        read_only_fields = ["id"]

    def validate_license_number(self, value):
        normalized = normalize_license_number(value or "")
        if not normalized:
            raise serializers.ValidationError("License number is required.")
        if Pharmacy.objects.filter(license_number__iexact=normalized).exists():
            raise serializers.ValidationError("License number already exists.")
        return normalized

    def validate_contact_phone(self, value):
        if not value:
            raise serializers.ValidationError("Contact phone is required.")
        if not PHONE_PATTERN.match(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_owner_phone(self, value):
        if not value:
            raise serializers.ValidationError("Owner phone is required.")
        if not PHONE_PATTERN.match(value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate(self, attrs):
        required_fields = [
            "name",
            "license_number",
            "address",
            "contact_email",
            "contact_phone",
            "owner_name",
            "owner_email",
            "owner_phone",
        ]
        errors = {}
        for field in required_fields:
            value = attrs.get(field)
            if value is None or not str(value).strip():
                errors[field] = "This field is required."
        request = self.context.get("request")
        user = getattr(request, "user", None)
        owner_email = attrs.get("owner_email", "").strip()
        if user and getattr(user, "email", ""):
            if owner_email and owner_email.lower() != user.email.lower():
                errors["owner_email"] = "Owner email must match your account email."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class PharmacyVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class PharmacyActivationSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()


class MedicineSerializer(serializers.ModelSerializer):
    pharmacy_id = serializers.PrimaryKeyRelatedField(
        queryset=Pharmacy.objects.all(), source="pharmacy", write_only=True
    )

    class Meta:
        model = Medicine
        fields = [
            "id",
            "pharmacy",
            "pharmacy_id",
            "name",
            "price",
            "stock",
            "prescription_required",
        ]
        read_only_fields = ["id", "pharmacy"]
