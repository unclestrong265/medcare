from django.contrib import admin

from .models import Delivery, Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "pharmacy", "status", "total_price", "created_at")
    list_filter = ("status", "pharmacy")
    search_fields = ("id", "user__username", "pharmacy__name")
    list_select_related = ("user", "pharmacy")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "medicine", "quantity")
    search_fields = ("order__id", "medicine__name")
    list_select_related = ("order", "medicine")


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("order", "courier", "status", "assigned_at", "delivered_at")
    list_filter = ("status",)
    search_fields = ("order__id", "courier__username")
    list_select_related = ("order", "courier")
