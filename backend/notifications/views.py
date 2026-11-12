from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .permissions import IsNotificationRecipient
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by("-created_at")


class NotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsNotificationRecipient]
    http_method_names = ["patch", "options"]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def patch(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)
