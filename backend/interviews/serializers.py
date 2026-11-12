from django.utils import timezone
from rest_framework import serializers

from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    candidate_username = serializers.CharField(
        source="application.candidate.username",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="application.job.title",
        read_only=True,
    )
    interviewer_username = serializers.CharField(
        source="interviewer.username",
        read_only=True,
    )
    candidate_name = serializers.SerializerMethodField()
    candidate_email = serializers.SerializerMethodField()
    candidate_cover_letter = serializers.SerializerMethodField()
    application_applied_at = serializers.SerializerMethodField()
    candidate_resume_available = serializers.SerializerMethodField()

    class Meta:
        model = Interview
        fields = [
            "id",
            "application",
            "candidate_username",
            "candidate_name",
            "candidate_email",
            "candidate_cover_letter",
            "application_applied_at",
            "candidate_resume_available",
            "job_title",
            "interviewer",
            "interviewer_username",
            "scheduled_at",
            "meeting_link",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "candidate_username",
            "candidate_name",
            "candidate_email",
            "candidate_cover_letter",
            "application_applied_at",
            "candidate_resume_available",
            "job_title",
            "interviewer_username",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def _is_assigned_interviewer(self, interview):
        request = self.context.get("request")
        return (
            request
            and request.user.is_authenticated
            and request.user.role == "interviewer"
            and interview.interviewer_id == request.user.id
            and interview.status != "Cancelled"
        )

    def get_candidate_name(self, interview):
        if not self._is_assigned_interviewer(interview):
            return None
        candidate = interview.application.candidate
        return candidate.get_full_name().strip() or candidate.username

    def get_candidate_email(self, interview):
        if not self._is_assigned_interviewer(interview):
            return None
        return interview.application.candidate.email

    def get_candidate_cover_letter(self, interview):
        if not self._is_assigned_interviewer(interview):
            return None
        return interview.application.cover_letter

    def get_application_applied_at(self, interview):
        if not self._is_assigned_interviewer(interview):
            return None
        return interview.application.applied_at

    def get_candidate_resume_available(self, interview):
        return bool(
            self._is_assigned_interviewer(interview)
            and interview.application.resume
        )

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")

        fields["status"].read_only = (
            not request
            or not request.user.is_authenticated
            or request.user.role not in ("hr", "admin")
        )

        return fields

    def validate(self, attrs):
        request = self.context["request"]
        application = attrs.get(
            "application",
            getattr(self.instance, "application", None),
        )
        interviewer = attrs.get(
            "interviewer",
            getattr(self.instance, "interviewer", None),
        )

        if (
            self.instance is None
            and application
            and application.status != "Shortlisted"
        ):
            raise serializers.ValidationError(
                {
                    "application": (
                        "Only shortlisted applications can be scheduled for "
                        "an interview."
                    )
                }
            )

        is_becoming_scheduled = (
            self.instance is None
            or attrs.get("status", self.instance.status) == "Scheduled"
        )
        if application and is_becoming_scheduled:
            scheduled_interviews = Interview.objects.filter(
                application=application,
                status="Scheduled",
            )
            if self.instance:
                scheduled_interviews = scheduled_interviews.exclude(
                    pk=self.instance.pk
                )
            if scheduled_interviews.exists():
                raise serializers.ValidationError(
                    {
                        "application": (
                            "This application already has a scheduled interview. "
                            "Complete or cancel it before scheduling another."
                        )
                    }
                )

        if interviewer and interviewer.role != "interviewer":
            raise serializers.ValidationError(
                {"interviewer": "Choose an account with the interviewer role."}
            )

        if (
            request.user.role == "hr"
            and application
            and application.job.created_by_id != request.user.id
        ):
            raise serializers.ValidationError(
                {"application": "You can only schedule interviews for your jobs."}
            )

        scheduled_at = attrs.get(
            "scheduled_at",
            getattr(self.instance, "scheduled_at", None),
        )
        if (
            scheduled_at
            and scheduled_at <= timezone.now()
            and (
                self.instance is None
                or scheduled_at != self.instance.scheduled_at
            )
        ):
            raise serializers.ValidationError(
                {"scheduled_at": "Interview time must be in the future."}
            )

        return attrs
