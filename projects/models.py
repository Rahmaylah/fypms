from django.db import models
from pgvector.django import VectorField
from accounts.models import UserProfile

class Project(models.Model):
    STATUS_CHOICES = [
        ('proposed', 'Proposed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=500)
    objectives = models.TextField()
    implementation_details = models.TextField(blank=True)
    year = models.IntegerField()

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='proposed')

    # Embeddings for duplicate detection (768 dimensions for SBERT)
    title_embedding = VectorField(dimensions=768, null=True, blank=True)
    objectives_embedding = VectorField(dimensions=768, null=True, blank=True)
    combined_embedding = VectorField(dimensions=768, null=True, blank=True)

    # Duplicate detection metadata
    last_similarity_check = models.DateTimeField(null=True, blank=True)
    is_flagged_duplicate = models.BooleanField(default=False)
    duplicate_check_score = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.year})"

    class Meta:
        # TODO: Uncomment constraints after initial migrations complete
        # Temporary: Commented out to allow migrations to run without CheckConstraint errors
        pass
        # constraints = [
        #     models.CheckConstraint(
        #         check=models.Q(year__gte=2020),
        #         name='valid_year'
        #     ),
        # ]

class ProjectStudent(models.Model):
    ROLE_CHOICES = [
        ('lead', 'Lead'),
        ('member', 'Member'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_students')
    student = models.ForeignKey(UserProfile, on_delete=models.CASCADE,
                               related_name='student_projects',
                               limit_choices_to={'user_type': 'student'})
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.project.title} ({self.role})"

    class Meta:
        unique_together = ['project', 'student']
        # TODO: Uncomment constraints after initial migrations complete
        # Temporary: Commented out to allow migrations to run without CheckConstraint errors
        # constraints = [
        #     models.CheckConstraint(
        #         check=models.Q(role__in=['lead', 'member']),
        #         name='valid_role'
        #     ),
        # ]

class DuplicateFlag(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='duplicate_flags')
    similar_project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='similar_flags')
    similarity_score = models.FloatField()
    flagged_at = models.DateTimeField(auto_now_add=True)
    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='reviewed_flags')

    def __str__(self):
        return f"Duplicate: {self.project.title} ↔ {self.similar_project.title} ({self.similarity_score:.3f})"

    class Meta:
        unique_together = ['project', 'similar_project']
