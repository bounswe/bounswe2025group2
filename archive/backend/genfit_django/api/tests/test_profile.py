from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from api.models import Profile
from datetime import date

User = get_user_model()

class ProfileTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create a test user
        self.test_user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            user_type='User'
        )
        self.test_user.is_active = True
        self.test_user.save()
        
        # Get the automatically created profile instead of creating a new one
        self.test_profile = Profile.objects.get(user=self.test_user)
        
        self.profile_url = reverse('profile-detail')
        
        # Test profile data
        self.profile_data = {
            'name': 'Test',
            'surname': 'User',
            'bio': 'Test bio',
            'location': 'Test City',
            'birth_date': '1990-01-01'
        }

    def test_get_profile(self):
        """Test retrieving a user's profile"""
        # Login the user first
        self.client.login(username='testuser', password='testpass123')
        
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_update_profile(self):
        """Test updating a user's profile"""
        # Login the user
        self.client.login(username='testuser', password='testpass123')
        
        response = self.client.put(
            self.profile_url,
            self.profile_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test')
        self.assertEqual(response.data['surname'], 'User')
        self.assertEqual(response.data['bio'], 'Test bio')
        self.assertEqual(response.data['location'], 'Test City')
        
        # Verify the changes in database
        updated_profile = Profile.objects.get(user=self.test_user)
        self.assertEqual(updated_profile.name, 'Test')
        self.assertEqual(updated_profile.surname, 'User')

    def test_profile_age_calculation(self):
        """Test the age calculation property of the profile"""
        # Login the user first
        self.client.login(username='testuser', password='testpass123')
        
        self.test_profile.birth_date = date(1990, 1, 1)
        self.test_profile.save()
        
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Age should be calculated based on the birth date
        self.assertIn('age', response.data)
        # Note: This test might need adjustment based on the current year

    def test_update_profile_invalid_data(self):
        """Test updating profile with invalid data"""
        self.client.login(username='testuser', password='testpass123')
        
        invalid_data = {
            'birth_date': 'invalid-date'
        }
        
        response = self.client.put(
            self.profile_url,
            invalid_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_created_with_user(self):
        """Test that a profile is automatically created when a user is created"""
        new_user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='newpass123',
            user_type='User'
        )
        
        self.assertTrue(Profile.objects.filter(user=new_user).exists())