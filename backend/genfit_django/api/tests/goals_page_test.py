import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from ..models import FitnessGoal
from ..serializers import FitnessGoalSerializer
from datetime import datetime, timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user():
    def _create_user(username="testuser", password="password123", user_type="Regular"):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password=password,
            user_type=user_type
        )
    return _create_user

@pytest.fixture
def create_coach():
    def _create_coach(username="coach", password="password123"):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password=password,
            user_type="Coach",
            is_verified_coach=True
        )
    return _create_coach

@pytest.fixture
def create_goal():
    def _create_goal(user, mentor=None, title="Test Goal", goal_type="WALKING_RUNNING",
                   target_value=5.0, current_value=0.0, unit="km"):
        return FitnessGoal.objects.create(
            user=user,
            mentor=mentor,
            title=title,
            goal_type=goal_type,
            description="Test description",
            target_value=target_value,
            current_value=current_value,
            unit=unit,
            start_date=datetime.now(),
            target_date=datetime.now() + timedelta(days=30),
            status="ACTIVE"
        )
    return _create_goal

@pytest.mark.django_db
class TestGoalsAPI:
    def test_get_goals_authenticated(self, api_client, create_user, create_goal):
        """Test retrieving goals when user is authenticated."""
        user = create_user()
        api_client.force_authenticate(user=user)

        # Create some goals for the user
        goal1 = create_goal(user=user, title="Run 5K")
        goal2 = create_goal(user=user, title="Bench Press", goal_type="STRENGTH")
        
        # Get goals
        url = reverse('fitness_goals')
        response = api_client.get(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the goals are returned
        goals = FitnessGoal.objects.filter(user=user)
        serializer = FitnessGoalSerializer(goals, many=True)
        assert response.data == serializer.data
        assert len(response.data) == 2

    def test_create_goal_without_mentor(self, api_client, create_user):
        """Test creating a goal without a mentor."""
        user = create_user()
        api_client.force_authenticate(user=user)
        
        url = reverse('fitness_goals')
        data = {
            'title': 'New Goal',
            'goal_type': 'WALKING_RUNNING',
            'description': 'Test description',
            'target_value': 10.0,
            'current_value': 0.0,
            'unit': 'km',
            'start_date': datetime.now().isoformat(),
            'target_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'status': 'ACTIVE'
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify goal was created
        assert FitnessGoal.objects.filter(title='New Goal').exists()
        goal = FitnessGoal.objects.get(title='New Goal')
        assert goal.user == user
        assert goal.mentor is None

    def test_create_goal_with_mentor(self, api_client, create_user, create_coach):
        """Test creating a goal with a mentor."""
        user = create_user()
        coach = create_coach()
        api_client.force_authenticate(user=user)
        
        url = reverse('fitness_goals')
        data = {
            'title': 'Mentored Goal',
            'goal_type': 'CYCLING',
            'description': 'Goal with mentor',
            'target_value': 20.0,
            'current_value': 0.0,
            'unit': 'km',
            'start_date': datetime.now().isoformat(),
            'target_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'status': 'ACTIVE',
            'mentor': coach.id
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify goal was created with mentor
        goal = FitnessGoal.objects.get(title='Mentored Goal')
        assert goal.user == user
        assert goal.mentor == coach

    def test_mentor_creating_goal_for_user(self, api_client, create_user, create_coach):
        """Test a mentor creating a goal for a user."""
        user = create_user()
        coach = create_coach()
        api_client.force_authenticate(user=coach)
        
        url = reverse('fitness_goals')
        data = {
            'title': 'Coach Assigned Goal',
            'goal_type': 'STRENGTH',
            'description': 'Goal assigned by coach',
            'target_value': 80.0,
            'current_value': 40.0,
            'unit': 'kg',
            'start_date': datetime.now().isoformat(),
            'target_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'status': 'ACTIVE',
            'user': user.id
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify goal was created
        goal = FitnessGoal.objects.get(title='Coach Assigned Goal')
        assert goal.user == user
        assert goal.mentor == coach
        
        # Verify notification was created
        from ..models import Notification
        notification = Notification.objects.filter(
            recipient=user,
            sender=coach,
            notification_type='GOAL',
            related_object_id=goal.id
        ).first()
        
        assert notification is not None
        assert 'Coach Assigned Goal' in notification.message

    def test_update_goal_progress(self, api_client, create_user, create_goal):
        """Test updating goal progress."""
        user = create_user()
        goal = create_goal(user=user, target_value=10.0, current_value=2.0)
        api_client.force_authenticate(user=user)
        
        url = reverse('update_goal_progress', kwargs={'goal_id': goal.id})
        data = {'current_value': 5.0}
        
        response = api_client.patch(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify goal was updated
        goal.refresh_from_db()
        assert goal.current_value == 5.0
        assert goal.status == 'ACTIVE'  # not completed yet

    def test_complete_goal(self, api_client, create_user, create_goal):
        """Test completing a goal by reaching target value."""
        user = create_user()
        goal = create_goal(user=user, target_value=10.0, current_value=9.0)
        api_client.force_authenticate(user=user)
        
        url = reverse('update_goal_progress', kwargs={'goal_id': goal.id})
        data = {'current_value': 10.0}  # reaching target value
        
        response = api_client.patch(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify goal was completed
        goal.refresh_from_db()
        assert goal.current_value == 10.0
        assert goal.status == 'COMPLETED'
        
        # Verify notification was created
        from ..models import Notification
        notification = Notification.objects.filter(
            recipient=user,
            notification_type='ACHIEVEMENT',
            related_object_id=goal.id
        ).first()
        
        assert notification is not None
        assert 'Congratulations' in notification.message

    def test_restart_goal(self, api_client, create_user, create_goal):
        """Test restarting a goal."""
        user = create_user()
        goal = create_goal(user=user, current_value=5.0)
        original_start_date = goal.start_date
        api_client.force_authenticate(user=user)
        
        url = reverse('update_goal_progress', kwargs={'goal_id': goal.id})
        data = {'status': 'RESTARTED'}
        
        response = api_client.patch(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify goal was restarted
        goal.refresh_from_db()
        assert goal.current_value == 0.0
        assert goal.status == 'RESTARTED'
        assert goal.start_date > original_start_date  # start date should be updated

    def test_check_inactive_goals(self, api_client, create_user, create_goal):
        """Test checking and marking inactive goals."""
        user = create_user()
        goal1 = create_goal(user=user)
        goal2 = create_goal(user=user, title="Old Goal")
        
        # Manually update last_updated to make the goal inactive
        from django.utils import timezone
        goal2.last_updated = timezone.now() - timedelta(days=10)
        goal2.save()
        
        api_client.force_authenticate(user=user)
        url = reverse('check_inactive_goals')
        
        response = api_client.get(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        assert "1 goals marked as inactive" in response.data['message']
        
        # Verify goal was marked inactive
        goal2.refresh_from_db()
        assert goal2.status == 'INACTIVE'
        
        # Verify notification was created
        from ..models import Notification
        notification = Notification.objects.filter(
            recipient=user, 
            notification_type='GOAL_INACTIVE',
            related_object_id=goal2.id
        ).first()
        
        assert notification is not None
        assert 'inactive for 7 days' in notification.message