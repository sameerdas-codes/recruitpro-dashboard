from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.recipient = User.objects.create_user(
            username="recipient",
            email="recipient@example.com",
            password="StrongPass123!",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="StrongPass123!",
        )
        self.notification = Notification.objects.create(
            recipient=self.recipient,
            notification_type="application",
            message="A candidate applied for a job.",
        )

    def test_user_can_only_list_and_mark_own_notifications_read(self):
        self.client.force_authenticate(user=self.recipient)
        list_response = self.client.get(reverse("notification-list"))
        read_response = self.client.patch(
            reverse(
                "notification-read",
                kwargs={"pk": self.notification.pk},
            )
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertTrue(read_response.data["is_read"])

        self.client.force_authenticate(user=self.other_user)
        denied = self.client.patch(
            reverse(
                "notification-read",
                kwargs={"pk": self.notification.pk},
            )
        )
        self.assertEqual(denied.status_code, status.HTTP_404_NOT_FOUND)
