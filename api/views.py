from accounts import models
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
# from rest_framework.response import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import models

from accounts.models import User
from projects.models import Project, ProjectType, ProjectUser, DuplicateFlag

from .serializers import (
    UserSerializer, ProjectSerializer, ProjectTypeSerializer, ProjectUserSerializer,
    DuplicateFlagSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer  # Rename to UserSerializer later
    permission_classes = [IsAuthenticatedOrReadOnly] # Only authenticated users can create/update/delete, but anyone can read
    
    # Allow mentor/role filtering on list endpoint for staff/mentor use
    def get_queryset(self):
        user = self.request.user
        # If user is not authenticated, return all users (read-only)
        if not user.is_authenticated:
            queryset = User.objects.all()
        # If authenticated and staff/superuser, return all users
        elif user.is_staff or user.is_superuser:
            queryset = User.objects.all()
        # If authenticated regular user, return only themselves
        else:
            queryset = User.objects.filter(id=user.id)

        mentor_id = self.request.query_params.get('mentor')
        role = self.request.query_params.get('role')

        if mentor_id is not None:
            queryset = queryset.filter(mentor_id=mentor_id)
        if role is not None:
            queryset = queryset.filter(role=role)

        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)




class ProjectTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project type options"""
    queryset = ProjectType.objects.all().order_by('name')
    serializer_class = ProjectTypeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


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
    # ordering_fields = ['created_at']

    filterset_fields = ['project_type', 'year', 'status', 'is_flagged_duplicate']
    search_fields = ['title', 'main_objective', 'specific_objectives', 'project_description']
    
    def get_queryset(self):
        user = self.request.user
        # If user is not authenticated, return all projects (read-only)
        if not user.is_authenticated:
            return Project.objects.all().order_by('-created_at')
        # If student, return only their projects (where they are creator or assigned)
        if user.role == 'student':
            return Project.objects.filter(
                models.Q(user=user) | models.Q(project_users__user=user)
            ).distinct().order_by('-created_at')
        # Otherwise (mentor/coordinator), return all projects
        else:
            return Project.objects.all().order_by('-created_at')
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Allow access if user is not authenticated (read-only), mentor, or coordinator
        if not user.is_authenticated or user.role != 'student':
            return obj
        
        # For students, only allow access if they're part of the project
        if ProjectUser.objects.filter(project=obj, user=user).exists():
            return obj

        raise PermissionDenied("You do not have permission to access this project.")
    
    def perform_create(self, serializer):
        project = serializer.save(user=self.request.user)

        user = self.request.user

        ProjectUser.objects.create(
            project=project,
            user=user,
            role='lead'
        )
        
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
    
    @action(detail=False, methods=['get'], url_path='my')
    def my_projects(self, request):
        """
        Return projects linked to the logged-in user.
        """
        user = request.user
        projects = Project.objects.filter(project_users__user=user).distinct()
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)


class ProjectUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing project-user relationships (group projects).
    """
    queryset = ProjectUser.objects.all()
    serializer_class = ProjectUserSerializer  # Rename later
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['project', 'user', 'role']


class DuplicateFlagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing duplicate flags.
    - list: Get all flagged duplicates
    - retrieve: Get specific flag
    - mark_reviewed: Mark a flag as reviewed
    """
    queryset = DuplicateFlag.objects.all().order_by('-created_at')
    serializer_class = DuplicateFlagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['reviewed', 'project', 'similar_project']
    
    @action(detail=True, methods=['post'])
    def mark_reviewed(self, request, pk=None):
        """
        Mark a duplicate flag as reviewed by current user.
        """
        duplicate_flag = self.get_object()
        duplicate_flag.reviewed = True
        duplicate_flag.reviewed_by = request.user
        duplicate_flag.save()
        serializer = self.get_serializer(duplicate_flag)
        return Response(serializer.data)





@api_view(['POST'])
@csrf_exempt
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
        # Log the user in to establish session
        from django.contrib.auth import login
        login(request, user)
        
        try:
            from .serializers import UserSerializer
            serializer = UserSerializer(user)
            return Response({'user': serializer.data})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )
