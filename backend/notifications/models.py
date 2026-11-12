from django.db import models
from django.conf import settings
from applications.models import Application
from interviews.models import Interview


class Notification(models.Model):
    TYPE_CHOICES = (
        ("application", "Application"),
        ("application_status", "Application status"),
        ("interview", "Interview"),
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    message = models.CharField(max_length=500)
    application = models.ForeignKey(
        Application,
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
    )
    interview = models.ForeignKey(
        Interview,
        on_delete=models.SET_NULL,
        related_name="notifications",
        null=True,
        blank=True,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.message
