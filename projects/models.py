from django.db import models
from pgvector.django import VectorField
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import User

class ProjectType(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    STATUS_CHOICES = [
        ('proposed', 'Proposed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Creator
    title = models.CharField(max_length=500)
    main_objective = models.TextField(blank=True)
    specific_objectives = models.JSONField(default=list, blank=True)
    project_description = models.TextField(blank=True)
    implementation_details = models.TextField(blank=True)
    year = models.IntegerField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='proposed')

    # Embeddings
    title_embedding = VectorField(dimensions=768, null=True, blank=True)
    objectives_embedding = VectorField(dimensions=768, null=True, blank=True)
    combined_embedding = VectorField(dimensions=768, null=True, blank=True)

    # Duplicate detection
    last_similarity_check = models.DateTimeField(null=True, blank=True)
    is_flagged_duplicate = models.BooleanField(default=False)
    duplicate_check_score = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.year}) ({self.status})"


class DuplicateFlag(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='duplicate_flags')
    similar_project = models.ForeignKey(Project, on_delete=models.CASCADE)
    similarity_score = models.FloatField()
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flag: {self.project.title} ~ {self.similar_project.title}"

class ProjectUser(models.Model):
    ROLE_CHOICES = [
        ('lead', 'Lead'),
        ('member', 'Member'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_users')
    user = models.ForeignKey(User, on_delete=models.CASCADE,
                            related_name='project_users',
                            limit_choices_to={'role': 'student'})
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='lead')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.project.title} ({self.role})"


@receiver(post_save, sender=Project)
def create_project_user(sender, instance, created, **kwargs):
    """
    Automatically create a ProjectUser entry when a Project is created.
    This ensures that the project creator is assigned to their own project.
    """
    if created:
        ProjectUser.objects.get_or_create(
            project=instance,
            user=instance.user,
            defaults={'role': 'lead'}
        )
