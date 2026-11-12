from django.db import models
from django.conf import settings
from applications.models import Application


class Interview(models.Model):
    STATUS_CHOICES = (
        ("Scheduled", "Scheduled"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    )

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    interviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews_as_interviewer",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews_created",
    )
    scheduled_at = models.DateTimeField()
    meeting_link = models.URLField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Scheduled",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.application.job.title} interview"
