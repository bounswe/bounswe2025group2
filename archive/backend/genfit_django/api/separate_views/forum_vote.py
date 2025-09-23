from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from ..models import Vote, Thread, Comment, Subcomment
from django.contrib.contenttypes.models import ContentType
from ..serializers import VoteSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_vote(request):
    content_type = request.data.get('content_type')
    object_id = request.data.get('object_id')
    vote_type = request.data.get('vote_type')

    model_class = {
        'THREAD': Thread,
        'COMMENT': Comment,
        'SUBCOMMENT': Subcomment
    }.get(content_type)

    if not model_class:
        return Response({'error': 'Invalid content type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        content_object = model_class.objects.get(id=object_id)
        vote = Vote.create_or_update_vote(request.user, content_object, vote_type)
        return Response(VoteSerializer(vote).data, status=status.HTTP_201_CREATED)
    except model_class.DoesNotExist:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_vote(request, object_id, content_type):
    try:
        content_type_obj = ContentType.objects.get(model=content_type.lower())
        vote = Vote.objects.get(
            user=request.user,
            content_type=content_type_obj,
            object_id=object_id
        )
        return Response(VoteSerializer(vote).data)
    except (Vote.DoesNotExist, ContentType.DoesNotExist):
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_vote(request, object_id, content_type):
    try:
        content_type_obj = ContentType.objects.get(model=content_type.lower())
        vote = Vote.objects.get(
            user=request.user,
            content_type=content_type_obj,
            object_id=object_id
        )
        vote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except (Vote.DoesNotExist, ContentType.DoesNotExist):
        return Response(status=status.HTTP_404_NOT_FOUND)
