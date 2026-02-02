from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Profile


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    try:
        return user.profile.role
    except Profile.DoesNotExist:
        return None


class OrderPermission(BasePermission):
    message = "You do not have permission to access orders."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        role = get_user_role(request.user)
        if request.method == "POST":
            return role == Profile.ROLE_CUSTOMER
        if request.method in SAFE_METHODS:
            return role in {Profile.ROLE_CUSTOMER, Profile.ROLE_PHARMACY}
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        role = get_user_role(request.user)
        if request.method in SAFE_METHODS:
            if role == Profile.ROLE_CUSTOMER:
                return obj.user_id == request.user.id
            if role == Profile.ROLE_PHARMACY:
                return getattr(obj.pharmacy, "owner_id", None) == request.user.id
        return False


class PharmacyPermission(BasePermission):
    message = "You do not have permission to manage this pharmacy."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return get_user_role(request.user) == Profile.ROLE_PHARMACY

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return (
            get_user_role(request.user) == Profile.ROLE_PHARMACY
            and obj.owner_id == request.user.id
        )


class MedicinePermission(BasePermission):
    message = "You do not have permission to manage this medicine."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return get_user_role(request.user) == Profile.ROLE_PHARMACY

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        return (
            get_user_role(request.user) == Profile.ROLE_PHARMACY
            and getattr(obj.pharmacy, "owner_id", None) == request.user.id
        )


class DeliveryPermission(BasePermission):
    message = "You do not have permission to access deliveries."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff:
            return True
        role = get_user_role(request.user)
        if request.method in SAFE_METHODS:
            return role == Profile.ROLE_DRIVER
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return obj.courier_id == request.user.id
        return False
