from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from pharmacy.models import Medicine

from .models import Delivery, Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "order", "medicine", "quantity"]
        read_only_fields = ["id", "order"]


class OrderItemCreateSerializer(serializers.ModelSerializer):
    medicine = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.select_related("pharmacy")
    )

    class Meta:
        model = OrderItem
        fields = ["medicine", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "pharmacy",
            "status",
            "total_price",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "total_price",
            "items",
            "created_at",
            "updated_at",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["id", "pharmacy", "items"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        pharmacy = attrs["pharmacy"]
        if not attrs["items"]:
            raise serializers.ValidationError("Order must include at least one item.")
        for item in attrs["items"]:
            medicine = item["medicine"]
            if medicine.pharmacy_id != pharmacy.id:
                raise serializers.ValidationError(
                    "All items must belong to the selected pharmacy."
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = validated_data.pop("user")
        order = Order.objects.create(user=user, **validated_data)

        total = Decimal("0.00")
        for item in items_data:
            medicine = item["medicine"]
            quantity = item["quantity"]
            # Total price is based on current medicine pricing at order time.
            total += medicine.price * quantity
            OrderItem.objects.create(
                order=order,
                medicine=medicine,
                quantity=quantity,
            )

        order.total_price = total
        order.save(update_fields=["total_price"])
        return order


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = "__all__"
        read_only_fields = ["id"]
