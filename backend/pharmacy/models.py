import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Pharmacy(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="pharmacies",
    )
    name = models.CharField(max_length=255)
    license_number = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        help_text="Government-issued pharmacy license number.",
    )
    address = models.TextField()
    contact_email = models.EmailField(max_length=254, blank=True, default="")
    contact_phone = models.CharField(max_length=32, blank=True, default="")
    owner_name = models.CharField(max_length=255, blank=True, default="")
    owner_email = models.EmailField(max_length=254, blank=True, default="")
    owner_phone = models.CharField(max_length=32, blank=True, default="")
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    verification_token = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False
    )
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner"]),
            models.Index(fields=["name"]),
            models.Index(fields=["is_verified"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return self.name

    def mark_verified(self):
        if self.is_verified:
            return
        now = timezone.now()
        self.is_verified = True
        self.verified_at = now
        if not self.is_active:
            self.is_active = True
        self.verification_token = uuid.uuid4()
        self.save(
            update_fields=[
                "is_verified",
                "verified_at",
                "is_active",
                "verification_token",
            ]
        )


class Medicine(models.Model):
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name="medicines")
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    prescription_required = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["pharmacy", "name"]),
            models.Index(fields=["prescription_required"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.pharmacy.name})"
