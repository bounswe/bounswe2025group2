from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import FitnessGoal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class GoalCreationTests(TestCase):
    def setUp(self):
        """Set up test data and client for all test methods."""
        # Create test users
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123',
            user_type='User'
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Create sample goal data
        self.valid_goal_data = {
            'goal_type': 'WALKING_RUNNING',
            'title': 'Lose Weight',
            'description': 'I want to lose 5kg in 2 months',
            'target_value': 5.0,
            'unit': 'kg',
            'target_date': (timezone.now() + timedelta(days=60)).strftime('%Y-%m-%d'),
        }
        
        # URL for goal creation endpoint
        self.goals_url = reverse('fitness-goals-list')  # Adjust this to match your actual URL name

    def test_create_goal_authenticated(self):
        """Test creating a goal when authenticated."""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Send POST request to create goal
        response = self.client.post(self.goals_url, self.valid_goal_data, format='json')
        
        # Assert response status code is 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that the goal was created in the database
        self.assertEqual(FitnessGoal.objects.count(), 1)
        
        # Verify the goal belongs to the correct user
        goal = FitnessGoal.objects.first()
        self.assertEqual(goal.user, self.user)
        self.assertEqual(goal.title, self.valid_goal_data['title'])

    def test_create_goal_unauthenticated(self):
        """Test creating a goal when not authenticated."""
        # Don't authenticate the client
        
        # Send POST request to create goal
        response = self.client.post(self.goals_url, self.valid_goal_data, format='json')
        
        # Assert response status code is 401 UNAUTHORIZED
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Check that no goal was created
        self.assertEqual(FitnessGoal.objects.count(), 0)

    def test_create_goal_invalid_data(self):
        """Test creating a goal with invalid data."""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Invalid goal data (missing required fields)
        invalid_data = {
            'title': 'Lose Weight',
            # Missing other required fields
        }
        
        # Send POST request with invalid data
        response = self.client.post(self.goals_url, invalid_data, format='json')
        
        # Assert response status code is 400 BAD REQUEST
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Check that no goal was created
        self.assertEqual(FitnessGoal.objects.count(), 0)

    def test_retrieve_user_goals(self):
        """Test retrieving all goals for the authenticated user."""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Create a few goals for the user
        FitnessGoal.objects.create(
            user=self.user,
            goal_type='WALKING_RUNNING',
            title='Lose Weight',
            description='I want to lose 5kg in 2 months',
            target_value=5.0,
            unit='kg',
            target_date=(timezone.now() + timedelta(days=60)),
        )
        
        FitnessGoal.objects.create(
            user=self.user,
            goal_type='RUNNING',
            title='Run Marathon',
            description='Train to run a marathon',
            target_value=42.2,
            unit='km',
            target_date=(timezone.now() + timedelta(days=180)),
        )
        
        # Send GET request to retrieve goals
        response = self.client.get(self.goals_url)
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that the response contains 2 goals
        self.assertEqual(len(response.data), 2)
        
        # Verify the goal titles
        goal_titles = [goal['title'] for goal in response.data]
        self.assertIn('Lose Weight', goal_titles)
        self.assertIn('Run Marathon', goal_titles)

    def test_update_goal(self):
        """Test updating an existing goal."""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Create a goal
        goal = FitnessGoal.objects.create(
            user=self.user,
            goal_type='WALKING_RUNNING',
            title='Lose Weight',
            description='I want to lose 5kg in 2 months',
            target_value=5.0,
            unit='kg',
            target_date=(timezone.now() + timedelta(days=60)),
        )
        
        # URL for updating a specific goal
        update_url = reverse('fitness-goals-detail', args=[goal.id])  # Adjust this to match your actual URL name
        
        # Updated data
        updated_data = {
            'title': 'Lose Weight Fast',
            'description': 'I want to lose 10kg in 2 months',
            'target_value': 10.0
        }
        
        # Send PATCH request to update the goal
        response = self.client.patch(update_url, updated_data, format='json')
        
        # Assert response status code is 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh the goal from the database
        goal.refresh_from_db()
        
        # Verify the goal was updated
        self.assertEqual(goal.title, 'Lose Weight Fast')
        self.assertEqual(goal.description, 'I want to lose 10kg in 2 months')
        self.assertEqual(goal.target_value, 10.0)

    def test_delete_goal(self):
        """Test deleting an existing goal."""
        # Login the user
        self.client.force_authenticate(user=self.user)
        
        # Create a goal
        goal = FitnessGoal.objects.create(
            user=self.user,
            goal_type='WALKING_RUNNING',
            title='Temporary Goal',
            description='This goal will be deleted',
            target_value=1.0,
            unit='units',
            target_date=(timezone.now() + timedelta(days=30)),
        )
        
        # URL for deleting a specific goal
        delete_url = reverse('fitness-goals-detail', args=[goal.id])  # Adjust this to match your actual URL name
        
        # Send DELETE request
        response = self.client.delete(delete_url)
        
        # Assert response status code is 204 NO CONTENT
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that the goal was deleted from the database
        self.assertEqual(FitnessGoal.objects.count(), 0)
