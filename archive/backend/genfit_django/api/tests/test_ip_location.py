from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from api.models import UserWithType
from unittest.mock import patch, MagicMock


class IPLocationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserWithType.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('get_location_from_ip')

    @patch('requests.get')
    def test_get_location_from_ip_success(self, mock_get):
        # Mock the response from ip-api.com
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'regionName': 'California',
            # Other fields that are now ignored by our implementation
            'country': 'United States',
            'countryCode': 'US',
            'region': 'CA',
            'city': 'San Francisco',
            'query': '192.168.1.1'
        }
        mock_get.return_value = mock_response

        # Test with a specific IP
        response = self.client.get(f"{self.url}?ip=192.168.1.1")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Now we only check for region
        self.assertEqual(data['region'], 'California')

        # Test the client's IP detection (uses REMOTE_ADDR in the view)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['region'], 'California')

    @patch('requests.get')
    def test_get_location_from_ip_failure(self, mock_get):
        # Mock a failed response from ip-api.com
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'fail',
            'message': 'invalid IP address'
        }
        mock_get.return_value = mock_response

        response = self.client.get(f"{self.url}?ip=invalid_ip")
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data['error'], 'Could not get location data')

    def test_authentication_required(self):
        # Create a new client without authentication
        client = APIClient()
        response = client.get(self.url)
        self.assertEqual(response.status_code, 403)  # Forbidden, not Unauthorized 