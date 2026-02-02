from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True, required=False
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "user",
            "user_id",
            "role",
            "phone_number",
            "address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "profile",
        ]
        read_only_fields = ["id", "is_staff", "date_joined", "profile"]

    def get_profile(self, obj):
        try:
            profile = obj.profile
        except Profile.DoesNotExist:
            return None
        return ProfileSerializer(profile).data


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(
        choices=Profile.ROLE_CHOICES, write_only=True, required=False
    )
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "phone_number",
            "address",
        ]
        read_only_fields = ["id"]

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop("role", Profile.ROLE_CUSTOMER)
        phone_number = validated_data.pop("phone_number", "")
        address = validated_data.pop("address", "")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        # Populate the profile created by signals with the provided onboarding data.
        Profile.objects.update_or_create(
            user=user,
            defaults={
                "role": role,
                "phone_number": phone_number,
                "address": address,
            },
        )
        return user
