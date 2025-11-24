from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Forum, Thread

User = get_user_model()

class ForumAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
            user_type='User'
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='password123',
            user_type='User'
        )
        self.forum_data = {
            'title': 'Test Forum',
            'description': 'This is a test forum'
        }
        self.forum = Forum.objects.create(
            title='Existing Forum',
            description='Existing description',
            created_by=self.admin_user
        )

    def test_create_forum_admin(self):
        """Ensure admin can create a forum"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('forum-list')
        response = self.client.post(url, self.forum_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Forum.objects.count(), 2)
        self.assertEqual(Forum.objects.get(id=response.data['id']).title, 'Test Forum')

    def test_create_forum_regular_user(self):
        """Ensure regular user cannot create a forum"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('forum-list')
        response = self.client.post(url, self.forum_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_forum_unauthenticated(self):
        """Ensure unauthenticated user cannot create a forum"""
        url = reverse('forum-list')
        response = self.client.post(url, self.forum_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_forums(self):
        """Ensure anyone can list forums"""
        url = reverse('forum-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_retrieve_forum(self):
        """Ensure anyone can retrieve a specific forum"""
        url = reverse('forum-detail', args=[self.forum.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.forum.title)

    def test_update_forum_admin(self):
        """Ensure admin can update a forum"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('forum-detail', args=[self.forum.id])
        updated_data = {'title': 'Updated Forum Title', 'description': 'Updated description'}
        response = self.client.put(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.forum.refresh_from_db()
        self.assertEqual(self.forum.title, 'Updated Forum Title')

    def test_update_forum_regular_user(self):
        """Ensure regular user cannot update a forum"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('forum-detail', args=[self.forum.id])
        updated_data = {'title': 'Updated Forum Title'}
        response = self.client.put(url, updated_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_forum_admin(self):
        """Ensure admin can delete a forum"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('forum-detail', args=[self.forum.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Forum.objects.count(), 0)

    def test_delete_forum_regular_user(self):
        """Ensure regular user cannot delete a forum"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('forum-detail', args=[self.forum.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_thread_count(self):
        """Test that thread_count property is correct"""
        Thread.objects.create(
            forum=self.forum,
            title='Thread 1',
            content='Content 1',
            author=self.regular_user
        )
        Thread.objects.create(
            forum=self.forum,
            title='Thread 2',
            content='Content 2',
            author=self.regular_user
        )
        
        url = reverse('forum-detail', args=[self.forum.id])
        response = self.client.get(url)
        self.assertEqual(response.data['thread_count'], 2)
