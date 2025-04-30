from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from ..models import Vote
from ..serializers import VoteSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_vote(request):
    serializer = VoteSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        # Vote model will handle the like_count update automatically
        vote = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_vote(request, content_type, content_id):
    try:
        vote = Vote.objects.get(
            user=request.user,
            content_type=content_type,
            content_id=content_id
        )
        # Vote model will handle the like_count update automatically
        vote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Vote.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_vote(request, content_type, content_id):
    try:
        vote = Vote.objects.get(
            user=request.user,
            content_type=content_type,
            content_id=content_id
        )
        serializer = VoteSerializer(vote)
        return Response(serializer.data)
    except Vote.DoesNotExist:
        return Response(None, status=status.HTTP_404_NOT_FOUND)