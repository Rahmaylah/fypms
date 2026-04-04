from rest_framework import serializers
from accounts.models import User
from projects.models import Project, ProjectType, ProjectUser, DuplicateFlag


class MentorMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'middle_name', 'last_name', 'email', 'role']


class UserSerializer(serializers.ModelSerializer):
    mentor_info = serializers.SerializerMethodField()
    students = serializers.SerializerMethodField()

    def get_mentor_info(self, obj):
        if obj.mentor:
            return MentorMiniSerializer(obj.mentor).data
        return None

    def get_students(self, obj):
        if obj.role in ['mentor', 'coordinator']:
            students = obj.students.filter(role='student')
            return MentorMiniSerializer(students, many=True).data
        return []

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'registration_number', 'mentor', 'mentor_info', 'students', 'is_active', 'date_joined']


class ProjectTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectType
        fields = ['id', 'name', 'description']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'main_objective', 'specific_objectives', 'project_description', 'implementation_details', 'year', 'status',
                  'is_flagged_duplicate', 'duplicate_check_score', 'created_at', 'updated_at']
        read_only_fields = ['title_embedding', 'objectives_embedding', 'combined_embedding', 
                           'last_similarity_check']


class ProjectUserSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.middle_name} {obj.user.last_name}".strip()
    
    class Meta:
        model = ProjectUser
        fields = ['id', 'project', 'project_title', 'user', 'user_name', 'role', 'joined_at']


class DuplicateFlagSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    similar_project_title = serializers.CharField(source='similar_project.title', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.middle_name} {obj.reviewed_by.last_name}".strip()
        return None
    
    class Meta:
        model = DuplicateFlag
        fields = ['id', 'project', 'project_title', 'similar_project', 'similar_project_title',
                  'similarity_score', 'reviewed', 'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'created_at']



