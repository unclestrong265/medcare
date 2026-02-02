from django.contrib import admin

from .models import Medicine, Order, OrderItem, Prescription

admin.site.register(Medicine)
admin.site.register(Prescription)
admin.site.register(Order)
admin.site.register(OrderItem)
