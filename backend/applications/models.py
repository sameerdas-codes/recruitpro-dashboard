from django.db import models
from django.conf import settings
from jobs.models import Job


class Application(models.Model):

    STATUS_CHOICES = (
        ("Pending", "Pending"),
        ("Shortlisted", "Shortlisted"),
        ("Rejected", "Rejected"),
    )

    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    resume = models.FileField(
        upload_to="resumes/",
    )

    cover_letter = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending",
    )

    applied_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.candidate.username} - {self.job.title}"