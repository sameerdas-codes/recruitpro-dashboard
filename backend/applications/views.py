from pathlib import Path

from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Application
from .permissions import IsApplicationParticipant
from .serializers import ApplicationSerializer
from notifications.services import create_notification


def applications_for_user(user):
    applications = Application.objects.select_related("candidate", "job")

    if user.role == "admin":
        return applications
    if user.role == "candidate":
        return applications.filter(candidate=user)
    if user.role == "hr":
        return applications.filter(job__created_by=user)

    return applications.none()


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated, IsApplicationParticipant]

    def get_queryset(self):
        return applications_for_user(self.request.user).order_by("-applied_at")

    def perform_create(self, serializer):
        with transaction.atomic():
            application = serializer.save(candidate=self.request.user)
            create_notification(
                application.candidate,
                "application",
                (
                    f"Your application for {application.job.title} was "
                    "submitted successfully."
                ),
                application=application,
            )
            create_notification(
                application.job.created_by,
                "application",
                (
                    f"{application.candidate.username} applied for "
                    f"{application.job.title}."
                ),
                application=application,
            )


class ApplicationRetrieveUpdateDestroyView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated, IsApplicationParticipant]

    def get_queryset(self):
        return applications_for_user(self.request.user)

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        with transaction.atomic():
            application = serializer.save()
            if application.status != previous_status:
                create_notification(
                    application.candidate,
                    "application_status",
                    (
                        f"Your application for {application.job.title} is now "
                        f"{application.status.lower()}."
                    ),
                    application=application,
                )


class ApplicationResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        application = get_object_or_404(
            applications_for_user(request.user),
            pk=pk,
        )
        if not application.resume:
            raise NotFound("No resume is attached to this application.")

        return FileResponse(
            application.resume.open("rb"),
            as_attachment=True,
            filename=Path(application.resume.name).name,
            content_type="application/pdf",
        )