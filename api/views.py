from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Task
from .serializer import ReorderSerializer, TaskSerializer, UserSerializer
from .analytics import RANGES, build_analytics
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated

def next_position(user, task_status):
    """Position that puts a task at the bottom of a status column."""
    last = Task.objects.filter(created_by=user, status=task_status).aggregate(last=Max('position'))['last']
    return 0 if last is None else last + 1


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


class TaskView(APIView):
    permission_classes = [IsAuthenticated]

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
            task_status = serializer.validated_data.get('status', 'TODO')
            serializer.save(created_by=request.user, position=next_position(request.user, task_status))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

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
            extra = {}
            new_status = serializer.validated_data.get('status', task.status)
            if new_status != task.status:
                # changing column (modal edit, overdue auto-block, ...) drops the task at the bottom
                extra['position'] = next_position(request.user, new_status)
            serializer.save(**extra)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        if task is None:
            return Response({'status': 'error', 'data': 'No tasks found'},status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        range_name = request.query_params.get('range', 'week')
        if range_name not in RANGES:
            return Response(
                {'status': 'error', 'data': f"range must be one of: {', '.join(RANGES)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(build_analytics(request.user, range_name), status=status.HTTP_200_OK)



class TaskReorderView(APIView):
    """POST {"items": [{"id", "status", "position"}, ...]} - set column and order for many tasks at once."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReorderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        items = serializer.validated_data['items']
        ids = [item['id'] for item in items]
        if len(set(ids)) != len(ids):
            return Response({'status': 'error', 'data': 'Duplicate task ids'}, status=status.HTTP_400_BAD_REQUEST)

        tasks = {t.id: t for t in Task.objects.filter(created_by=request.user, id__in=ids)}
        if len(tasks) != len(ids):
            return Response({'status': 'error', 'data': 'No tasks found'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        for item in items:
            task = tasks[item['id']]
            if task.status != item['status']:
                task.updated_at = now  # bulk_update skips auto_now; a status change counts as activity
            task.status = item['status']
            task.position = item['position']

        with transaction.atomic():
            Task.objects.bulk_update(tasks.values(), ['status', 'position', 'updated_at'])
        return Response({'status': 'success'}, status=status.HTTP_200_OK)
