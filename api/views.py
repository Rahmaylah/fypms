from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate

from accounts.models import UserProfile
from projects.models import Project, ProjectStudent, DuplicateFlag
from appointments.models import Appointment

from .serializers import (
    UserProfileSerializer, ProjectSerializer, ProjectStudentSerializer,
    DuplicateFlagSerializer, AppointmentSerializer
)


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profiles.
    - list: Get all user profiles
    - retrieve: Get specific user profile
    - create: Create new user profile (admin only)
    - update: Update user profile (admin or self)
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own profile unless they're admin
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects.
    - list: Get all projects
    - retrieve: Get specific project
    - create: Submit new project
    - update: Update project (owner or admin)
    - destroy: Delete project (owner or admin)
    - duplicate_check: Manually trigger duplicate detection for a project
    """
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['year', 'status', 'is_flagged_duplicate']
    search_fields = ['title', 'objectives']
    
    def perform_create(self, serializer):
        # Could add logic to auto-generate embeddings here
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def duplicate_check(self, request, pk=None):
        """
        Manually trigger duplicate detection for a specific project.
        """
        project = self.get_object()
        # TODO: Implement duplicate detection logic here
        return Response({
            'message': 'Duplicate check initiated for project',
            'project_id': project.id
        })
    
    @action(detail=False, methods=['get'])
    def flagged(self, request):
        """
        Get all projects flagged as potential duplicates.
        """
        flagged_projects = Project.objects.filter(is_flagged_duplicate=True)
        serializer = self.get_serializer(flagged_projects, many=True)
        return Response(serializer.data)


class ProjectStudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project-student relationships (group projects).
    - list: Get all project-student links
    - retrieve: Get specific link
    - create: Add student to project
    - destroy: Remove student from project
    """
    queryset = ProjectStudent.objects.all()
    serializer_class = ProjectStudentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['project', 'student', 'role']


class DuplicateFlagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing duplicate flags.
    - list: Get all flagged duplicates
    - retrieve: Get specific flag
    - mark_reviewed: Mark a flag as reviewed
    """
    queryset = DuplicateFlag.objects.all().order_by('-flagged_at')
    serializer_class = DuplicateFlagSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['reviewed', 'project', 'similar_project']
    
    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """
        Mark a duplicate flag as reviewed by current user.
        """
        duplicate_flag = self.get_object()
        duplicate_flag.reviewed = True
        duplicate_flag.reviewed_by = request.user.userprofile
        duplicate_flag.save()
        serializer = self.get_serializer(duplicate_flag)
        return Response(serializer.data)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing appointments.
    - list: Get all appointments (filtered by mentor/student)
    - retrieve: Get specific appointment
    - create: Schedule new appointment
    - update: Update appointment (mentor or admin)
    - destroy: Cancel appointment
    - my_appointments: Get appointments for current user
    """
    queryset = Appointment.objects.all().order_by('start_time')
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'mentor', 'student']
    
    def get_queryset(self):
        # Users can only see their own appointments unless they're admin
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Appointment.objects.all().order_by('start_time')
        try:
            profile = user.userprofile
            # Show appointments where user is mentor or student
            from django.db.models import Q
            return Appointment.objects.filter(
                Q(mentor=profile) | Q(student=profile)
            ).order_by('start_time')
        except UserProfile.DoesNotExist:
            return Appointment.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_appointments(self, request):
        """
        Get all appointments for the current user (as mentor or student).
        """
        try:
            profile = request.user.userprofile
            from django.db.models import Q
            appointments = Appointment.objects.filter(
                Q(mentor=profile) | Q(student=profile)
            ).order_by('start_time')
            serializer = self.get_serializer(appointments, many=True)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Mentor confirms an appointment.
        """
        appointment = self.get_object()
        appointment.status = 'confirmed'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        """
        appointment = self.get_object()
        appointment.status = 'cancelled'
        appointment.save()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)


@api_view(['POST'])
def login_view(request):
    """
    Authenticate user and return user data.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    if user:
        try:
            profile = user.userprofile
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': profile.user_type
                }
            })
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )
