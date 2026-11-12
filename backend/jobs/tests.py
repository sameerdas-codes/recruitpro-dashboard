from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from applications.models import Application
from interviews.models import Interview
from .models import Job


class JobPermissionTests(APITestCase):
    def setUp(self):
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
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
        self.interviewer = User.objects.create_user(
            username="interviewer",
            email="interviewer@example.com",
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

    def test_candidate_can_list_jobs_but_cannot_create_one(self):
        other_job = Job.objects.create(
            title="Designer",
            company="Example Co",
            location="Remote",
            salary="90000.00",
            job_type="Full Time",
            description="Design software",
            created_by=self.other_hr,
        )
        self.client.force_authenticate(user=self.candidate)

        list_response = self.client.get(reverse("job-list-create"))
        create_response = self.client.post(
            reverse("job-list-create"),
            {
                "title": "Another role",
                "company": "Example Co",
                "location": "Remote",
                "salary": "100000.00",
                "job_type": "Full Time",
                "description": "A role",
            },
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {job["id"] for job in list_response.data},
            {self.job.id, other_job.id},
        )
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_hr_only_sees_jobs_they_created(self):
        other_job = Job.objects.create(
            title="Designer",
            company="Example Co",
            location="Remote",
            salary="90000.00",
            job_type="Full Time",
            description="Design software",
            created_by=self.other_hr,
        )
        self.client.force_authenticate(user=self.hr)

        list_response = self.client.get(reverse("job-list-create"))
        other_job_response = self.client.get(
            reverse("job-detail", kwargs={"pk": other_job.pk})
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual([job["id"] for job in list_response.data], [self.job.id])
        self.assertEqual(
            other_job_response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_hr_cannot_modify_another_hrs_job(self):
        self.client.force_authenticate(user=self.other_hr)

        response = self.client.delete(
            reverse("job-detail", kwargs={"pk": self.job.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Job.objects.filter(pk=self.job.pk).exists())

    def test_hr_can_modify_own_job(self):
        self.client.force_authenticate(user=self.hr)

        response = self.client.patch(
            reverse("job-detail", kwargs={"pk": self.job.pk}),
            {"title": "Senior Developer"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.title, "Senior Developer")

    def test_deleting_job_removes_all_applications_interviews_and_resumes(self):
        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                application = Application.objects.create(
                    candidate=self.candidate,
                    job=self.job,
                    resume=SimpleUploadedFile(
                        "resume.pdf",
                        b"%PDF-1.4\nresume",
                        content_type="application/pdf",
                    ),
                )
                second_candidate = User.objects.create_user(
                    username="second-candidate",
                    email="second-candidate@example.com",
                    password="test-pass-12345",
                )
                second_application = Application.objects.create(
                    candidate=second_candidate,
                    job=self.job,
                    resume=SimpleUploadedFile(
                        "second-resume.pdf",
                        b"%PDF-1.4\nsecond resume",
                        content_type="application/pdf",
                    ),
                )
                resume_paths = [
                    Path(application.resume.path),
                    Path(second_application.resume.path),
                ]
                interview = Interview.objects.create(
                    application=application,
                    interviewer=self.interviewer,
                    created_by=self.hr,
                    scheduled_at=timezone.now() + timedelta(days=1),
                )
                self.client.force_authenticate(user=self.hr)

                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.delete(
                        reverse("job-detail", kwargs={"pk": self.job.pk})
                    )

                self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
                self.assertFalse(Job.objects.filter(pk=self.job.pk).exists())
                self.assertFalse(
                    Application.objects.filter(job_id=self.job.pk).exists()
                )
                self.assertFalse(Interview.objects.filter(pk=interview.pk).exists())
                self.assertTrue(all(not path.exists() for path in resume_paths))
                self.assertTrue(User.objects.filter(pk=self.candidate.pk).exists())
                self.assertTrue(
                    User.objects.filter(pk=second_candidate.pk).exists()
                )
