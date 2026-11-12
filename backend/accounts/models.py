from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ("candidate", "Candidate"),
        ("hr", "HR"),
        ("interviewer", "Interviewer"),
        ("admin", "Admin"),
    )

    email = models.EmailField(unique=True)

    phone_number = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=120, blank=True)
    professional_title = models.CharField(max_length=120, blank=True)
    about = models.CharField(max_length=500, blank=True)
    education = models.TextField(max_length=1500, blank=True)
    experience = models.TextField(max_length=1500, blank=True)
    skills = models.CharField(max_length=500, blank=True)
    preferences = models.TextField(max_length=1000, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True,
    )
    default_resume = models.FileField(
        upload_to="resumes/profile/",
        blank=True,
        null=True,
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="candidate"
    )

    def __str__(self):
        return self.username


class SupportRequest(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("in_progress", "In progress"),
        ("resolved", "Resolved"),
    )

    name = models.CharField(max_length=120)
    email = models.EmailField(max_length=254)
    topic = models.CharField(max_length=40)
    message = models.TextField(max_length=3000)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "support request"
        verbose_name_plural = "support requests"

    def __str__(self):
        return f"{self.topic} from {self.name}"