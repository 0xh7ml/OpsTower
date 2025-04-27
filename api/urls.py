from django.contrib import admin
from django.urls import path

from api.views import TaskView, TaskDetailView, SignUpView, IndexView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', IndexView.as_view(), name='index-view'),
    path('task/', TaskView.as_view(), name='task-view'),
    path('task/<int:pk>/', TaskDetailView.as_view(), name='task-detail-view'),

    path('auth/signup/', SignUpView.as_view(), name='signup-view'),

    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
