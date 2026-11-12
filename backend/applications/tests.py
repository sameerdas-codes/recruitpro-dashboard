from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from jobs.models import Job
from notifications.models import Notification
from .models import Application


class ApplicationPermissionTests(APITestCase):
    def setUp(self):
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="StrongPass123!",
        )
        self.other_candidate = User.objects.create_user(
            username="other-candidate",
            email="other-candidate@example.com",
            password="StrongPass123!",
        )
        self.hr = User.objects.create_user(
            username="hr",
            email="hr@example.com",
            password="StrongPass123!",
            role="hr",
        )
        self.other_hr = User.objects.create_user(
            username="other-hr",
            email="other-hr@example.com",
            password="StrongPass123!",
            role="hr",
        )
        self.job = Job.objects.create(
            title="Developer",
            company="Example Co",
            location="Remote",
            salary="120000.00",
            job_type="Full Time",
            description="Build software",
            created_by=self.hr,
        )

    def create_application(self):
        return self.client.post(
            reverse("application-list-create"),
            {
                "job": self.job.pk,
                "resume": SimpleUploadedFile(
                    "resume.pdf",
                    b"%PDF-1.4\nresume",
                    content_type="application/pdf",
                ),
                "status": "Shortlisted",
            },
            format="multipart",
        )

    def test_candidate_cannot_set_status_or_view_another_candidates_resume(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.client.force_authenticate(user=self.candidate)
                response = self.create_application()

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(response.data["status"], "Pending")
                application = Application.objects.get(candidate=self.candidate)
                self.assertTrue(
                    Notification.objects.filter(
                        recipient=self.hr,
                        application=application,
                        notification_type="application",
                    ).exists()
                )
                self.assertTrue(
                    Notification.objects.filter(
                        recipient=self.candidate,
                        application=application,
                        notification_type="application",
                        message__contains="submitted successfully",
                    ).exists()
                )

                self.client.force_authenticate(user=self.other_candidate)
                resume_response = self.client.get(
                    reverse("application-resume", kwargs={"pk": application.pk})
                )

                self.assertEqual(
                    resume_response.status_code,
                    status.HTTP_404_NOT_FOUND,
                )

    def test_only_hr_for_the_job_can_change_application_status(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.client.force_authenticate(user=self.candidate)
                created = self.create_application()
                application = Application.objects.get(candidate=self.candidate)
                detail_url = reverse(
                    "application-detail",
                    kwargs={"pk": application.pk},
                )

                self.client.force_authenticate(user=self.other_hr)
                denied = self.client.patch(detail_url, {"status": "Rejected"})
                self.assertEqual(denied.status_code, status.HTTP_404_NOT_FOUND)

                self.client.force_authenticate(user=self.hr)
                updated = self.client.patch(detail_url, {"status": "Shortlisted"})

                self.assertEqual(created.status_code, status.HTTP_201_CREATED)
                self.assertEqual(updated.status_code, status.HTTP_200_OK)
                application.refresh_from_db()
                self.assertEqual(application.status, "Shortlisted")
                self.assertTrue(
                    Notification.objects.filter(
                        recipient=self.candidate,
                        application=application,
                        notification_type="application_status",
                    ).exists()
                )

    def test_non_pdf_upload_is_rejected(self):
        self.client.force_authenticate(user=self.candidate)
        response = self.client.post(
            reverse("application-list-create"),
            {
                "job": self.job.pk,
                "resume": SimpleUploadedFile(
                    "resume.pdf",
                    b"not a PDF",
                    content_type="application/pdf",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resume", response.data)

    def test_application_uses_profile_resume_when_no_resume_is_uploaded(self):
        self.client.force_authenticate(user=self.candidate)

        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.candidate.default_resume.save(
                    "profile-resume.pdf",
                    SimpleUploadedFile(
                        "profile-resume.pdf",
                        b"%PDF-1.4\nprofile resume",
                        content_type="application/pdf",
                    ),
                )
                response = self.client.post(
                    reverse("application-list-create"),
                    {"job": self.job.pk},
                    format="multipart",
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                application = Application.objects.get(candidate=self.candidate)
                with application.resume.open("rb") as saved_resume:
                    self.assertEqual(saved_resume.read(), b"%PDF-1.4\nprofile resume")

    def test_application_requires_a_resume_if_profile_has_none(self):
        self.client.force_authenticate(user=self.candidate)
        response = self.client.post(
            reverse("application-list-create"),
            {"job": self.job.pk},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("resume", response.data)

    def test_application_can_use_a_different_resume_than_profile_default(self):
        self.client.force_authenticate(user=self.candidate)

        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.candidate.default_resume.save(
                    "profile-resume.pdf",
                    SimpleUploadedFile(
                        "profile-resume.pdf",
                        b"%PDF-1.4\nprofile resume",
                        content_type="application/pdf",
                    ),
                )
                response = self.client.post(
                    reverse("application-list-create"),
                    {
                        "job": self.job.pk,
                        "resume": SimpleUploadedFile(
                            "custom-resume.pdf",
                            b"%PDF-1.4\ncustom resume",
                            content_type="application/pdf",
                        ),
                    },
                    format="multipart",
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                application = Application.objects.get(candidate=self.candidate)
                with application.resume.open("rb") as saved_resume:
                    self.assertEqual(saved_resume.read(), b"%PDF-1.4\ncustom resume")
