import logging
import smtplib

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage, get_connection, send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework import generics, serializers

from .models import User
from .serializers import (
    CurrentUserSerializer,
    ContactSupportSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
)
logger = logging.getLogger(__name__)


class ContactEmailUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Email delivery is temporarily unavailable. Please try again later."
    default_code = "contact_email_unavailable"


class ContactSupportView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact_support"

    def post(self, request):
        serializer = ContactSupportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subject = f"RecruitPro support request: {data['topic']}"
        body = (
            f"Name: {data['name']}\n"
            f"Email: {data['email']}\n"
            f"Topic: {data['topic']}\n\n"
            f"{data['message']}"
        )
        try:
            connection = get_connection(
                backend=settings.CONTACT_EMAIL_BACKEND,
                fail_silently=False,
            )
            sent_count = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.SUPPORT_EMAIL],
                reply_to=[data["email"]],
                connection=connection,
            ).send(fail_silently=False)
        except (OSError, smtplib.SMTPException) as error:
            logger.exception("Could not send RecruitPro support email.")
            raise ContactEmailUnavailable() from error

        if sent_count != 1:
            logger.error("Support email backend did not confirm delivery.")
            raise ContactEmailUnavailable()

        return Response(
            {"message": "Your support request was sent successfully."},
            status=status.HTTP_200_OK,
        )


class InterviewerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class InterviewerListView(generics.ListAPIView):
    serializer_class = InterviewerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ("hr", "admin"):
            return User.objects.none()
        return User.objects.filter(
            role="interviewer",
            is_active=True,
        ).order_by("username")


class RegisterView(APIView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "User registered successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class CurrentUserView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            CurrentUserSerializer(
                request.user,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        serializer = CurrentUserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            CurrentUserSerializer(
                request.user,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"],
            is_active=True,
        ).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = (
                f"{settings.FRONTEND_BASE_URL.rstrip('/')}"
                f"/reset-password/{uid}/{token}"
            )
            send_mail(
                subject="Reset your RecruitPro password",
                message=f"Use this link to reset your password: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"message": "If that email is registered, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(
                urlsafe_base64_decode(serializer.validated_data["uid"])
            )
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError):
            return Response(
                {"detail": "This password reset link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(pk=user_id, is_active=True).first()
        token = serializer.validated_data["token"]
        if not user or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "This password reset link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        password = serializer.validated_data["password"]
        try:
            validate_password(password, user=user)
        except ValidationError as error:
            return Response(
                {"password": error.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=["password"])
        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )