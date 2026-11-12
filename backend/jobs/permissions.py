from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsJobOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role in ("hr", "admin")

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return request.user.role == "admin" or (
            request.user.role == "hr" and obj.created_by_id == request.user.id
        )
