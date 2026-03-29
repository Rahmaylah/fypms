from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    USER_TYPES = [
        ('student', 'Student'),
        ('mentor', 'Mentor'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')

    # Common fields
    department = models.CharField(max_length=255, blank=True)

    # Student-specific fields
    registration_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    course_id = models.CharField(max_length=100, blank=True)

    # Mentor-specific fields
    max_students = models.IntegerField(default=5)  # Load balancing for mentors
    is_admin = models.BooleanField(default=False)

    # Auto-assigned mentor for students
    mentor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='assigned_students', limit_choices_to={'user_type': 'mentor'})

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.user_type})"

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(user_type__in=['student', 'mentor', 'admin']),
                name='valid_user_type'
            ),
        ]

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()
