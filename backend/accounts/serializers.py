from rest_framework import serializers
from .models import User


class CurrentUserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
    )
    remove_profile_picture = serializers.BooleanField(
        required=False,
        write_only=True,
    )
    default_resume = serializers.FileField(
        required=False,
        allow_null=True,
    )
    remove_default_resume = serializers.BooleanField(
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "phone_number",
            "location",
            "professional_title",
            "about",
            "education",
            "experience",
            "skills",
            "preferences",
            "profile_picture",
            "remove_profile_picture",
            "default_resume",
            "remove_default_resume",
        ]
        read_only_fields = ["id", "username", "role"]

    def validate_profile_picture(self, picture):
        if picture and picture.size > 2 * 1024 * 1024:
            raise serializers.ValidationError(
                "Profile photo must be 2 MB or smaller."
            )
        return picture

    def validate_default_resume(self, uploaded_file):
        if not uploaded_file:
            return uploaded_file
        if self.instance and self.instance.role != "candidate":
            raise serializers.ValidationError(
                "Only candidates can upload a profile resume."
            )
        if uploaded_file.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Resume size must be 5 MB or smaller."
            )
        if not uploaded_file.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Resume must be a PDF file.")
        if uploaded_file.read(5) != b"%PDF-":
            raise serializers.ValidationError("Uploaded file is not a valid PDF.")
        uploaded_file.seek(0)
        return uploaded_file

    def validate(self, attrs):
        if attrs.get("remove_profile_picture") and "profile_picture" in attrs:
            raise serializers.ValidationError(
                {
                    "profile_picture": (
                        "Choose a new photo or remove the current one, not both."
                    )
                }
            )
        if attrs.get("remove_default_resume") and "default_resume" in attrs:
            raise serializers.ValidationError(
                {
                    "default_resume": (
                        "Choose a new resume or remove the current one, not both."
                    )
                }
            )
        return attrs

    def update(self, instance, validated_data):
        remove_profile_picture = validated_data.pop(
            "remove_profile_picture",
            False,
        )
        remove_default_resume = validated_data.pop("remove_default_resume", False)
        previous_picture = instance.profile_picture
        previous_picture_name = previous_picture.name if previous_picture else ""
        previous_resume = instance.default_resume
        previous_resume_name = previous_resume.name if previous_resume else ""
        user = super().update(instance, validated_data)

        if remove_profile_picture:
            user.profile_picture.delete(save=True)
        elif (
            previous_picture_name
            and user.profile_picture
            and user.profile_picture.name != previous_picture_name
        ):
            previous_picture.storage.delete(previous_picture_name)

        if remove_default_resume:
            user.default_resume.delete(save=True)
        elif (
            previous_resume_name
            and user.default_resume
            and user.default_resume.name != previous_resume_name
        ):
            previous_resume.storage.delete(previous_resume_name)

        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )
    role = serializers.ChoiceField(
        choices=(
            ("candidate", "Candidate"),
            ("hr", "HR / Recruiter"),
            ("interviewer", "Interviewer"),
        ),
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data["role"],
        )

        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)


class ContactSupportSerializer(serializers.Serializer):
    TOPIC_CHOICES = (
        ("Product question", "Product question"),
        ("Account help", "Account help"),
        ("Hiring workflow", "Hiring workflow"),
        ("Feedback", "Feedback"),
        ("Other", "Other"),
    )

    name = serializers.CharField(max_length=120, trim_whitespace=True)
    email = serializers.EmailField(max_length=254)
    topic = serializers.ChoiceField(choices=TOPIC_CHOICES)
    message = serializers.CharField(max_length=3000, trim_whitespace=True)