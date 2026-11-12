from django.db import models
from django.conf import settings


class Job(models.Model):

    JOB_TYPES = (
        ("Full Time", "Full Time"),
        ("Part Time", "Part Time"),
        ("Internship", "Internship"),
        ("Remote", "Remote"),
    )

    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)

    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    job_type = models.CharField(
        max_length=20,
        choices=JOB_TYPES,
    )

    description = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jobs",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title