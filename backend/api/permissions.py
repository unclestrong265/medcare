from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        return str(getattr(obj, "user_id", "")) == str(getattr(request.user, "id", ""))


class HasServiceRole(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        if isinstance(request.auth, dict):
            return request.auth.get("role") == "service_role"
        return False
