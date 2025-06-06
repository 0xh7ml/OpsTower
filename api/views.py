from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Task
from .serializer import TaskSerializer, UserSerializer
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

class IndexView(APIView):
    def get(self, request):
        return Response({'message': 'Welcome to the Task Management API'}, status=status.HTTP_200_OK)

# Create your views here.
class SignUpView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data["email"]
        first_name = serializer.validated_data["first_name"]
        last_name = serializer.validated_data["last_name"]
        password = serializer.validated_data["password"]

        """
        Check the username is already exists or not
        make sure the username is unique and don't be case sensitive
        """
        
        if User.objects.filter(username=email.lower().strip()).exists():
            return Response({'status': 'error','data': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.create_user(
                username=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
            )
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'status': 'error', 'data': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@permission_classes([IsAuthenticated])
class TaskView(APIView):
    def get(self, request):
        tasks = Task.objects.filter(created_by=request.user)  # Filter tasks by the current user
        if not tasks.exists():
            return Response({'status': 'error', 'data': 'No tasks found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Automatically set the created_by field to the current user
        serializer = TaskSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@permission_classes([IsAuthenticated])
class TaskDetailView(APIView):
    def get_object(self, pk, user):
        try:
            task = Task.objects.get(pk=pk)
            if task.created_by != user:
                return None  # Return None if the task was not created by the current user
            return task
        except Task.DoesNotExist:
            return None

    def get(self, request, pk):
        task = self.get_object(pk, request.user)
        if task is None:
            return Response({'status': 'error', 'data': 'No tasks found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        task = self.get_object(pk, request.user)
        if task is None:
            return Response({'status': 'error', 'data': 'No tasks found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        if task is None:
            return Response({'status': 'error', 'data': 'No tasks found'},status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)