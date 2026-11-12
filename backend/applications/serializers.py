from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers
from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    resume = serializers.FileField(required=False)

    candidate_username = serializers.CharField(
        source="candidate.username",
        read_only=True
    )

    job_title = serializers.CharField(
        source="job.title",
        read_only=True
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "candidate",
            "candidate_username",
            "job",
            "job_title",
            "resume",
            "cover_letter",
            "status",
            "applied_at",
            "updated_at",
        ]

        read_only_fields = [
            "candidate",
            "applied_at",
            "updated_at",
        ]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
            or request.user.role not in ("hr", "admin")
        ):
            fields["status"].read_only = True

        return fields

    def validate_resume(self, uploaded_file):
        if uploaded_file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume size must be less than 5MB."
            )

        if not uploaded_file.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Resume must be a PDF file.")

        if uploaded_file.read(5) != b"%PDF-":
            raise serializers.ValidationError("Uploaded file is not a valid PDF.")

        uploaded_file.seek(0)
        return uploaded_file

    def create(self, validated_data):
        candidate = validated_data.get("candidate") or self.context["request"].user
        if "resume" not in validated_data:
            if not candidate.default_resume:
                raise serializers.ValidationError(
                    {"resume": "Upload a resume or add a default resume to your profile."}
                )
            with candidate.default_resume.open("rb") as profile_resume:
                validated_data["resume"] = SimpleUploadedFile(
                    Path(candidate.default_resume.name).name,
                    profile_resume.read(),
                    content_type="application/pdf",
                )
        return super().create(validated_data)