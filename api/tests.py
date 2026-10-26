from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Task


class AnalyticsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='a@b.com', password='pw')
        self.other = User.objects.create_user(username='c@d.com', password='pw')

    def _login(self):
        res = self.client.post('/auth/token/', {'username': 'a@b.com', 'password': 'pw'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_requires_auth(self):
        self.assertEqual(self.client.get('/analytics/').status_code, 401)
        self.assertEqual(self.client.get('/task/').status_code, 401)

    def test_bad_range(self):
        self._login()
        self.assertEqual(self.client.get('/analytics/?range=decade').status_code, 400)

    def test_week_summary(self):
        now = timezone.now()
        Task.objects.create(title='a', status='TODO', created_by=self.user)
        Task.objects.create(title='b', status='COMPLETED', priority='HIGH', created_by=self.user)
        Task.objects.create(title='c', status='IN PROGRESS', created_by=self.user, due_date=now - timedelta(days=1))
        Task.objects.create(title='other', status='TODO', created_by=self.other)
        old = Task.objects.create(title='old', status='TODO', created_by=self.user)
        Task.objects.filter(pk=old.pk).update(created_at=now - timedelta(days=60), updated_at=now - timedelta(days=60))

        self._login()
        data = self.client.get('/analytics/?range=week').data
        self.assertEqual(data['summary']['total'], 3)
        self.assertEqual(data['summary']['completed'], 1)
        self.assertEqual(data['summary']['overdue'], 1)
        self.assertEqual(len(data['timeline']['points']), 7)
        self.assertEqual(sum(p['created'] for p in data['timeline']['points']), 3)

        self.assertEqual(self.client.get('/analytics/?range=all').data['summary']['total'], 4)
        self.assertEqual(len(self.client.get('/analytics/?range=year').data['timeline']['points']), 12)


class TaskOrderingTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='a@b.com', password='pw')
        self.other = User.objects.create_user(username='c@d.com', password='pw')
        res = self.client.post('/auth/token/', {'username': 'a@b.com', 'password': 'pw'}, format='json')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def _create(self, title, **extra):
        return self.client.post('/task/', {'title': title, **extra}, format='json').data

    def test_new_tasks_go_to_bottom_of_their_column(self):
        a, b = self._create('a'), self._create('b')
        c = self._create('c', status='COMPLETED')
        self.assertEqual([a['position'], b['position'], c['position']], [0, 1, 0])
        self.assertEqual([t['title'] for t in self.client.get('/task/').data if t['status'] == 'TODO'], ['a', 'b'])

    def test_reorder_and_move_between_columns(self):
        a, b, c = self._create('a'), self._create('b'), self._create('c')
        res = self.client.post('/task/reorder/', {'items': [
            {'id': c['id'], 'status': 'TODO', 'position': 0},
            {'id': a['id'], 'status': 'TODO', 'position': 1},
            {'id': b['id'], 'status': 'COMPLETED', 'position': 0},
        ]}, format='json')
        self.assertEqual(res.status_code, 200)
        tasks = self.client.get('/task/').data
        self.assertEqual([t['title'] for t in tasks if t['status'] == 'TODO'], ['c', 'a'])
        self.assertEqual([t['title'] for t in tasks if t['status'] == 'COMPLETED'], ['b'])

    def test_reorder_rejects_other_users_tasks_and_bad_input(self):
        mine = self._create('mine')
        theirs = Task.objects.create(title='x', created_by=self.other)
        res = self.client.post('/task/reorder/', {'items': [
            {'id': mine['id'], 'status': 'TODO', 'position': 5},
            {'id': theirs.id, 'status': 'TODO', 'position': 0},
        ]}, format='json')
        self.assertEqual(res.status_code, 404)
        self.assertEqual(Task.objects.get(pk=mine['id']).position, 0)
        self.assertEqual(self.client.post('/task/reorder/', {'items': []}, format='json').status_code, 400)
        bad = {'items': [{'id': mine['id'], 'status': 'NOPE', 'position': 0}]}
        self.assertEqual(self.client.post('/task/reorder/', bad, format='json').status_code, 400)

    def test_editing_status_moves_task_to_bottom(self):
        a, b = self._create('a'), self._create('b', status='BLOCKED')
        res = self.client.put(f"/task/{a['id']}/", {'title': 'a', 'status': 'BLOCKED'}, format='json')
        self.assertEqual(res.data['position'], b['position'] + 1)
