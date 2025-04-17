from django.contrib.auth.models import AbstractUser
from django.db import models

class UserWithType(AbstractUser):
    email = models.EmailField(
        unique=True,
        help_text='Email address must be unique.',
    )
    user_type = models.CharField(choices=[('Coach', 'Coach'), ('User', 'User')], max_length=10)
    is_verified_coach = models.BooleanField(default=False)


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('LIKE', 'Like'),
        ('COMMENT', 'Comment'),
        ('TAG', 'Tag'),
        ('REPLY', 'Reply'),
        ('CHALLENGE', 'Challenge Invitation'),
        ('PROGRESS', 'Challenge Progress'),
        ('ACHIEVEMENT', 'Achievement'),
        ('BADGE', 'Badge'),
        ('GOAL', 'New Goal from Mentor'),
        ('FEEDBACK', 'Mentor Feedback'),
        ('SYSTEM', 'System Notification'),
        ('NEW_MESSAGE', 'New Message'),
    ]

    recipient = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(UserWithType, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

