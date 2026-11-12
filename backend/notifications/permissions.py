from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsNotificationRecipient(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.recipient_id == request.user.id
        return obj.recipient_id == request.user.id
