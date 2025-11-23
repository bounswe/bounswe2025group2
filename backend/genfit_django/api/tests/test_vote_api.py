from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Forum, Thread, Comment, Subcomment, Vote

User = get_user_model()

class VoteAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123',
            user_type='User'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
            user_type='User'
        )
        self.forum = Forum.objects.create(
            title='Test Forum',
            description='Test Description',
            created_by=self.admin_user
        )
        self.thread = Thread.objects.create(
            forum=self.forum,
            title='Test Thread',
            content='Test Content',
            author=self.user
        )
        self.comment = Comment.objects.create(
            thread=self.thread,
            author=self.user,
            content='Test Comment'
        )
        self.subcomment = Subcomment.objects.create(
            comment=self.comment,
            author=self.user,
            content='Test Subcomment'
        )

    def test_upvote_thread(self):
        """Ensure user can upvote a thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_vote')
        data = {
            'content_type': 'THREAD',
            'object_id': self.thread.id,
            'vote_type': 'UPVOTE'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 1)
        self.assertTrue(Vote.objects.filter(user=self.user, object_id=self.thread.id, vote_type='UPVOTE').exists())

    def test_downvote_thread(self):
        """Ensure user can downvote a thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_vote')
        data = {
            'content_type': 'THREAD',
            'object_id': self.thread.id,
            'vote_type': 'DOWNVOTE'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 0) # Downvote doesn't increment like_count
        self.assertTrue(Vote.objects.filter(user=self.user, object_id=self.thread.id, vote_type='DOWNVOTE').exists())

    def test_change_vote(self):
        """Ensure changing vote updates like_count correctly"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_vote')
        
        # First Upvote
        data = {'content_type': 'THREAD', 'object_id': self.thread.id, 'vote_type': 'UPVOTE'}
        self.client.post(url, data)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 1)
        
        # Change to Downvote
        data['vote_type'] = 'DOWNVOTE'
        self.client.post(url, data)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 0)
        
        # Change back to Upvote
        data['vote_type'] = 'UPVOTE'
        self.client.post(url, data)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 1)

    def test_delete_vote(self):
        """Ensure deleting vote updates like_count"""
        self.client.force_authenticate(user=self.user)
        
        # Create vote first
        Vote.create_or_update_vote(self.user, self.thread, 'UPVOTE')
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 1)
        
        url = reverse('delete_vote', args=['THREAD', self.thread.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.like_count, 0)

    def test_vote_comment(self):
        """Ensure user can vote on comment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_vote')
        data = {
            'content_type': 'COMMENT',
            'object_id': self.comment.id,
            'vote_type': 'UPVOTE'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.like_count, 1)

    def test_vote_subcomment(self):
        """Ensure user can vote on subcomment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('create_vote')
        data = {
            'content_type': 'SUBCOMMENT',
            'object_id': self.subcomment.id,
            'vote_type': 'UPVOTE'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.subcomment.refresh_from_db()
        self.assertEqual(self.subcomment.like_count, 1)
