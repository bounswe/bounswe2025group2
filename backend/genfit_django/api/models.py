from django.contrib.auth.models import AbstractUser
from django.db import models

class UserWithType(AbstractUser):
    email = models.EmailField(
        unique=True,
        help_text='Email address must be unique.',
    )
    user_type = models.CharField(choices=[('Coach', 'Coach'), ('User', 'User')], max_length=10)
    is_verified_coach = models.BooleanField(default=False)


class FitnessGoal(models.Model):
    GOAL_TYPES = [
        ('WALKING_RUNNING', 'Walking/Running'),
        ('WORKOUT', 'Workout'),
        ('CYCLING', 'Cycling'),
        ('SWIMMING', 'Swimming'),
        ('SPORTS', 'Sports'),
    ]

    GOAL_STATUS = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('INACTIVE', 'Inactive'),
        ('RESTARTED', 'Restarted'),
    ]

    user = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='goals')
    mentor = models.ForeignKey(UserWithType, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_goals')
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_value = models.FloatField(help_text='Target value (e.g., distance in km, duration in minutes)')
    current_value = models.FloatField(default=0.0)
    unit = models.CharField(max_length=20, help_text='Unit of measurement (e.g., km, minutes)')
    start_date = models.DateTimeField(auto_now_add=True)
    target_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=GOAL_STATUS, default='ACTIVE')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    @property
    def progress_percentage(self):
        try:
            if self.target_value > 0:
                return min(100, (self.current_value / self.target_value) * 100)
            else:
                return 0
        except:
            return 0


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
        ('GOAL_INACTIVE', 'Goal Inactive Warning'),
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


class Profile(models.Model):
    user = models.OneToOneField(UserWithType, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=50, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        default='profile_pictures/default.png'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

    @property
    def age(self):
        if self.birth_date:
            from datetime import date
            today = date.today()
            return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        return None



class Forum(models.Model):
    pass


class Thread(models.Model):
    like_count = models.IntegerField(default=0)
    pass


class Comment(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()

    like_count = models.PositiveIntegerField(default=0)
    subcomment_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Overridden in save()

    def __str__(self):
        return f'Comment by {self.author.username} on Thread {self.thread.id}'


class SubComment(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='subcomments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()

    like_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Overridden in save()

    def __str__(self):
        return f'SubComment by {self.author.username} on Comment {self.comment.id}'

class Vote(models.Model):
    pass

