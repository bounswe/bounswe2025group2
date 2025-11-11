from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404

from ..models import MentorMenteeRelationship, Notification, UserWithType
from ..serializers import MentorMenteeRelationshipSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_mentor_relationship(request):
    """
    Create a mentor-mentee relationship request.
    Body must include `mentor` and `mentee` (user IDs).
    `sender` and `receiver` are inferred from `request.user`.
    """
    serializer = MentorMenteeRelationshipSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        relationship = serializer.save()
        return Response(MentorMenteeRelationshipSerializer(relationship).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_mentor_relationships(request):
    """
    List mentor-mentee relationships for the current user.
    Optional query param `status` to filter by relationship status.
    """
    user = request.user
    status_filter = request.query_params.get('status')

    qs = MentorMenteeRelationship.objects.filter(Q(mentor=user) | Q(mentee=user))
    if status_filter:
        qs = qs.filter(status=status_filter)

    return Response(MentorMenteeRelationshipSerializer(qs, many=True).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentor_relationship_detail(request, relationship_id):
    """
    Get details for a specific mentor-mentee relationship if the user is involved.
    """
    relationship = get_object_or_404(MentorMenteeRelationship, id=relationship_id)
    if request.user not in [relationship.mentor, relationship.mentee, relationship.sender, relationship.receiver]:
        return Response({'error': 'Not authorized to view this relationship.'}, status=status.HTTP_403_FORBIDDEN)

    return Response(MentorMenteeRelationshipSerializer(relationship).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_mentor_relationship(request, relationship_id):
    """
    Accept or reject a mentor-mentee relationship request.
    Body must include: {"response": "ACCEPTED"} or {"response": "REJECTED"}.
    Only the receiver of the request can respond.
    """
    relationship = get_object_or_404(MentorMenteeRelationship, id=relationship_id)

    if relationship.status != 'PENDING':
        return Response({'error': 'This request has already been responded to.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.user != relationship.receiver:
        return Response({'error': 'Only the receiver can respond to this request.'}, status=status.HTTP_403_FORBIDDEN)

    response_value = request.data.get('response')
    if response_value not in ['ACCEPTED', 'REJECTED']:
        return Response({'error': 'Invalid response. Must be ACCEPTED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

    relationship.status = response_value
    relationship.save()

    # Notify the sender about the response
    Notification.objects.create(
        recipient=relationship.sender,
        sender=request.user,
        notification_type='SYSTEM',
        title='Mentor Request Response',
        message=f'{request.user.username} has {response_value.lower()} your mentor request.',
        related_object_id=relationship.id,
        related_object_type='MentorMenteeRelationship'
    )

    return Response({'message': f'Request {response_value.lower()}.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def terminate_mentor_relationship(request, relationship_id):
    """
    Terminate an accepted mentor-mentee relationship.
    Only mentor or mentee can terminate.
    """
    relationship = get_object_or_404(MentorMenteeRelationship, id=relationship_id)

    if request.user not in [relationship.mentor, relationship.mentee]:
        return Response({'error': 'Only mentor or mentee can terminate this relationship.'}, status=status.HTTP_403_FORBIDDEN)

    if relationship.status != 'ACCEPTED':
        return Response({'error': 'Only accepted relationships can be terminated.'}, status=status.HTTP_400_BAD_REQUEST)

    relationship.status = 'TERMINATED'
    relationship.save()

    # Notify the other party
    other_party = relationship.mentee if request.user == relationship.mentor else relationship.mentor
    Notification.objects.create(
        recipient=other_party,
        sender=request.user,
        notification_type='SYSTEM',
        title='Mentor Relationship Terminated',
        message=f'{request.user.username} has terminated the mentor relationship.',
        related_object_id=relationship.id,
        related_object_type='MentorMenteeRelationship'
    )

    return Response({'message': 'Relationship terminated.'}, status=status.HTTP_200_OK)