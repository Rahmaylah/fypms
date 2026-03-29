from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_type', 'department', 'registration_number', 'course_id', 'mentor')
    list_filter = ('user_type', 'department', 'course_id')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'registration_number')

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'user_type', 'department')
        }),
        ('Student Fields', {
            'fields': ('registration_number', 'course_id', 'mentor'),
            'classes': ('collapse',),
        }),
        ('Mentor Fields', {
            'fields': ('max_students', 'is_admin'),
            'classes': ('collapse',),
        }),
    )
