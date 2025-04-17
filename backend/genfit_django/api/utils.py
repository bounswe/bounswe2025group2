from django.core.mail import send_mail
from django.conf import settings
from django.core.exceptions import ValidationError
from .models import Notification

def create_notification(recipient, notification_type, title, message, sender=None, related_object_id=None, related_object_type=None, send_email=False):
    # Validate notification type
    if notification_type not in dict(Notification.NOTIFICATION_TYPES):
        raise ValidationError(f"Invalid notification type: {notification_type}")

    try:
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object_id=related_object_id,
            related_object_type=related_object_type
        )

        if send_email:
            try:
                send_mail(
                    subject=title,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient.email],
                    fail_silently=False,
                )
                notification.is_email_sent = True
                notification.save()
            except Exception as e:
                print("Failed to send email:", str(e))

        return notification

    except Exception as e:
        print("Failed to create notification:", str(e))
