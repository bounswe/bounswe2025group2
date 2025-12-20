from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock
from api.models import UserWithType, Profile, FitnessGoal
from django.utils import timezone
import datetime


class GoalSuggestionsTests(TestCase):
    """Test cases for AI-powered goal suggestions functionality"""

    def setUp(self):
        """Setup test data and clients"""
        # Create test user
        self.user = UserWithType.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type="User",
            is_active=True
        )

        # Update user profile with fitness data (profile auto-created by signal)
        self.profile = self.user.profile
        self.profile.name = "Test"
        self.profile.surname = "User"
        self.profile.birth_date = timezone.now().date() - datetime.timedelta(days=25*365)  # 25 years old
        self.profile.bio = "Beginner runner looking to improve fitness"
        self.profile.location = "New York"
        self.profile.save()

        # Create some existing goals for context
        FitnessGoal.objects.create(
            user=self.user,
            title="Morning Runs",
            goal_type="WALKING_RUNNING",
            target_value=10,
            current_value=6,
            unit="km",
            status="ACTIVE",
            start_date=timezone.now() - datetime.timedelta(days=10),
            target_date=timezone.now() + datetime.timedelta(days=20)
        )

        # Create API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # URL
        self.suggestions_url = reverse('get_goal_suggestions')

        # Mock AI response (realistic goal)
        self.mock_realistic_response = {
            "is_realistic": True,
            "warning_message": None,
            "target_value": 5,
            "unit": "km",
            "days_to_complete": 45,
            "goal_type": "WALKING_RUNNING",
            "tips": [
                "Start with walk-run intervals, 3x per week for 20-30 minutes.",
                "Increase running time by 10% each week to avoid injury.",
                "Stay hydrated and stretch after each session."
            ]
        }

        # Mock AI response (unrealistic goal)
        self.mock_unrealistic_response = {
            "is_realistic": False,
            "warning_message": "Losing 30kg in 1 week is medically dangerous and impossible. A safe target is 0.5-1kg per week. Consider a 30-60 week timeline.",
            "target_value": 0.5,
            "unit": "kg",
            "days_to_complete": 7,
            "goal_type": "WORKOUT",
            "tips": [
                "Focus on sustainable calorie deficit with regular exercise.",
                "Combine cardio with strength training 4-5 times weekly.",
                "Prioritize protein intake and adequate sleep for recovery."
            ]
        }

    def test_get_suggestions_requires_authentication(self):
        """Test that endpoint requires authentication"""
        unauthenticated_client = APIClient()
        response = unauthenticated_client.post(self.suggestions_url, {
            "title": "Run 5K",
            "description": "Want to run my first 5K"
        })
        # DRF returns 403 Forbidden when authentication is required but not provided
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_suggestions_requires_title(self):
        """Test that title field is required"""
        response = self.client.post(self.suggestions_url, {
            "description": "Some description"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
        self.assertEqual(response.json()['error'], 'Title is required')

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_get_suggestions_realistic_goal(self, mock_groq):
        """Test getting suggestions for a realistic goal"""
        mock_groq.return_value = self.mock_realistic_response

        response = self.client.post(self.suggestions_url, {
            "title": "Run my first 5K",
            "description": "I want to be able to run 5 kilometers without stopping"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check response structure
        self.assertIn('is_realistic', data)
        self.assertIn('warning_message', data)
        self.assertIn('target_value', data)
        self.assertIn('unit', data)
        self.assertIn('days_to_complete', data)
        self.assertIn('goal_type', data)
        self.assertIn('tips', data)

        # Check values
        self.assertTrue(data['is_realistic'])
        self.assertIsNone(data['warning_message'])
        self.assertEqual(data['target_value'], 5)
        self.assertEqual(data['unit'], 'km')
        self.assertEqual(data['days_to_complete'], 45)
        self.assertEqual(data['goal_type'], 'WALKING_RUNNING')
        self.assertEqual(len(data['tips']), 3)

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_get_suggestions_unrealistic_goal(self, mock_groq):
        """Test getting suggestions for an unrealistic/dangerous goal"""
        mock_groq.return_value = self.mock_unrealistic_response

        response = self.client.post(self.suggestions_url, {
            "title": "Extreme weight loss",
            "description": "Lose 30kg in one week"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check safety validation
        self.assertFalse(data['is_realistic'])
        self.assertIsNotNone(data['warning_message'])
        self.assertIn('dangerous', data['warning_message'].lower())

        # Check safer alternative is provided
        self.assertEqual(data['target_value'], 0.5)
        self.assertEqual(data['unit'], 'kg')
        self.assertEqual(len(data['tips']), 3)

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_get_suggestions_with_empty_description(self, mock_groq):
        """Test that description is optional"""
        mock_groq.return_value = self.mock_realistic_response

        response = self.client.post(self.suggestions_url, {
            "title": "Run 5K"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify Groq was called with default description
        mock_groq.assert_called_once()
        call_args = mock_groq.call_args
        self.assertEqual(call_args[0][2], "No description provided")

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_get_suggestions_ai_service_error(self, mock_groq):
        """Test handling of AI service errors"""
        mock_groq.side_effect = Exception("AI service unavailable")

        response = self.client.post(self.suggestions_url, {
            "title": "Run 5K",
            "description": "Want to run"
        })

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        data = response.json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Failed to generate suggestions')

    def test_rate_limiting(self):
        """Test that rate limiting is enforced (10 requests per hour)"""
        with patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq') as mock_groq:
            mock_groq.return_value = self.mock_realistic_response

            # Make 10 requests (should succeed)
            for i in range(10):
                response = self.client.post(self.suggestions_url, {
                    "title": f"Goal {i}",
                    "description": "Test goal"
                })
                self.assertEqual(response.status_code, status.HTTP_200_OK)

            # 11th request should be throttled
            response = self.client.post(self.suggestions_url, {
                "title": "Goal 11",
                "description": "This should be throttled"
            })
            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            data = response.json()
            self.assertIn('detail', data)

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_user_context_gathering(self, mock_groq):
        """Test that user context is properly gathered and passed to AI"""
        mock_groq.return_value = self.mock_realistic_response

        response = self.client.post(self.suggestions_url, {
            "title": "New Challenge",
            "description": "Push my limits"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify Groq was called with user context
        mock_groq.assert_called_once()
        call_args = mock_groq.call_args

        # Check that user was passed
        self.assertEqual(call_args[0][0], self.user)
        self.assertEqual(call_args[0][1], "New Challenge")
        self.assertEqual(call_args[0][2], "Push my limits")


class GoalSuggestionsEliteAthleteTests(TestCase):
    """Test cases for elite athlete goal suggestions"""

    def setUp(self):
        """Setup elite athlete test data"""
        self.user = UserWithType.objects.create_user(
            username="eliteathlete",
            email="elite@example.com",
            password="testpass123",
            user_type="User",
            is_active=True
        )

        # Update elite athlete profile (profile auto-created by signal)
        self.profile = self.user.profile
        self.profile.name = "Elite"
        self.profile.surname = "Fighter"
        self.profile.birth_date = timezone.now().date() - datetime.timedelta(days=28*365)  # 28 years old
        self.profile.bio = "Currently fighting in MMA, ranked 3rd in the world"
        self.profile.location = "Las Vegas"
        self.profile.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.suggestions_url = reverse('get_goal_suggestions')

        # Mock response for elite athlete championship goal
        self.mock_championship_response = {
            "is_realistic": True,
            "warning_message": None,
            "target_value": 1,
            "unit": "championship",
            "days_to_complete": 730,
            "goal_type": "SPORTS",
            "tips": [
                "Refine weaknesses - study top 2 fighters",
                "Peak conditioning for title shot",
                "Mental game with sports psychologist"
            ]
        }

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_elite_athlete_championship_goal_is_realistic(self, mock_groq):
        """Test that championship goals for elite athletes are marked realistic"""
        mock_groq.return_value = self.mock_championship_response

        response = self.client.post(self.suggestions_url, {
            "title": "Become MMA Champion",
            "description": "Win the championship title"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Elite athlete pursuing championship should be realistic
        self.assertTrue(data['is_realistic'])
        self.assertIsNone(data['warning_message'])
        self.assertEqual(data['unit'], 'championship')

        # Tips should be elite-level, not beginner advice
        tips_text = ' '.join(data['tips']).lower()
        self.assertNotIn('start', tips_text)
        self.assertNotIn('beginner', tips_text)


class GoalSuggestionsTipsValidationTests(TestCase):
    """Test cases for tips validation and quality"""

    def setUp(self):
        self.user = UserWithType.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type="User",
            is_active=True
        )

        # Update profile (auto-created by signal)
        profile = self.user.profile
        profile.name = "Test"
        profile.surname = "User"
        profile.birth_date = timezone.now().date() - datetime.timedelta(days=30*365)  # 30 years old
        profile.bio = "Regular gym-goer"
        profile.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.suggestions_url = reverse('get_goal_suggestions')

    @patch('api.separate_views.goal_suggestions.get_goal_suggestions_from_groq')
    def test_tips_are_exactly_three(self, mock_groq):
        """Test that exactly 3 tips are returned"""
        mock_groq.return_value = {
            "is_realistic": True,
            "warning_message": None,
            "target_value": 10,
            "unit": "km",
            "days_to_complete": 60,
            "goal_type": "CYCLING",
            "tips": [
                "Build endurance with longer rides each week",
                "Include hill training to increase strength",
                "Rest 1-2 days between intense sessions"
            ]
        }

        response = self.client.post(self.suggestions_url, {
            "title": "Cycle 10km",
            "description": "Regular cycling goal"
        })

        data = response.json()
        self.assertEqual(len(data['tips']), 3)

    @patch('api.separate_views.goal_suggestions.Groq')
    def test_tips_max_length_enforcement(self, mock_groq_class):
        """Test that tips longer than 200 chars are truncated"""
        long_tip = "A" * 250  # 250 characters

        # Mock the Groq client and its response
        mock_client = MagicMock()
        mock_groq_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = f'''{{
            "is_realistic": true,
            "warning_message": null,
            "target_value": 5,
            "unit": "km",
            "days_to_complete": 30,
            "goal_type": "WALKING_RUNNING",
            "tips": ["{long_tip}", "Normal tip", "Another tip"]
        }}'''

        mock_client.chat.completions.create.return_value = mock_response

        response = self.client.post(self.suggestions_url, {
            "title": "Run 5K",
            "description": "Test"
        })

        data = response.json()
        # First tip should be truncated to 200 chars (197 + "...")
        self.assertEqual(len(data['tips'][0]), 200)
        self.assertTrue(data['tips'][0].endswith("..."))


class GoalSuggestionsValidationTests(TestCase):
    """Test cases for response validation"""

    def setUp(self):
        self.user = UserWithType.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type="User",
            is_active=True
        )

        # Update profile (auto-created by signal)
        profile = self.user.profile
        profile.name = "Test"
        profile.surname = "User"
        profile.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.suggestions_url = reverse('get_goal_suggestions')

    @patch('api.separate_views.goal_suggestions.Groq')
    def test_invalid_goal_type_defaults_to_workout(self, mock_groq_class):
        """Test that invalid goal types are handled with default fallback"""
        # Mock the Groq client and its response
        mock_client = MagicMock()
        mock_groq_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '''{
            "is_realistic": true,
            "warning_message": null,
            "target_value": 10,
            "unit": "reps",
            "days_to_complete": 30,
            "goal_type": "INVALID_TYPE",
            "tips": ["Tip 1", "Tip 2", "Tip 3"]
        }'''

        mock_client.chat.completions.create.return_value = mock_response

        response = self.client.post(self.suggestions_url, {
            "title": "Test Goal",
            "description": "Test"
        })

        data = response.json()
        # Should default to WORKOUT
        self.assertEqual(data['goal_type'], 'WORKOUT')

    @patch('api.separate_views.goal_suggestions.Groq')
    def test_days_out_of_range_gets_default(self, mock_groq_class):
        """Test that days_to_complete out of range gets default value"""
        # Mock the Groq client and its response
        mock_client = MagicMock()
        mock_groq_class.return_value = mock_client

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '''{
            "is_realistic": true,
            "warning_message": null,
            "target_value": 5,
            "unit": "km",
            "days_to_complete": 10000,
            "goal_type": "WALKING_RUNNING",
            "tips": ["Tip 1", "Tip 2", "Tip 3"]
        }'''

        mock_client.chat.completions.create.return_value = mock_response

        response = self.client.post(self.suggestions_url, {
            "title": "Test Goal",
            "description": "Test"
        })

        data = response.json()
        # Should default to 30 days
        self.assertEqual(data['days_to_complete'], 30)
