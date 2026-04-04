from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProjectViewSet, ProjectTypeViewSet, ProjectUserViewSet,
    DuplicateFlagViewSet, login_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-types', ProjectTypeViewSet, basename='projecttype')
router.register(r'project-users', ProjectUserViewSet, basename='projectuser')
router.register(r'duplicate-flags', DuplicateFlagViewSet, basename='duplicateflag')

app_name = 'api'

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login'),
]
