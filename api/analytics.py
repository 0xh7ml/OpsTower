from collections import Counter
from datetime import timedelta

from django.utils import timezone

from .models import Task

RANGES = ('week', 'month', 'year', 'all')


def _month_start(dt, offset=0):
    """First day (midnight) of the month `offset` months away from dt."""
    index = dt.year * 12 + (dt.month - 1) + offset
    return dt.replace(year=index // 12, month=index % 12 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)


def _build_buckets(range_name, now):
    """Return (list of (start, label_date), kind) for the timeline, oldest first."""
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if range_name in ('week', 'month'):
        days = 7 if range_name == 'week' else 30
        return [today - timedelta(days=i) for i in range(days - 1, -1, -1)], 'day'
    return [_month_start(today, -i) for i in range(11, -1, -1)], 'month'


def build_analytics(user, range_name, now=None):
    now = timezone.localtime(now or timezone.now())
    buckets, kind = _build_buckets(range_name, now)
    range_start = None if range_name == 'all' else buckets[0]

    tasks = list(Task.objects.filter(created_by=user))
    if range_start is not None:
        # a task counts for the range if it was created or last touched inside it
        tasks = [t for t in tasks if t.created_at >= range_start or t.updated_at >= range_start]

    def bucket_key(dt):
        dt = timezone.localtime(dt)
        return dt.date().isoformat() if kind == 'day' else dt.strftime('%Y-%m')

    keys = [b.date().isoformat() if kind == 'day' else b.strftime('%Y-%m') for b in buckets]
    created = Counter(bucket_key(t.created_at) for t in tasks)
    completed = Counter(bucket_key(t.updated_at) for t in tasks if t.status == 'COMPLETED')

    by_status = Counter(t.status for t in tasks)
    by_priority = Counter(t.priority for t in tasks)
    overdue = sum(1 for t in tasks if t.due_date and t.due_date < now and t.status != 'COMPLETED')
    total = len(tasks)
    done = by_status['COMPLETED']

    return {
        'range': range_name,
        'summary': {
            'total': total,
            'completed': done,
            'in_progress': by_status['IN PROGRESS'],
            'todo': by_status['TODO'],
            'blocked': by_status['BLOCKED'],
            'overdue': overdue,
            'completion_rate': round(done / total * 100, 1) if total else 0,
        },
        'by_status': [{'status': s, 'count': by_status[s]} for s in ('TODO', 'IN PROGRESS', 'COMPLETED', 'BLOCKED')],
        'by_priority': [{'priority': p, 'count': by_priority[p]} for p in ('LOW', 'MEDIUM', 'HIGH')],
        'timeline': {
            'granularity': kind,
            'points': [{'date': k, 'created': created[k], 'completed': completed[k]} for k in keys],
        },
    }
