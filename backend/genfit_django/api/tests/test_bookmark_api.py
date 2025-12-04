from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Forum, Thread, ThreadBookmark

User = get_user_model()

class BookmarkAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123',
            user_type='User'
        )
        self.other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='password123',
            user_type='User'
        )
        self.forum = Forum.objects.create(
            title='Test Forum',
            description='Test Description',
            created_by=self.user
        )
        self.thread = Thread.objects.create(
            forum=self.forum,
            title='Test Thread',
            content='Test Content',
            author=self.other_user
        )

    def test_bookmark_thread(self):
        """Ensure user can bookmark a thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-bookmark', args=[self.thread.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'bookmarked')
        self.assertTrue(ThreadBookmark.objects.filter(user=self.user, thread=self.thread).exists())

    def test_unbookmark_thread(self):
        """Ensure user can unbookmark a thread"""
        self.client.force_authenticate(user=self.user)
        ThreadBookmark.objects.create(user=self.user, thread=self.thread)
        
        url = reverse('thread-bookmark', args=[self.thread.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unbookmarked')
        self.assertFalse(ThreadBookmark.objects.filter(user=self.user, thread=self.thread).exists())

    def test_list_bookmarked_threads(self):
        """Ensure user can list bookmarked threads"""
        self.client.force_authenticate(user=self.user)
        ThreadBookmark.objects.create(user=self.user, thread=self.thread)
        
        url = reverse('thread-bookmarked')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.thread.id)

    def test_list_bookmarked_threads_empty(self):
        """Ensure list is empty if no bookmarks"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-bookmarked')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_bookmark_unauthenticated(self):
        """Ensure unauthenticated user cannot bookmark"""
        url = reverse('thread-bookmark', args=[self.thread.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
