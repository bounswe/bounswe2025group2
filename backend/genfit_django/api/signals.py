from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Vote, Notification, Thread, Comment, Subcomment, FitnessGoal, Challenge
from chat.models import DirectMessage
from django.utils import timezone

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


@receiver(post_save, sender=Comment)
def notify_thread_author_on_new_comment(sender, instance, created, **kwargs):
    if not created:
        return

    thread = instance.thread
    commenter = instance.author
    thread_author = thread.author

    # Don't notify if user commented on their own thread
    if commenter == thread_author:
        return

    Notification.objects.create(
        recipient=thread_author,
        sender=commenter,
        notification_type='COMMENT',
        title="New comment on your thread",
        message=f"{commenter.username} commented on your thread: {thread.title}",
        related_object_id=thread.id,
        related_object_type='Thread'
    )





@receiver(post_save, sender=Subcomment)
def notify_comment_author_on_new_subcomment(sender, instance, created, **kwargs):
    if not created:
        return

    comment = instance.comment
    subcommenter = instance.author
    comment_author = comment.author

    # Don't notify if user replied to their own comment
    if subcommenter == comment_author:
        return

    Notification.objects.create(
        recipient=comment_author,
        sender=subcommenter,
        notification_type='REPLY',
        title="New reply to your comment",
        message=f"{subcommenter.username} replied to your comment on thread: {comment.thread.title}",
        related_object_id=comment.id,
        related_object_type='Comment'
    )

@receiver(post_save, sender=DirectMessage)
def notify_direct_message_recipient(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a user receives a new direct message.
    """
    if not created:
        return

    # Get all participants except the sender
    recipients = instance.chat.participants.exclude(id=instance.sender.id)

    for recipient in recipients:
        # Create notification for each recipient
        Notification.objects.create(
            recipient=recipient,
            sender=instance.sender,
            notification_type='NEW_MESSAGE',
            title="New Direct Message",
            message=f"{instance.sender.username} sent you a message",
            related_object_id=instance.chat.id,
            related_object_type='DirectChat'
        )


@receiver(post_save, sender=FitnessGoal)
def notify_goal_deadline(sender, instance, **kwargs):
    """
    Signal handler to create notifications when a goal's target date is reached but goal is not completed.
    """
    now = timezone.now()
    
    # Check if target date has been reached and goal is not completed
    if instance.target_date <= now and instance.status == 'ACTIVE':
        # Create notification for the goal owner
        Notification.objects.create(
            recipient=instance.user,
            notification_type='GOAL_INACTIVE',
            title="Goal Target Date Reached",
            message=f"Your goal '{instance.title}' has reached its target date but is not completed yet.",
            related_object_id=instance.id,
            related_object_type='FitnessGoal'
        )
        
        # If there's a mentor assigned, notify them as well
        if instance.mentor:
            Notification.objects.create(
                recipient=instance.mentor,
                sender=instance.user,
                notification_type='GOAL_INACTIVE',
                title="Mentee Goal Target Date Reached",
                message=f"Your mentee's goal '{instance.title}' has reached its target date but is not completed yet.",
                related_object_id=instance.id,
                related_object_type='FitnessGoal'
            )


@receiver(post_save, sender=FitnessGoal)
def notify_mentee_new_goal(sender, instance, created, **kwargs):
    """
    Signal handler to create notifications when a mentor assigns a new goal to their mentee.
    """
    if not created:
        return
        
    # Only create notification if the goal was assigned by a mentor
    if instance.mentor and instance.user != instance.mentor:
        Notification.objects.create(
            recipient=instance.user,  # the mentee
            sender=instance.mentor,   # the mentor
            notification_type='GOAL',
            title="New Goal Assigned",
            message=f"Your mentor {instance.mentor.username} has assigned you a new goal: {instance.title}",
            related_object_id=instance.id,
            related_object_type='FitnessGoal'
        )


@receiver(post_save, sender=Challenge)
def notify_challenge_deadline(sender, instance, **kwargs):
    """
    Signal handler to create notifications when a challenge's end date is reached.
    """
    now = timezone.now()
    
    # Check if end date has been reached and challenge is still active
    if instance.end_date <= now and instance.is_active():
        # Get all participants
        participants = instance.participants.all()
        
        # Create notification for each participant
        for participant in participants.select_related('user'):
            Notification.objects.create(
                recipient=participant.user,
                sender=instance.coach,
                notification_type='CHALLENGE',
                title="Challenge Ended",
                message=f"The challenge '{instance.title}' has ended. Check your results!",
                related_object_id=instance.id,
                related_object_type='Challenge'
            )
        
        # Notify the coach as well
        Notification.objects.create(
            recipient=instance.coach,
            notification_type='CHALLENGE',
            title="Your Challenge Has Ended",
            message=f"Your challenge '{instance.title}' has ended. Check the participants' results!",
            related_object_id=instance.id,
            related_object_type='Challenge'
        )