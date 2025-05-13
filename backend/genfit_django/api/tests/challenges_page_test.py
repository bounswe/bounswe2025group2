import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from ..models import Challenge, ChallengeParticipant
from ..serializers import ChallengeSerializer
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
def create_challenge():
    def _create_challenge(creator, title="Test Challenge", challenge_type="RUNNING",
                        target_value=10.0, unit="km"):
        return Challenge.objects.create(
            creator=creator,
            title=title,
            description="Test description",
            challenge_type=challenge_type,
            target_value=target_value,
            unit=unit,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=30)
        )
    return _create_challenge

@pytest.fixture
def join_challenge():
    def _join_challenge(user, challenge, current_value=0.0):
        return ChallengeParticipant.objects.create(
            user=user,
            challenge=challenge,
            current_value=current_value,
            joined_at=datetime.now()
        )
    return _join_challenge

@pytest.mark.django_db  # Add this decorator to allow database access
class TestChallengesAPI:
    def test_search_challenges(self, api_client, create_user, create_challenge):
        """Test searching for challenges with no filters."""
        user = create_user()
        creator = create_user(username="creator")

        # Create some challenges
        challenge1 = create_challenge(creator=creator, title="Morning Run")
        challenge2 = create_challenge(creator=creator, title="Weight Lifting", challenge_type="STRENGTH", unit="kg")
        
        api_client.force_authenticate(user=user)
        url = reverse('search_challenges')
        
        response = api_client.get(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the challenges are returned
        challenges = Challenge.objects.all()
        assert len(response.data) == len(challenges)
        assert response.data[0]['title'] in ["Morning Run", "Weight Lifting"]

    def test_create_challenge(self, api_client, create_user):
        """Test creating a new challenge."""
        user = create_user()
        api_client.force_authenticate(user=user)
        
        url = reverse('challenges')
        data = {
            'title': 'New Challenge',
            'description': 'Test new challenge',
            'challenge_type': 'RUNNING',
            'target_value': 10.0,
            'unit': 'km',
            'start_date': datetime.now().isoformat(),
            'end_date': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify challenge was created
        assert Challenge.objects.filter(title='New Challenge').exists()
        challenge = Challenge.objects.get(title='New Challenge')
        assert challenge.creator == user
        assert challenge.challenge_type == 'RUNNING'

    def test_join_challenge(self, api_client, create_user, create_challenge):
        """Test joining a challenge."""
        user = create_user()
        creator = create_user(username="creator")
        challenge = create_challenge(creator=creator)
        
        api_client.force_authenticate(user=user)
        url = reverse('join_challenge', kwargs={'challenge_id': challenge.id})
        
        response = api_client.post(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify user joined the challenge
        participant = ChallengeParticipant.objects.filter(
            user=user,
            challenge=challenge
        ).first()
        
        assert participant is not None
        assert participant.current_value == 0.0

    def test_update_challenge_progress(self, api_client, create_user, create_challenge, join_challenge):
        """Test updating progress in a challenge."""
        user = create_user()
        creator = create_user(username="creator")
        challenge = create_challenge(creator=creator)
        participant = join_challenge(user=user, challenge=challenge, current_value=2.0)
        
        api_client.force_authenticate(user=user)
        url = reverse('update_challenge_progress', kwargs={'challenge_id': challenge.id})
        data = {'added_value': 3.0}
        
        response = api_client.post(url, data, format='json')
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify progress was updated
        participant.refresh_from_db()
        assert participant.current_value == 5.0  # 2.0 + 3.0

    def test_challenge_leaderboard(self, api_client, create_user, create_challenge, join_challenge):
        """Test retrieving the challenge leaderboard."""
        user1 = create_user(username="user1")
        user2 = create_user(username="user2")
        user3 = create_user(username="user3")
        creator = create_user(username="creator")
        
        challenge = create_challenge(creator=creator)
        participant1 = join_challenge(user=user1, challenge=challenge, current_value=5.0)
        participant2 = join_challenge(user=user2, challenge=challenge, current_value=8.0)
        participant3 = join_challenge(user=user3, challenge=challenge, current_value=3.0)
        
        api_client.force_authenticate(user=user1)
        url = reverse('challenge_leaderboard', kwargs={'challenge_id': challenge.id})
        
        response = api_client.get(url)
        
        # Check response
        assert response.status_code == status.HTTP_200_OK
        
        # Verify leaderboard ordering (by default, ordered by progress descending)
        assert len(response.data) == 3
        # First should be user2 with highest progress
        assert response.data[0]['user'] == user2.id
        assert response.data[0]['current_value'] == 8.0
        
        # Test custom ordering
        url = f"{url}?progress=-"  # Reverse progress order
        response = api_client.get(url)
        
        # Now user3 with lowest progress should be first
        assert response.data[0]['user'] == user3.id
        assert response.data[0]['current_value'] == 3.0

    def test_search_challenges_with_filters(self, api_client, create_user, create_challenge, join_challenge):
        """Test searching challenges with filters."""
        user = create_user()
        creator = create_user(username="creator")
        
        # Create active and inactive challenges
        active_challenge = create_challenge(creator=creator, title="Active Challenge")
        
        # Create an inactive challenge by setting end_date in the past
        inactive_challenge = Challenge.objects.create(
            creator=creator,
            title="Inactive Challenge",
            description="Ended challenge",
            challenge_type="RUNNING",
            target_value=5.0,
            unit="km",
            start_date=datetime.now() - timedelta(days=60),
            end_date=datetime.now() - timedelta(days=30)
        )
        
        # Join the active challenge
        join_challenge(user=user, challenge=active_challenge)
        
        api_client.force_authenticate(user=user)
        
        # Test filter by active status
        url = reverse('search_challenges')
        params = {'is_active': 'true'}
        
        response = api_client.get(url, params)
        
        # Check only active challenges are returned
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == "Active Challenge"
        
        # Test filter by user participation
        params = {'user_participating': 'true'}
        response = api_client.get(url, params)
        
        # Check only challenges the user is participating in are returned
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == "Active Challenge"