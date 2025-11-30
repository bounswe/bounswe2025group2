from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Forum, Thread

User = get_user_model()

class ThreadAPITests(APITestCase):
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
        self.thread_data = {
            'title': 'New Thread',
            'content': 'New Content',
            'forum': self.forum.id
        }

    def test_create_thread_authenticated(self):
        """Ensure authenticated user can create a thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-list')
        response = self.client.post(url, self.thread_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Thread.objects.count(), 2)
        self.assertEqual(Thread.objects.last().author, self.user)

    def test_create_thread_unauthenticated(self):
        """Ensure unauthenticated user cannot create a thread"""
        url = reverse('thread-list')
        response = self.client.post(url, self.thread_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_threads(self):
        """Ensure threads can be listed"""
        url = reverse('thread-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_retrieve_thread_increments_view_count(self):
        """Ensure retrieving a thread increments view_count"""
        url = reverse('thread-detail', args=[self.thread.id])
        initial_views = self.thread.view_count
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.view_count, initial_views + 1)

    def test_update_thread_author(self):
        """Ensure author can update their thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-detail', args=[self.thread.id])
        updated_data = {'title': 'Updated Title', 'content': 'Updated Content', 'forum': self.forum.id}
        response = self.client.put(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.title, 'Updated Title')

    def test_partial_update_thread_author(self):
        """Ensure author can partially update their thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-detail', args=[self.thread.id])
        updated_data = {'title': 'Partially Updated Title'}
        response = self.client.patch(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.title, 'Partially Updated Title')
        self.assertEqual(self.thread.content, 'Test Content')

    def test_update_thread_other_user(self):
        """Ensure other user cannot update thread"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('thread-detail', args=[self.thread.id])
        updated_data = {'title': 'Updated Title', 'content': 'Updated Content', 'forum': self.forum.id}
        response = self.client.put(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_thread_author(self):
        """Ensure author can delete their thread"""
        self.client.force_authenticate(user=self.user)
        url = reverse('thread-detail', args=[self.thread.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Thread.objects.count(), 0)

    def test_delete_thread_other_user(self):
        """Ensure other user cannot delete thread"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('thread-detail', args=[self.thread.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
