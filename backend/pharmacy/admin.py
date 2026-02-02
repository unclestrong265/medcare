from django.contrib import admin

from .models import Medicine, Pharmacy


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "license_number",
        "owner",
        "address",
        "is_verified",
        "is_active",
    )
    list_filter = ("is_verified", "is_active")
    search_fields = ("name", "license_number", "address", "owner__username")


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("name", "pharmacy", "price", "stock", "prescription_required")
    list_filter = ("prescription_required", "pharmacy")
    search_fields = ("name",)
    list_select_related = ("pharmacy",)
