from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation


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
    mentor = models.ForeignKey(UserWithType, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='assigned_goals')
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
    sender = models.ForeignKey(UserWithType, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='sent_notifications')
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
    name = models.CharField(max_length=50, blank=True)
    surname = models.CharField(max_length=50, blank=True)
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
            return today.year - self.birth_date.year - (
                        (today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        return None


class Forum(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(UserWithType, on_delete=models.SET_NULL, null=True, related_name='created_forums')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text='Order in which forums should be displayed')

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return self.title

    @property
    def thread_count(self):
        return self.threads.count()


class Thread(models.Model):
    forum = models.ForeignKey(Forum, on_delete=models.CASCADE, related_name='threads')
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)

    votes = GenericRelation('Vote')

    class Meta:
        ordering = ['-is_pinned', '-last_activity']

    def __str__(self):
        return self.title


class Comment(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(UserWithType, on_delete=models.CASCADE)
    content = models.TextField()

    like_count = models.PositiveIntegerField(default=0)
    votes = GenericRelation('Vote')

    subcomment_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)  # Overridden in save()

    def __str__(self):
        return f'Comment by {self.author.username} on Thread {self.thread.id}'


class Subcomment(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='subcomments')
    author = models.ForeignKey(UserWithType, on_delete=models.CASCADE)
    content = models.TextField()

    like_count = models.PositiveIntegerField(default=0)
    votes = GenericRelation('Vote')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Subcomment by {self.author.username} on Comment {self.comment.id}'


class Vote(models.Model):
    VOTE_TYPES = [
        ('UPVOTE', 'Upvote'),
        ('DOWNVOTE', 'Downvote')
    ]

    user = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='votes')

    # Generic relation fields
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    vote_type = models.CharField(max_length=10, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

    @classmethod
    def create_or_update_vote(cls, user, content_object, new_vote_type):
        content_type = ContentType.objects.get_for_model(content_object)

        vote, created = cls.objects.get_or_create(
            user=user,
            content_type=content_type,
            object_id=content_object.id,
            defaults={'vote_type': new_vote_type}
        )

        if not created:
            # If changing from UPVOTE to something else, decrement like count
            if vote.vote_type == 'UPVOTE' and new_vote_type != 'UPVOTE':
                content_object.like_count -= 1
                content_object.save()
            # If changing to UPVOTE from something else, increment like count
            elif vote.vote_type != 'UPVOTE' and new_vote_type == 'UPVOTE':
                content_object.like_count += 1
                content_object.save()

            vote.vote_type = new_vote_type
            vote.save()

        return vote

    def update_content_like_count(self, increment=True):
        content_object = self.content_object
        if hasattr(content_object, 'like_count'):
            if increment:
                content_object.like_count += 1
            else:
                content_object.like_count -= 1
            content_object.save()

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.update_content_like_count(increment=True)

    def delete(self, *args, **kwargs):
        self.update_content_like_count(increment=False)
        super().delete(*args, **kwargs)

class AiTutorChat(models.Model):
    user = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='ai_chats')
    chat_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat {self.chat_id} for {self.user.username}"

class AiTutorResponse(models.Model):
    chat = models.ForeignKey(AiTutorChat, on_delete=models.CASCADE, related_name='responses')
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Response for Chat {self.chat.chat_id}"

class UserAiMessage(models.Model):
    user = models.ForeignKey(UserWithType, on_delete=models.CASCADE, related_name='ai_messages')
    chat = models.ForeignKey(AiTutorChat, on_delete=models.CASCADE, related_name='user_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Message from {self.user.username} in Chat {self.chat.chat_id}"