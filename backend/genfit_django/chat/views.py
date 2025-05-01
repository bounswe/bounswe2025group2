from django.contrib.auth import login, logout, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import ChatGroupCreateSerializer, ChatGroupSerializer
from .models import ChatGroup, GroupMessage

@api_view(['GET'])
def get_chat_groups(request):
    """
    Get all chat groups.
    """
    chat_groups = ChatGroup.objects.all()
    serializer = ChatGroupSerializer(chat_groups, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def create_chat_group(request):
    """
    Create a new chat group.
    """
    serializer = ChatGroupCreateSerializer(data=request.data)
    if serializer.is_valid():
        chat_group = serializer.save()
        return Response(ChatGroupSerializer(chat_group).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


