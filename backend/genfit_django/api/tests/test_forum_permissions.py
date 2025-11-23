from django.test import TestCase
from rest_framework.test import APIRequestFactory
from ..permissions import IsAuthorOrReadOnly
from ..models import Thread, Forum
from django.contrib.auth import get_user_model
from unittest.mock import Mock

User = get_user_model()

class ForumPermissionsTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.permission = IsAuthorOrReadOnly()
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
            created_by=self.admin_user
        )
        self.thread = Thread.objects.create(
            forum=self.forum,
            title='Test Thread',
            content='Content',
            author=self.user
        )

    def test_read_access_allowed(self):
        """Ensure read access is allowed for anyone"""
        request = self.factory.get('/')
        request.user = self.other_user
        self.assertTrue(self.permission.has_object_permission(request, None, self.thread))

    def test_write_access_author(self):
        """Ensure write access is allowed for author"""
        request = self.factory.put('/')
        request.user = self.user
        self.assertTrue(self.permission.has_object_permission(request, None, self.thread))

    def test_write_access_other_user(self):
        """Ensure write access is denied for other user"""
        request = self.factory.put('/')
        request.user = self.other_user
        self.assertFalse(self.permission.has_object_permission(request, None, self.thread))

    def test_delete_access_author(self):
        """Ensure delete access is allowed for author"""
        request = self.factory.delete('/')
        request.user = self.user
        self.assertTrue(self.permission.has_object_permission(request, None, self.thread))

    def test_delete_access_other_user(self):
        """Ensure delete access is denied for other user"""
        request = self.factory.delete('/')
        request.user = self.other_user
        self.assertFalse(self.permission.has_object_permission(request, None, self.thread))
