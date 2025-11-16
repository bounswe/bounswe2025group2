from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from ..models import (
    UserWithType, Forum, Thread, Comment, Subcomment, Notification
)

class NotificationSignalTests(TestCase):
    def setUp(self):
        # create users
        self.owner = UserWithType.objects.create_user(
            username='owner', email='owner@example.com', password='pass', user_type='User'
        )
        self.commenter = UserWithType.objects.create_user(
            username='commenter', email='commenter@example.com', password='pass', user_type='User'
        )
        self.replier = UserWithType.objects.create_user(
            username='replier', email='replier@example.com', password='pass', user_type='User'
        )

        # create a forum and a thread
        self.forum = Forum.objects.create(
            title='Test Forum',
            description='',
            created_by=self.owner,
        )
        self.thread = Thread.objects.create(
            forum=self.forum,
            title='Test Thread',
            content='Thread content',
            author=self.owner,
        )

    def test_comment_triggers_notification_to_thread_owner(self):
        Notification.objects.all().delete()
        # when commenter adds a comment
        Comment.objects.create(
            thread=self.thread,
            author=self.commenter,
            content='Nice thread!'
        )
        notif = Notification.objects.last()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.recipient, self.owner)
        self.assertEqual(notif.sender, self.commenter)
        self.assertEqual(notif.notification_type, 'COMMENT')
        self.assertIn('commented on your thread', notif.message)

    def test_no_notification_for_self_comment(self):
        Notification.objects.all().delete()
        # owner comments on their own thread
        Comment.objects.create(
            thread=self.thread,
            author=self.owner,
            content='My own comment'
        )
        self.assertFalse(Notification.objects.exists())

    def test_subcomment_triggers_notification_to_comment_author(self):

        # first, create a comment by commenter
        comment = Comment.objects.create(
            thread=self.thread,
            author=self.commenter,
            content='Initial comment.'
        )
        Notification.objects.all().delete()
        # then replier replies
        Subcomment.objects.create(
            comment=comment,
            author=self.replier,
            content='Replying to you.'
        )
        notif = Notification.objects.last()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.recipient, self.commenter)
        self.assertEqual(notif.sender, self.replier)
        self.assertEqual(notif.notification_type, 'REPLY')
        self.assertIn('replied to your comment', notif.message)

    def test_no_notification_for_self_subcomment(self):
        # commenter replies to their own comment
        comment = Comment.objects.create(
            thread=self.thread,
            author=self.commenter,
            content='Another comment.'
        )
        Notification.objects.all().delete()
        Subcomment.objects.create(
            comment=comment,
            author=self.commenter,
            content='Replying to myself.'
        )
        self.assertFalse(Notification.objects.exists())




