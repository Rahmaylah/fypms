from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserProfileViewSet, ProjectViewSet, ProjectStudentViewSet,
    DuplicateFlagViewSet, AppointmentViewSet, login_view
)

router = DefaultRouter()
router.register(r'profiles', UserProfileViewSet, basename='userprofile')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-students', ProjectStudentViewSet, basename='projectstudent')
router.register(r'duplicate-flags', DuplicateFlagViewSet, basename='duplicateflag')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

app_name = 'api'

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),
]
