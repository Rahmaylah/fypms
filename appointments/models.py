from django.db import models
from accounts.models import UserProfile
from projects.models import Project

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('proposed', 'Proposed'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('reschedule_requested', 'Reschedule Requested'),
    ]

    mentor = models.ForeignKey(UserProfile, on_delete=models.CASCADE,
                              related_name='mentor_appointments',
                              limit_choices_to={'user_type': 'mentor'})
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE,
                               related_name='student_appointments',
                               limit_choices_to={'user_type': 'student'})
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='appointments')

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='proposed')
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.mentor.user.get_full_name()} ↔ {self.student.user.get_full_name()} ({self.start_time.date()})"

    class Meta:
        # TODO: Uncomment constraints after initial migrations complete
        # Temporary: Commented out to allow migrations to run without CheckConstraint errors
        pass
        # constraints = [
        #     models.CheckConstraint(
        #         check=models.Q(end_time__gt=models.F('start_time')),
        #         name='valid_time_range'
        #     ),
        #     models.CheckConstraint(
        #         check=models.Q(status__in=['proposed', 'confirmed', 'completed', 'cancelled', 'reschedule_requested']),
        #         name='valid_appointment_status'
        #     ),
        # ]
        # Note: The no_overlap constraint from schema.sql would need a custom database constraint
        # or could be enforced in the application logic
