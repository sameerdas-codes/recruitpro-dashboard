from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import SupportRequest, User


class RegisterViewTests(APITestCase):
    def test_registration_creates_selected_public_role(self):
        for index, requested_role in enumerate(
            ("candidate", "hr", "interviewer")
        ):
            with self.subTest(role=requested_role):
                username = f"signup-{index}"
                response = self.client.post(
                    reverse("register"),
                    {
                        "username": username,
                        "email": f"{username}@example.com",
                        "password": "StrongPass123!",
                        "role": requested_role,
                    },
                )

                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(
                    User.objects.get(username=username).role,
                    requested_role,
                )
                self.assertEqual(response.data["user"]["role"], requested_role)

    def test_registration_rejects_admin_role(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "signup-admin",
                "email": "signup-admin@example.com",
                "password": "StrongPass123!",
                "role": "admin",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)
        self.assertFalse(User.objects.filter(username="signup-admin").exists())

    def test_registration_requires_role(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "signup-no-role",
                "email": "signup-no-role@example.com",
                "password": "StrongPass123!",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)


class CurrentUserProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile-user",
            email="profile@example.com",
            password="StrongPass123!",
            role="interviewer",
        )
        self.other_user = User.objects.create_user(
            username="other-profile-user",
            email="other-profile@example.com",
            password="StrongPass123!",
            role="candidate",
        )
        self.url = reverse("current-user")

    def test_authenticated_user_can_update_profile_without_changing_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self.url,
            {
                "first_name": "Alex",
                "last_name": "Interviewer",
                "email": "alex@example.com",
                "role": "admin",
                "username": "changed-username",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "Alex")
        self.assertEqual(response.data["last_name"], "Interviewer")
        self.assertEqual(response.data["email"], "alex@example.com")
        self.assertEqual(response.data["role"], "interviewer")
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "interviewer")

    def test_profile_update_rejects_an_email_owned_by_another_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self.url,
            {"email": self.other_user.email},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_profile_update_requires_authentication(self):
        response = self.client.patch(self.url, {"first_name": "Alex"})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_fields_and_photo_can_be_saved_and_removed(self):
        image_buffer = BytesIO()
        Image.new("RGB", (20, 20), color="teal").save(image_buffer, format="PNG")
        image_content = image_buffer.getvalue()

        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.client.force_authenticate(user=self.user)
                response = self.client.patch(
                    self.url,
                    {
                        "phone_number": "+1 555 123 4567",
                        "location": "Remote",
                        "professional_title": "Senior interviewer",
                        "about": "I build thoughtful engineering teams.",
                        "education": "BSc Computer Science",
                        "experience": "Senior Engineer, Example Co",
                        "skills": "Engineering, interviewing",
                        "preferences": "Remote interviews",
                        "profile_picture": SimpleUploadedFile(
                            "profile.png",
                            image_content,
                            content_type="image/png",
                        ),
                    },
                    format="multipart",
                )

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["phone_number"], "+1 555 123 4567")
                self.assertEqual(response.data["education"], "BSc Computer Science")
                self.assertTrue(response.data["profile_picture"].endswith(".png"))
                self.user.refresh_from_db()
                old_picture_path = Path(self.user.profile_picture.path)
                self.assertTrue(old_picture_path.exists())

                replacement = self.client.patch(
                    self.url,
                    {
                        "profile_picture": SimpleUploadedFile(
                            "replacement.png",
                            image_content,
                            content_type="image/png",
                        ),
                    },
                    format="multipart",
                )
                self.assertEqual(replacement.status_code, status.HTTP_200_OK)
                self.assertFalse(old_picture_path.exists())

                removed = self.client.patch(
                    self.url,
                    {"remove_profile_picture": "true"},
                    format="multipart",
                )
                self.assertEqual(removed.status_code, status.HTTP_200_OK)
                self.assertIsNone(removed.data["profile_picture"])
                self.user.refresh_from_db()
                self.assertFalse(self.user.profile_picture)

    def test_profile_photo_rejects_non_image_upload(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self.url,
            {
                "profile_picture": SimpleUploadedFile(
                    "not-an-image.txt",
                    b"not an image",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_picture", response.data)

    def test_profile_photo_rejects_files_over_two_megabytes(self):
        image_buffer = BytesIO()
        Image.new("RGB", (20, 20), color="teal").save(image_buffer, format="PNG")
        image_content = image_buffer.getvalue() + b"x" * (2 * 1024 * 1024)
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            self.url,
            {
                "profile_picture": SimpleUploadedFile(
                    "large-profile.png",
                    image_content,
                    content_type="image/png",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("profile_picture", response.data)

    def test_candidate_can_upload_and_remove_default_resume(self):
        self.user.role = "candidate"
        self.user.save(update_fields=["role"])
        resume_content = b"%PDF-1.4\nprofile resume"

        with TemporaryDirectory() as media_root:
            with self.settings(MEDIA_ROOT=media_root):
                self.client.force_authenticate(user=self.user)
                uploaded = self.client.patch(
                    self.url,
                    {
                        "default_resume": SimpleUploadedFile(
                            "candidate-resume.pdf",
                            resume_content,
                            content_type="application/pdf",
                        ),
                    },
                    format="multipart",
                )

                self.assertEqual(uploaded.status_code, status.HTTP_200_OK)
                self.assertTrue(uploaded.data["default_resume"].endswith(".pdf"))
                self.user.refresh_from_db()
                resume_path = Path(self.user.default_resume.path)
                self.assertTrue(resume_path.exists())

                removed = self.client.patch(
                    self.url,
                    {"remove_default_resume": "true"},
                    format="multipart",
                )
                self.assertEqual(removed.status_code, status.HTTP_200_OK)
                self.assertIsNone(removed.data["default_resume"])
                self.assertFalse(resume_path.exists())

    def test_default_resume_rejects_non_pdf_files(self):
        self.user.role = "candidate"
        self.user.save(update_fields=["role"])
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            self.url,
            {
                "default_resume": SimpleUploadedFile(
                    "resume.txt",
                    b"not a PDF",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("default_resume", response.data)


@override_settings(
    CONTACT_EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    SUPPORT_EMAIL="recruitpro4401@gmail.com",
    DEFAULT_FROM_EMAIL="no-reply@recruitpro.test",
)
class ContactSupportTests(APITestCase):
    def test_contact_form_emails_support_with_reply_to(self):
        response = self.client.post(
            reverse("contact-support"),
            {
                "name": "Taylor Candidate",
                "email": "taylor@example.com",
                "topic": "Account help",
                "message": "I need help accessing my account.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["message"],
            "Your support request was sent successfully.",
        )
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, ["recruitpro4401@gmail.com"])
        self.assertEqual(message.reply_to, ["taylor@example.com"])
        self.assertIn("I need help accessing my account.", message.body)
        self.assertEqual(SupportRequest.objects.count(), 0)

    def test_contact_form_ignores_stale_authorization_token(self):
        response = self.client.post(
            reverse("contact-support"),
            {
                "name": "Taylor Candidate",
                "email": "taylor@example.com",
                "topic": "Account help",
                "message": "I need help accessing my account.",
            },
            format="json",
            HTTP_AUTHORIZATION="Bearer expired.invalid.token",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

    def test_contact_form_reports_email_delivery_failure(self):
        with patch("accounts.views.EmailMessage.send", side_effect=OSError):
            response = self.client.post(
                reverse("contact-support"),
                {
                    "name": "Taylor Candidate",
                    "email": "taylor@example.com",
                    "topic": "Account help",
                    "message": "I need help accessing my account.",
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("detail", response.data)
        self.assertEqual(SupportRequest.objects.count(), 0)

    def test_contact_form_validates_required_fields(self):
        response = self.client.post(
            reverse("contact-support"),
            {"email": "not-an-email"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(SupportRequest.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_BASE_URL="http://localhost:5173",
)
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reset-user",
            email="reset@example.com",
            password="OriginalPass123!",
        )

    def test_reset_link_changes_password_and_cannot_be_reused(self):
        response = self.client.post(
            reverse("password-reset-request"),
            {"email": self.user.email},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        reset_url = mail.outbox[0].body.split(": ", 1)[1].strip()
        uid, token = reset_url.rstrip("/").split("/")[-2:]
        confirm_url = reverse("password-reset-confirm")
        payload = {
            "uid": uid,
            "token": token,
            "password": "NewStrongPass456!",
        }

        confirm_response = self.client.post(confirm_url, payload)
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload["password"]))

        reused_response = self.client.post(confirm_url, payload)
        self.assertEqual(
            reused_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_unknown_email_gets_same_success_response_without_email(self):
        response = self.client.post(
            reverse("password-reset-request"),
            {"email": "unknown@example.com"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)
