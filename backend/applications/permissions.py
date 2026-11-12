from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsApplicationParticipant(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        if request.method == "POST":
            return request.user.role == "candidate"

        return request.user.role in ("candidate", "hr", "admin")

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS or request.user.role == "admin":
            return True

        if request.method in ("PUT", "PATCH"):
            return (
                request.user.role == "hr"
                and obj.job.created_by_id == request.user.id
            )

        if request.method == "DELETE":
            return (
                request.user.role == "candidate"
                and obj.candidate_id == request.user.id
            ) or (
                request.user.role == "hr"
                and obj.job.created_by_id == request.user.id
            )

        return False
