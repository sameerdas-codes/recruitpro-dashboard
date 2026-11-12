from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Job
from .permissions import IsJobOwnerOrAdmin
from .serializers import JobSerializer


def jobs_for_user(user):
    jobs = Job.objects.all()
    if user.role == "hr":
        jobs = jobs.filter(created_by=user)
    return jobs


# List All Jobs + Create Job
class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, IsJobOwnerOrAdmin]

    def get_queryset(self):
        return jobs_for_user(self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# Retrieve + Update + Delete Single Job
class JobRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, IsJobOwnerOrAdmin]

    def get_queryset(self):
        return jobs_for_user(self.request.user)