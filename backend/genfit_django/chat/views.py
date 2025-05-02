from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import DirectChat
from .serializers import UserSerializer, DirectChatCreateSerializer, DirectChatSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """
    Get all users except the requesting user.
    """
    users = User.objects.exclude(id=request.user.id)
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chats(request):
    """
    Get all direct chats for the requesting user.
    """
    # Get chats where the current user is a participant
    chats = DirectChat.objects.filter(participants=request.user)

    # Using serializer with appropriate context
    serializer = DirectChatSerializer(chats, many=True, context={'request': request})

    # Filter out any chats with invalid other_user in serialized data
    valid_chats = []
    for chat_data in serializer.data:
        if 'other_user' in chat_data and chat_data['other_user'] is not None:
            valid_chats.append(chat_data)

    return Response(valid_chats)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_chat(request):
    """
    Create a new direct chat between the requesting user and another user.
    """
    serializer = DirectChatCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        chat = serializer.save()
        # Ensure the chat has a valid other_user before returning
        chat_data = DirectChatSerializer(chat, context={'request': request}).data

        if 'other_user' not in chat_data or chat_data['other_user'] is None:
            return Response(
                {"error": "Failed to create chat with valid other user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(chat_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)