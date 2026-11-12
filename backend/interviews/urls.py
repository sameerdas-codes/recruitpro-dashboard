from django.urls import path

from .views import (
    InterviewCandidateResumeView,
    InterviewListCreateView,
    InterviewRetrieveUpdateDestroyView,
)


urlpatterns = [
    path("", InterviewListCreateView.as_view(), name="interview-list-create"),
    path(
        "<int:pk>/",
        InterviewRetrieveUpdateDestroyView.as_view(),
        name="interview-detail",
    ),
    path(
        "<int:pk>/candidate-resume/",
        InterviewCandidateResumeView.as_view(),
        name="interview-candidate-resume",
    ),
]
