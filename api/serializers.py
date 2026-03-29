from rest_framework import serializers
from accounts.models import UserProfile
from projects.models import Project, ProjectStudent, DuplicateFlag
from appointments.models import Appointment
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'user_type', 'department', 'registration_number', 
                  'course_id', 'max_students', 'is_admin', 'mentor', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'objectives', 'implementation_details', 'year', 'status',
                  'is_flagged_duplicate', 'duplicate_check_score', 'created_at', 'updated_at']
        read_only_fields = ['title_embedding', 'objectives_embedding', 'combined_embedding', 
                           'last_similarity_check']


class ProjectStudentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = ProjectStudent
        fields = ['id', 'project', 'project_title', 'student', 'student_name', 'role', 'joined_at']


class DuplicateFlagSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    similar_project_title = serializers.CharField(source='similar_project.title', read_only=True)
    
    class Meta:
        model = DuplicateFlag
        fields = ['id', 'project', 'project_title', 'similar_project', 'similar_project_title',
                  'similarity_score', 'flagged_at', 'reviewed', 'reviewed_by']


class AppointmentSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.user.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'mentor', 'mentor_name', 'student', 'student_name', 'project', 
                  'project_title', 'start_time', 'end_time', 'status', 'notes', 'created_at', 'updated_at']
