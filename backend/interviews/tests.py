from datetime import timedelta
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from applications.models import Application
from jobs.models import Job
from notifications.models import Notification
from .models import Interview


class InterviewApiTests(APITestCase):
    def setUp(self):
        self.hr = User.objects.create_user(
            username="hr",
            email="hr@example.com",
            password="StrongPass123!",
            role="hr",
        )
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
        self.interviewer = User.objects.create_user(
            username="interviewer",
            email="interviewer@example.com",
            password="StrongPass123!",
            role="interviewer",
        )
        self.other_interviewer = User.objects.create_user(
            username="other-interviewer",
            email="other-interviewer@example.com",
            password="test-pass-12345",
            role="interviewer",
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

    def create_application(self, status="Shortlisted"):
        return Application.objects.create(
            candidate=self.candidate,
            job=self.job,
            resume=SimpleUploadedFile(
                "resume.pdf",
                b"%PDF-1.4\nresume",
                content_type="application/pdf",
            ),
            status=status,
        )

    def schedule_payload(self, application):
        return {
            "application": application.pk,
            "interviewer": self.interviewer.pk,
            "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
            "meeting_link": "https://meet.example.com/room",
        }

    def test_hr_schedules_interview_and_notifies_participants(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                application = self.create_application()
                self.client.force_authenticate(user=self.hr)
                response = self.client.post(
                    reverse("interview-list-create"),
                    self.schedule_payload(application),
                    format="json",
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                interview = Interview.objects.get(pk=response.data["id"])
                self.assertEqual(interview.created_by, self.hr)
                self.assertEqual(
                    Notification.objects.filter(
                        interview=interview,
                        recipient__in=[self.candidate, self.interviewer],
                    ).count(),
                    2,
                )

                self.client.force_authenticate(user=self.candidate)
                self.assertEqual(
                    len(self.client.get(reverse("interview-list-create")).data),
                    1,
                )
                self.client.force_authenticate(user=self.other_candidate)
                self.assertEqual(
                    len(self.client.get(reverse("interview-list-create")).data),
                    0,
                )
                self.client.force_authenticate(user=self.interviewer)
                self.assertEqual(
                    len(self.client.get(reverse("interview-list-create")).data),
                    1,
                )

    def test_assigned_interviewer_can_see_candidate_details_and_resume(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.candidate.first_name = "Casey"
                self.candidate.last_name = "Applicant"
                self.candidate.save()
                application = self.create_application()
                application.cover_letter = "Experienced software developer."
                application.save(update_fields=["cover_letter"])

                self.client.force_authenticate(user=self.interviewer)
                resume_url = reverse(
                    "application-resume",
                    kwargs={"pk": application.pk},
                )
                self.assertEqual(
                    self.client.get(resume_url).status_code,
                    status.HTTP_404_NOT_FOUND,
                )

                self.client.force_authenticate(user=self.hr)
                created = self.client.post(
                    reverse("interview-list-create"),
                    self.schedule_payload(application),
                    format="json",
                )
                self.assertEqual(created.status_code, status.HTTP_201_CREATED)

                self.client.force_authenticate(user=self.interviewer)
                listed = self.client.get(reverse("interview-list-create"))
                assigned_details = listed.data[0]
                self.assertEqual(
                    assigned_details["candidate_name"],
                    "Casey Applicant",
                )
                self.assertEqual(
                    assigned_details["candidate_email"],
                    self.candidate.email,
                )
                self.assertEqual(
                    assigned_details["candidate_cover_letter"],
                    "Experienced software developer.",
                )
                self.assertTrue(assigned_details["application_applied_at"])
                self.assertTrue(assigned_details["candidate_resume_available"])

                candidate_resume = self.client.get(
                    reverse(
                        "interview-candidate-resume",
                        kwargs={"pk": created.data["id"]},
                    )
                )
                self.assertEqual(candidate_resume.status_code, status.HTTP_200_OK)
                self.assertEqual(candidate_resume["Content-Type"], "application/pdf")
                self.assertIn("attachment", candidate_resume["Content-Disposition"])
                candidate_resume.close()

                self.client.force_authenticate(user=self.other_interviewer)
                denied_resume = self.client.get(
                    reverse(
                        "interview-candidate-resume",
                        kwargs={"pk": created.data["id"]},
                    )
                )
                self.assertEqual(
                    denied_resume.status_code,
                    status.HTTP_404_NOT_FOUND,
                )

                self.client.force_authenticate(user=self.candidate)
                denied_non_interviewer = self.client.get(
                    reverse(
                        "interview-candidate-resume",
                        kwargs={"pk": created.data["id"]},
                    )
                )
                self.assertEqual(
                    denied_non_interviewer.status_code,
                    status.HTTP_403_FORBIDDEN,
                )

                self.client.force_authenticate(user=self.hr)
                self.client.patch(
                    reverse(
                        "interview-detail",
                        kwargs={"pk": created.data["id"]},
                    ),
                    {"status": "Cancelled"},
                )
                self.client.force_authenticate(user=self.interviewer)
                cancelled_details = self.client.get(
                    reverse("interview-list-create")
                ).data[0]
                self.assertIsNone(cancelled_details["candidate_name"])
                self.assertFalse(cancelled_details["candidate_resume_available"])
                self.assertEqual(
                    self.client.get(
                        reverse(
                            "interview-candidate-resume",
                            kwargs={"pk": created.data["id"]},
                        )
                    ).status_code,
                    status.HTTP_404_NOT_FOUND,
                )

    def test_candidate_cannot_schedule_and_hr_can_cancel(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                application = self.create_application()
                url = reverse("interview-list-create")
                self.client.force_authenticate(user=self.candidate)
                denied = self.client.post(
                    url,
                    self.schedule_payload(application),
                    format="json",
                )
                self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)

                self.client.force_authenticate(user=self.hr)
                created = self.client.post(
                    url,
                    self.schedule_payload(application),
                    format="json",
                )
                detail_url = reverse(
                    "interview-detail",
                    kwargs={"pk": created.data["id"]},
                )
                cancelled = self.client.patch(
                    detail_url,
                    {"status": "Cancelled"},
                    format="json",
                )

                self.assertEqual(created.status_code, status.HTTP_201_CREATED)
                self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    Notification.objects.filter(
                        interview_id=created.data["id"],
                        notification_type="interview",
                    ).count(),
                    4,
                )

    def test_completing_interview_notifies_candidate(self):
        application = self.create_application()
        self.client.force_authenticate(user=self.hr)
        created = self.client.post(
            reverse("interview-list-create"),
            self.schedule_payload(application),
            format="json",
        )
        response = self.client.patch(
            reverse("interview-detail", kwargs={"pk": created.data["id"]}),
            {"status": "Completed"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.candidate,
                interview_id=created.data["id"],
                message__contains="marked as completed",
            ).exists()
        )

    def test_application_cannot_have_two_scheduled_interviews(self):
        application = self.create_application()
        self.client.force_authenticate(user=self.hr)
        url = reverse("interview-list-create")
        first_response = self.client.post(
            url,
            self.schedule_payload(application),
            format="json",
        )
        duplicate_response = self.client.post(
            url,
            self.schedule_payload(application),
            format="json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already has a scheduled interview", str(duplicate_response.data))

        self.client.patch(
            reverse("interview-detail", kwargs={"pk": first_response.data["id"]}),
            {"status": "Cancelled"},
        )
        rescheduled_response = self.client.post(
            url,
            self.schedule_payload(application),
            format="json",
        )
        duplicate_update = self.client.patch(
            reverse("interview-detail", kwargs={"pk": first_response.data["id"]}),
            {"status": "Scheduled"},
        )

        self.assertEqual(rescheduled_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate_update.status_code, status.HTTP_400_BAD_REQUEST)

    def test_hr_cannot_schedule_interview_for_unapproved_application(self):
        application = self.create_application(status="Pending")
        self.client.force_authenticate(user=self.hr)

        response = self.client.post(
            reverse("interview-list-create"),
            self.schedule_payload(application),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("application", response.data)
