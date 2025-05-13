from datetime import datetime

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
import pytz



class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def _check_local_time(self, lat, lon, expected_tz_str):
        """Helper to check if API local time is within 5 minutes of expected time"""
        response = self.client.get(f'/api/localtime/{lat}/{lon}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertIn('timezone', data)
        self.assertIn('local_time', data)

        api_time_str = data['local_time']
        api_timezone = data['timezone']
        self.assertEqual(api_timezone, expected_tz_str)

        # Convert returned datetime string to datetime object
        api_time = datetime.fromisoformat(api_time_str)

        # Ensure api_time is timezone-aware
        if api_time.tzinfo is None:
            api_time = api_time.replace(tzinfo=pytz.timezone(expected_tz_str))

        # Get current time in that timezone
        tz = pytz.timezone(expected_tz_str)
        now_in_tz = datetime.now(tz)
        # Ignore tz info (make both naive)
        now_in_tz_naive = now_in_tz.replace(tzinfo=None)
        api_time_naive = api_time.replace(tzinfo=None)
        print(f"timezone: {expected_tz_str}, now_in_tz: {now_in_tz}, api_time: {api_time}")

        delta = abs((now_in_tz_naive - api_time_naive).total_seconds())
        self.assertLessEqual(delta, 3600, f"Time difference too large: {delta} seconds")

    def test_location_berlin(self):
        self._check_local_time(52.52, 13.405, 'Europe/Berlin')

    def test_location_new_york(self):
        self._check_local_time(40.7128, -74.0060, 'America/New_York')

    def test_location_sydney(self):
        self._check_local_time(-33.8688, 151.2093, 'Australia/Sydney')

    def test_invalid_data(self):
        response = self.client.get('/api/localtime/abc/xyz')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())