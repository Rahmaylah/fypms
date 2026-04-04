from django.contrib import admin
from .models import Project, ProjectUser, DuplicateFlag, ProjectType

@admin.register(ProjectType)
class ProjectTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'project_type', 'year', 'status', 'is_flagged_duplicate', 'created_at')
    list_filter = ('status', 'year', 'is_flagged_duplicate', 'created_at', 'project_type')
    search_fields = ('title', 'main_objective', 'specific_objectives', 'project_description')
    readonly_fields = ('title_embedding', 'objectives_embedding', 'combined_embedding', 'get_objectives_display')

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'project_type', 'main_objective', 'get_objectives_display', 'specific_objectives', 'project_description', 'implementation_details', 'year', 'status')
        }),
        ('Embeddings (Read-only)', {
            'fields': ('title_embedding', 'objectives_embedding', 'combined_embedding'),
            'classes': ('collapse',),
        }),
        ('Duplicate Detection', {
            'fields': ('last_similarity_check', 'is_flagged_duplicate', 'duplicate_check_score'),
            'classes': ('collapse',),
        }),
    )
    
    def get_objectives_display(self, obj):
        """Display specific objectives as numbered list"""
        if isinstance(obj.specific_objectives, list):
            items = ''.join(f"<li>{obj}</li>" for obj in obj.specific_objectives)
            return f"<ol>{items}</ol>"
        return obj.specific_objectives or "None"
    get_objectives_display.short_description = "Specific Objectives (Preview)"
    get_objectives_display.allow_tags = True

@admin.register(ProjectUser)
class ProjectUserAdmin(admin.ModelAdmin):
    list_display = ('project', 'user', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('project__title', 'user__username', 'user__first_name')

@admin.register(DuplicateFlag)
class DuplicateFlagAdmin(admin.ModelAdmin):
    list_display = ('project', 'similar_project', 'similarity_score', 'reviewed', 'created_at')
    list_filter = ('reviewed', 'created_at')
    search_fields = ('project__title', 'similar_project__title')
    readonly_fields = ('created_at',)
