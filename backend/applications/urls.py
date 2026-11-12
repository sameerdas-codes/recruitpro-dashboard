from django.urls import path

from .views import (
    ApplicationListCreateView,
    ApplicationRetrieveUpdateDestroyView,
    ApplicationResumeView,
)


urlpatterns = [
    path(
        "",
        ApplicationListCreateView.as_view(),
        name="application-list-create",
    ),
    path(
        "<int:pk>/resume/",
        ApplicationResumeView.as_view(),
        name="application-resume",
    ),
    path(
        "<int:pk>/",
        ApplicationRetrieveUpdateDestroyView.as_view(),
        name="application-detail",
    ),
]