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
        fields = ['id','title', 'description', 'status', 'priority', 'due_date', 'assigned_to', 'position', 'created_at', 'updated_at']
        read_only_fields = ['position', 'created_at', 'updated_at']



class ReorderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=[c[0] for c in Task.STATUS_CHOICES])
    position = serializers.IntegerField(min_value=0)


class ReorderSerializer(serializers.Serializer):
    items = ReorderItemSerializer(many=True, allow_empty=False, max_length=500)
