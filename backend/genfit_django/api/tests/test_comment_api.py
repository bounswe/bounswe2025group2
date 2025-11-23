from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from ..models import Forum, Thread, Comment, Subcomment

User = get_user_model()

class CommentAPITests(APITestCase):
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

    def test_add_comment(self):
        """Ensure authenticated user can add a comment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('add_comment', args=[self.thread.id])
        data = {'content': 'New Comment'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 2)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.comment_count, 1) # Initial comment was created manually, but comment_count defaults to 0 and is not auto-updated on create unless via signal or view. The view updates it.
        # Wait, the initial comment was created via ORM, so comment_count is 0.
        # The new comment via API increments it. So it should be 1.
        # Actually, let's check if there are signals updating comment_count.
        # Looking at models.py, there are no signals for comment_count.
        # So manual creation leaves it at 0. API creation adds 1. So total 1.
        
    def test_update_comment_author(self):
        """Ensure author can update their comment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('update_comment', args=[self.comment.id])
        data = {'content': 'Updated Comment'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.content, 'Updated Comment')

    def test_update_comment_other_user(self):
        """Ensure other user cannot update comment"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('update_comment', args=[self.comment.id])
        data = {'content': 'Updated Comment'}
        response = self.client.put(url, data)
        # This is expected to fail before the fix
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_comment_author(self):
        """Ensure author can delete their comment"""
        self.client.force_authenticate(user=self.user)
        # Manually set comment_count to 1 since we have one comment
        self.thread.comment_count = 1
        self.thread.save()
        
        url = reverse('delete_comment', args=[self.comment.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Comment.objects.count(), 0)
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.comment_count, 0)

    def test_delete_comment_other_user(self):
        """Ensure other user cannot delete comment"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('delete_comment', args=[self.comment.id])
        response = self.client.delete(url)
        # This is expected to fail before the fix
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_subcomment(self):
        """Ensure authenticated user can add a subcomment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('add_subcomment', args=[self.comment.id])
        data = {'content': 'New Subcomment'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Subcomment.objects.count(), 2)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.subcomment_count, 1)

    def test_update_subcomment_author(self):
        """Ensure author can update their subcomment"""
        self.client.force_authenticate(user=self.user)
        url = reverse('update_subcomment', args=[self.subcomment.id])
        data = {'content': 'Updated Subcomment'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.subcomment.refresh_from_db()
        self.assertEqual(self.subcomment.content, 'Updated Subcomment')

    def test_update_subcomment_other_user(self):
        """Ensure other user cannot update subcomment"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('update_subcomment', args=[self.subcomment.id])
        data = {'content': 'Updated Subcomment'}
        response = self.client.put(url, data)
        # This is expected to fail before the fix
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_subcomment_author(self):
        """Ensure author can delete their subcomment"""
        self.client.force_authenticate(user=self.user)
        self.comment.subcomment_count = 1
        self.comment.save()
        
        url = reverse('delete_subcomment', args=[self.subcomment.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Subcomment.objects.count(), 0)
        self.comment.refresh_from_db()
        self.assertEqual(self.comment.subcomment_count, 0)

    def test_delete_subcomment_other_user(self):
        """Ensure other user cannot delete subcomment"""
        self.client.force_authenticate(user=self.other_user)
        url = reverse('delete_subcomment', args=[self.subcomment.id])
        response = self.client.delete(url)
        # This is expected to fail before the fix
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
