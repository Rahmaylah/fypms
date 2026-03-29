from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('mentor', 'student', 'project', 'start_time', 'end_time', 'status')
    list_filter = ('status', 'start_time', 'created_at')
    search_fields = ('mentor__user__username', 'student__user__username', 'project__title')
    date_hierarchy = 'start_time'

    fieldsets = (
        ('Participants', {
            'fields': ('mentor', 'student', 'project')
        }),
        ('Schedule', {
            'fields': ('start_time', 'end_time', 'status')
        }),
        ('Details', {
            'fields': ('notes',),
            'classes': ('collapse',),
        }),
    )
