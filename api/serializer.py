from rest_framework import serializers
from .models import User, Task
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password']
    

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id','title', 'description', 'status', 'priority', 'due_date', 'assigned_to', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

