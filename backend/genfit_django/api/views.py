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
from .serializers import UserRegistrationSerializer, UserLoginSerializer, NotificationSerializer, UserSerializer
from .models import Notification


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

