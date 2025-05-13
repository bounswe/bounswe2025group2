from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Vote, Notification, Thread, Comment, Subcomment

@receiver(post_save, sender=Vote)
def create_vote_notification(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a user upvotes a thread, comment, or subcomment.
    Only creates notifications for UPVOTE type votes, not DOWNVOTE.
    """
    # Only proceed if this is an upvote
    if instance.vote_type != 'UPVOTE':
        return
    
    # Get the content object that was voted on
    content_object = instance.content_object
    
    # Don't create notification if user is voting on their own content
    if content_object.author == instance.user:
        return
    
    # Determine content type and set appropriate notification parameters
    content_type = instance.content_type
    
    # Get model class from content type
    model_class = content_type.model_class()
    
    # Set notification parameters based on content type
    if model_class == Thread:
        title = "New upvote on your thread"
        message = f"{instance.user.username} upvoted your thread: {content_object.title}"
        related_object_type = 'Thread'
    elif model_class == Comment:
        title = "New upvote on your comment"
        message = f"{instance.user.username} upvoted your comment on thread: {content_object.thread.title}"
        related_object_type = 'Comment'
    elif model_class == Subcomment:
        title = "New upvote on your reply"
        message = f"{instance.user.username} upvoted your reply to a comment"
        related_object_type = 'Subcomment'
    else:
        # Not a content type we want to notify about
        return
    
    # Create the notification
    Notification.objects.create(
        recipient=content_object.author,
        sender=instance.user,
        notification_type='LIKE',
        title=title,
        message=message,
        related_object_id=content_object.id,
        related_object_type=related_object_type
    )