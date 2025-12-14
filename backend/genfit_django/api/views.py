from django.contrib.auth import login, logout, get_user_model
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.sites.shortcuts import get_current_site
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from .serializers import UserRegistrationSerializer, UserLoginSerializer, ContactSubmissionSerializer, NotificationSerializer, UserSerializer
from .models import Notification, ContactSubmission, FitnessGoal, MentorMenteeRelationship, Thread, Comment, Subcomment, Vote, Challenge, ChallengeParticipant, Profile, AiTutorChat, AiTutorResponse, UserAiMessage
from chat.models import DirectChat, DirectMessage
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.contrib import admin


User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Automatically log in the user after registration
        login(request, user)
        
        # Handle remember me functionality if provided
        remember_me = serializer.validated_data.get('remember_me', False)
        if remember_me:
            # Session will last for 2 weeks (same as SESSION_COOKIE_AGE)
            request.session.set_expiry(1209600)
        else:
            request.session.set_expiry(0)  # Session expires when browser closes
        
        # Generate verification token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        current_site = get_current_site(request)
        verification_url = f'http://{current_site.domain}/api/verify-email/{uid}/{token}/'

        try:
            # Send verification email
            # send_mail(
            #     subject='Verify your email',
            #     message=f'Please click the link to verify your email: {verification_url}',
            #     from_email =None,
            #     recipient_list=[user.email],
            #     fail_silently=False,
            # )
            a = 1
        except:
            # Handle email sending error if needed
            pass
        
        return Response({
            'message': 'Registration successful and logged in.',
            'user_id': user.pk
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid verification link'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.filter(username=serializer.validated_data['username']).first()
        if user and user.check_password(serializer.validated_data['password']):
            if not user.is_active:
                return Response({'error': 'Please verify your email first'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            login(request, user)
            
            # Update login streak
            user.update_login_streak()
            
            # Handle remember me functionality
            if serializer.validated_data.get('remember_me', False):
                # Session will last for 2 weeks (same as SESSION_COOKIE_AGE)
                request.session.set_expiry(1209600)
            else:
                request.session.set_expiry(0)  # Session expires when browser closes
            
            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    logout(request)
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response({"detail": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old_password):
        return Response({"old_password": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    # Return a success message
    return Response({"detail": "Account deleted successfully."}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def rtbf_delete_user_data(request):
    user = request.user
    with transaction.atomic():
        Notification.objects.filter(recipient=user).delete()
        Notification.objects.filter(sender=user).delete()
        MentorMenteeRelationship.objects.filter(sender=user).delete()
        MentorMenteeRelationship.objects.filter(receiver=user).delete()
        MentorMenteeRelationship.objects.filter(mentor=user).delete()
        MentorMenteeRelationship.objects.filter(mentee=user).delete()
        FitnessGoal.objects.filter(user=user).delete()
        FitnessGoal.objects.filter(mentor=user).delete()
        Vote.objects.filter(user=user).delete()
        thread_ct = ContentType.objects.get_for_model(Thread)
        comment_ct = ContentType.objects.get_for_model(Comment)
        subcomment_ct = ContentType.objects.get_for_model(Subcomment)
        threads = list(Thread.objects.filter(author=user).values_list('id', flat=True))
        if threads:
            Vote.objects.filter(content_type=thread_ct, object_id__in=threads).delete()
            comment_ids = list(Comment.objects.filter(thread_id__in=threads).values_list('id', flat=True))
            if comment_ids:
                Vote.objects.filter(content_type=comment_ct, object_id__in=comment_ids).delete()
                sub_ids = list(Subcomment.objects.filter(comment_id__in=comment_ids).values_list('id', flat=True))
                if sub_ids:
                    Vote.objects.filter(content_type=subcomment_ct, object_id__in=sub_ids).delete()
                Subcomment.objects.filter(comment_id__in=comment_ids).delete()
            Comment.objects.filter(thread_id__in=threads).delete()
            Thread.objects.filter(id__in=threads).delete()
        user_comment_ids = list(Comment.objects.filter(author=user).values_list('id', flat=True))
        if user_comment_ids:
            Vote.objects.filter(content_type=comment_ct, object_id__in=user_comment_ids).delete()
            Subcomment.objects.filter(comment_id__in=user_comment_ids).delete()
            Comment.objects.filter(id__in=user_comment_ids).delete()
        user_sub_ids = list(Subcomment.objects.filter(author=user).values_list('id', flat=True))
        if user_sub_ids:
            Vote.objects.filter(content_type=subcomment_ct, object_id__in=user_sub_ids).delete()
            Subcomment.objects.filter(id__in=user_sub_ids).delete()
        DirectMessage.objects.filter(sender=user).delete()
        DirectChat.objects.filter(participants__id=user.id).delete()
        UserAiMessage.objects.filter(user=user).delete()
        AiTutorResponse.objects.filter(chat__user=user).delete()
        AiTutorChat.objects.filter(user=user).delete()
        ChallengeParticipant.objects.filter(user=user).delete()
        ChallengeParticipant.objects.filter(challenge__coach=user).delete()
        Challenge.objects.filter(coach=user).delete()
        Profile.objects.filter(user=user).delete()
        u = user
        u.delete()
    return Response({"detail": "User data deleted"}, status=status.HTTP_200_OK)


# NOTIFICATION VIEWS
# Get all notifications for a single user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):      
    notifications = Notification.objects.filter(recipient=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

# Get a single notification
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_single_notification(request, notification_id):      
    try:
        notification = request.user.notifications.get(id=notification_id)
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': f'Notification not found. {e}'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)

        notification.is_read = True
        notification.save()

        return Response({'message': 'Notification marked as read'})
    except Exception as e:
        return Response({'error': f'Notification not found {e}'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_unread(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)

        notification.is_read = False
        notification.save()

        return Response({'message': 'Notification marked as unread'})
    except Exception as e:
        return Response({'error': f'Notification not found {e}'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    try:
        request.user.notifications.all().update(is_read=True)
        return Response({'message': 'All notifications marked as read'})
    except Exception as e:
        return Response({'error': f'Error marking notifications as read: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_login_stats(request):
    """Get detailed login statistics for the authenticated user"""
    from datetime import date, timedelta
    
    user = request.user
    today = date.today()
    
    # Calculate if streak is still active (logged in today or yesterday)
    streak_active = False
    if user.last_login_date:
        days_since_last_login = (today - user.last_login_date).days
        streak_active = days_since_last_login <= 1
    
    # Calculate days until streak breaks (if active)
    days_until_break = None
    if streak_active and user.last_login_date == today:
        days_until_break = 1  # Will break tomorrow if not logged in
    elif streak_active and user.last_login_date == (today - timedelta(days=1)):
        days_until_break = 0  # Will break today if not logged in
    
    # Get login calendar data for the last 90 days
    login_calendar = []
    if user.last_login_date:
        # For now, we'll return the last login date and streak info
        # In a more advanced implementation, you'd track each login date
        start_date = max(user.last_login_date - timedelta(days=user.current_streak - 1), 
                        today - timedelta(days=90))
        
        current_date = start_date
        while current_date <= min(user.last_login_date, today):
            login_calendar.append({
                'date': current_date.isoformat(),
                'logged_in': True
            })
            current_date += timedelta(days=1)
    
    response_data = {
        'current_streak': user.current_streak,
        'longest_streak': user.longest_streak,
        'total_login_days': user.total_login_days,
        'last_login_date': user.last_login_date.isoformat() if user.last_login_date else None,
        'streak_active': streak_active,
        'days_until_break': days_until_break,
        'login_calendar': login_calendar,
        'logged_in_today': user.last_login_date == today if user.last_login_date else False,
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.delete()
        return Response({'message': 'Notification deleted successfully'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Error deleting notification: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Get CSRF token for frontend authentication
    """
    return Response({'csrfToken': get_token(request)})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    Get or update user settings/preferences
    """
    user = request.user
    
    if request.method == 'GET':
        try:
            daily_advice_enabled = getattr(user, 'daily_advice_enabled', True)
        except AttributeError:
            # Field doesn't exist yet (migration not run)
            daily_advice_enabled = True
        
        return Response({
            'daily_advice_enabled': daily_advice_enabled,
        })
    
    elif request.method == 'PATCH':
        # Update settings
        if 'daily_advice_enabled' in request.data:
            try:
                user.daily_advice_enabled = request.data['daily_advice_enabled']
                user.save()
                daily_advice_enabled = user.daily_advice_enabled
            except AttributeError:
                # Field doesn't exist yet (migration not run)
                return Response({
                    'error': 'Settings feature not available. Please run database migrations.',
                    'daily_advice_enabled': True,
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return Response({
            'message': 'Settings updated successfully',
            'daily_advice_enabled': daily_advice_enabled,
        })


@api_view(['POST'])
def contact_submission(request):
    if request.method == 'POST':
        serializer = ContactSubmissionSerializer(data=request.data)
        
        if serializer.is_valid():
            # Save the contact submission to database
            contact = serializer.save()
            
            # Return success response
            return Response({
                'status': 'success',
                'message': 'Thank you for your message! We will get back to you soon.',
                'submission_id': contact.id
            }, status=status.HTTP_201_CREATED)
        else:
            # Return validation errors
            return Response({
                'status': 'error',
                'message': 'Please correct the errors below.',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'submitted_at']
    list_filter = ['submitted_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['name', 'email', 'subject', 'message', 'submitted_at']
    
    # Optional: Add these for better organization
    list_per_page = 20
    date_hierarchy = 'submitted_at'
    
    def has_add_permission(self, request):
        # Prevent admin from adding new submissions manually
        return False
    
    def has_change_permission(self, request, obj=None):
        # Make submissions read-only
        return False
