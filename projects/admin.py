from django.contrib import admin
from .models import Project, ProjectStudent, DuplicateFlag

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'year', 'status', 'is_flagged_duplicate', 'created_at')
    list_filter = ('status', 'year', 'is_flagged_duplicate', 'created_at')
    search_fields = ('title', 'objectives')
    readonly_fields = ('title_embedding', 'objectives_embedding', 'combined_embedding')

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'objectives', 'implementation_details', 'year', 'status')
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

@admin.register(ProjectStudent)
class ProjectStudentAdmin(admin.ModelAdmin):
    list_display = ('project', 'student', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')
    search_fields = ('project__title', 'student__user__username', 'student__user__first_name')

@admin.register(DuplicateFlag)
class DuplicateFlagAdmin(admin.ModelAdmin):
    list_display = ('project', 'similar_project', 'similarity_score', 'reviewed', 'flagged_at')
    list_filter = ('reviewed', 'flagged_at')
    search_fields = ('project__title', 'similar_project__title')
    readonly_fields = ('flagged_at',)
