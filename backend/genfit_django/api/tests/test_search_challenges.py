import datetime
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from api.models import UserWithType, Challenge, ChallengeParticipant


class SearchChallengesAPITest(APITestCase):
    """Unit + light integration tests for `search_challenges` view."""

    def setUp(self):
        # Common timestamps
        self.now = timezone.now()
        self.past = self.now - datetime.timedelta(days=10)
        self.future = self.now + datetime.timedelta(days=10)

        # Users
        self.coach = UserWithType.objects.create_user(
            username="coach", email="coach@example.com", password="coachpass", user_type="Coach"
        )
        self.user = UserWithType.objects.create_user(
            username="runner", email="runner@example.com", password="userpass", user_type="User"
        )

        # Challenges
        self.active_challenge = Challenge.objects.create(
            coach=self.coach,
            title="10 K Challenge",
            description="Run 10 km every day.",
            challenge_type="distance",
            target_value=300,
            unit="km",
            start_date=self.now - datetime.timedelta(days=1),
            end_date=self.now + datetime.timedelta(days=1),
            min_age=18,
            max_age=60,
            latitude=41.0,
            longitude=29.0,
        )

        self.past_challenge = Challenge.objects.create(
            coach=self.coach,
            title="Past Challenge",
            description="Ended",
            challenge_type="steps",
            target_value=10000,
            unit="steps",
            start_date=self.past - datetime.timedelta(days=5),
            end_date=self.past,
            latitude=41.0,
            longitude=29.0,
        )

        # Participation
        ChallengeParticipant.objects.create(challenge=self.active_challenge, user=self.user)

        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.url = reverse("search-challenges")

    # ---------- Helper ---------- #
    def _get(self, **params):
        return self.client.get(self.url, params)

    # ---------- Tests ---------- #
    def test_requires_authentication(self):
        anon = APIClient()
        response = anon.get(self.url)
        self.assertIn(response.status_code, 
                     [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_filter_active_true_returns_only_current(self):
        response = self._get(is_active="true")
        ids = {c["id"] for c in response.data}
        self.assertIn(self.active_challenge.id, ids)
        self.assertNotIn(self.past_challenge.id, ids)

    def test_filter_active_false_returns_past_and_future(self):
        response = self._get(is_active="false")
        ids = {c["id"] for c in response.data}
        self.assertIn(self.past_challenge.id, ids)
        self.assertNotIn(self.active_challenge.id, ids)

    def test_filter_user_participating_true(self):
        response = self._get(user_participating="true")
        ids = {c["id"] for c in response.data}
        self.assertEqual(ids, {self.active_challenge.id})

    def test_filter_user_participating_false(self):
        response = self._get(user_participating="false")
        ids = {c["id"] for c in response.data}
        self.assertNotIn(self.active_challenge.id, ids)

    def test_age_range_filter(self):
        # create age‑restricted challenge that should survive the filter
        age_ok = Challenge.objects.create(
            coach=self.coach,
            title="Age OK",
            description="",
            challenge_type="distance",
            target_value=1,
            unit="km",
            start_date=self.now - datetime.timedelta(days=1),
            end_date=self.now + datetime.timedelta(days=1),
            min_age=20,
            max_age=25,
            latitude=41.0,
            longitude=29.0,
        )
        response = self._get(min_age=20, max_age=25)
        ids = {c["id"] for c in response.data}
        self.assertIn(age_ok.id, ids)
        self.assertNotIn(self.active_challenge.id, ids)

    @patch("api.utils.geocode_location", return_value=(41.0, 29.0))
    def test_location_radius_filter(self, mocked_geo):
        # distance 0 → active_challenge should match
        response = self._get(location="Kadıköy", radius_km=5)
        ids = {c["id"] for c in response.data}
        self.assertIn(self.active_challenge.id, ids)
        # Move a far‑away challenge
        far = Challenge.objects.create(
            coach=self.coach,
            title="Far Away",
            description="",
            challenge_type="distance",
            target_value=1,
            unit="km",
            start_date=self.now - datetime.timedelta(days=1),
            end_date=self.now + datetime.timedelta(days=1),
            latitude=20.0,
            longitude=20.0,
        )
        response = self._get(location="Kadıköy", radius_km=5)
        ids = {c["id"] for c in response.data}
        self.assertNotIn(far.id, ids)

    def test_invalid_radius_returns_400(self):
        response = self._get(location="Kadıköy", radius_km="abc")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

