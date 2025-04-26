from rest_framework import serializers
from .models import User, Task

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password']
    
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id','title', 'description', 'status', 'priority', 'due_date', 'assigned_to']

