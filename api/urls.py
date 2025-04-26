from django.contrib import admin
from django.urls import path

from api.views import TaskView, TaskDetailView, LoginView, RegisterView, IndexView

urlpatterns = [
    path('', IndexView.as_view(), name='index-view'),
    path('task/', TaskView.as_view(), name='task-view'),
    path('task/<int:pk>/', TaskDetailView.as_view(), name='task-detail-view'),

    path('login/', LoginView.as_view(), name='login-view'),
    path('register/', RegisterView.as_view(), name='register-view')
]
