from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    CurrentUserView,
    ContactSupportView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    InterviewerListView,
)


urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),
    path(
        "contact-support/",
        ContactSupportView.as_view(),
        name="contact-support",
    ),
    path(
        "interviewers/",
        InterviewerListView.as_view(),
        name="interviewer-list",
    ),
    path(
        "password-reset/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]