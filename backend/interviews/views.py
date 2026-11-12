from pathlib import Path

from django.db import transaction
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from notifications.services import create_notification
from .models import Interview
from .permissions import IsInterviewParticipantOrScheduler
from .serializers import InterviewSerializer


def interviews_for_user(user):
    interviews = Interview.objects.select_related(
        "application__candidate",
        "application__job",
        "interviewer",
    )
    if user.role == "admin":
        return interviews
    if user.role == "hr":
        return interviews.filter(application__job__created_by=user)
    if user.role == "candidate":
        return interviews.filter(application__candidate=user)
    if user.role == "interviewer":
        return interviews.filter(interviewer=user)
    return interviews.none()


class InterviewListCreateView(generics.ListCreateAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated, IsInterviewParticipantOrScheduler]

    def get_queryset(self):
        return interviews_for_user(self.request.user)

    def perform_create(self, serializer):
        with transaction.atomic():
            interview = serializer.save(created_by=self.request.user)
            application = interview.application
            message = (
                f"An interview for {application.job.title} has been scheduled."
            )
            create_notification(
                application.candidate,
                "interview",
                message,
                application=application,
                interview=interview,
            )
            create_notification(
                interview.interviewer,
                "interview",
                message,
                application=application,
                interview=interview,
            )


class InterviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated, IsInterviewParticipantOrScheduler]

    def get_queryset(self):
        return interviews_for_user(self.request.user)

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        previous_time = serializer.instance.scheduled_at
        previous_link = serializer.instance.meeting_link
        previous_interviewer = serializer.instance.interviewer

        with transaction.atomic():
            interview = serializer.save()
            if (
                interview.status != previous_status
                or interview.scheduled_at != previous_time
                or interview.meeting_link != previous_link
                or interview.interviewer_id != previous_interviewer.id
            ):
                if interview.status == "Cancelled":
                    message = (
                        f"The interview for {interview.application.job.title} "
                        "has been cancelled."
                    )
                elif interview.status == "Completed":
                    message = (
                        f"The interview for {interview.application.job.title} "
                        "has been marked as completed."
                    )
                else:
                    message = (
                        f"The interview for {interview.application.job.title} "
                        "has been updated."
                    )
                recipients = {
                    recipient.id: recipient
                    for recipient in (
                        interview.application.candidate,
                        interview.interviewer,
                        previous_interviewer,
                    )
                }
                for recipient in recipients.values():
                    create_notification(
                        recipient,
                        "interview",
                        message,
                        application=interview.application,
                        interview=interview,
                    )

    def perform_destroy(self, instance):
        with transaction.atomic():
            for recipient in (
                instance.application.candidate,
                instance.interviewer,
            ):
                create_notification(
                    recipient,
                    "interview",
                    f"The interview for {instance.application.job.title} was removed.",
                    application=instance.application,
                )
            instance.delete()


class InterviewCandidateResumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != "interviewer":
            raise PermissionDenied(
                "Only the assigned interviewer can access this resume."
            )

        interview = get_object_or_404(
            interviews_for_user(request.user),
            pk=pk,
            interviewer=request.user,
            status__in=("Scheduled", "Completed"),
        )
        resume = interview.application.resume
        if not resume:
            raise NotFound("No resume is attached to this application.")

        return FileResponse(
            resume.open("rb"),
            as_attachment=True,
            filename=Path(resume.name).name,
            content_type="application/pdf",
        )
