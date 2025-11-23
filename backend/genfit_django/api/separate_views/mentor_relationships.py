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
    try:
        serializer = MentorMenteeRelationshipSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # The serializer.save() already creates the notification in its create() method
            relationship = serializer.save()
            return Response(MentorMenteeRelationshipSerializer(relationship).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating mentor relationship: {str(e)}", exc_info=True)
        return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_mentor_relationships(request):
    """
    List mentor-mentee relationships for the current user.
    Optional filtering via query params:
    - `status`: one of ACCEPTED, PENDING, TERMINATED, REJECTED (case-insensitive, comma-separated supported)
    - `as`: filter among request roles: sender | receiver
    - `role`: filter among relationship roles: mentor | mentee
    Default when filters are omitted: any involvement (sender/receiver/mentor/mentee)
    """
    user = request.user
    status_filter = request.GET.get('status')
    as_filter = request.GET.get('as')
    role_filter = request.GET.get('role')

    qs = MentorMenteeRelationship.objects.filter(
        Q(sender=user) | Q(receiver=user) | Q(mentor=user) | Q(mentee=user)
    )

    if as_filter:
        key = as_filter.strip().lower()
        if key in ['sender', 'receiver']:
            qs = qs.filter(**{key: user})

    if role_filter:
        key = role_filter.strip().lower()
        if key in ['mentor', 'mentee']:
            qs = qs.filter(**{key: user})

    if status_filter:
        values = [s.strip().upper() for s in status_filter.split(',') if s.strip()]
        qs = qs.filter(status__in=values)

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
def change_mentor_relationship_status(request, relationship_id):
    """
    Change status of a mentor-mentee relationship in a unified endpoint.
    Body must include: {"status": "ACCEPTED|REJECTED|TERMINATED"}
    Rules:
    - ACCEPTED/REJECTED: only receiver can change when current status is PENDING
    - TERMINATED: only mentor or mentee can change when current status is ACCEPTED
    Notifications are sent accordingly.
    """
    relationship = get_object_or_404(MentorMenteeRelationship, id=relationship_id)
    requested = request.data.get('status')
    if not requested:
        return Response({'error': 'status is required'}, status=status.HTTP_400_BAD_REQUEST)

    target = str(requested).upper()
    if target not in ['ACCEPTED', 'REJECTED', 'TERMINATED']:
        return Response({'error': 'Invalid status. Must be ACCEPTED, REJECTED, or TERMINATED.'}, status=status.HTTP_400_BAD_REQUEST)

    if target in ['ACCEPTED', 'REJECTED']:
        if relationship.status != 'PENDING':
            return Response({'error': 'This request has already been responded to.'}, status=status.HTTP_400_BAD_REQUEST)
        if target == 'ACCEPTED':
            if request.user != relationship.receiver:
                return Response({'error': 'Only the receiver can accept this request.'}, status=status.HTTP_403_FORBIDDEN)
            relationship.status = 'ACCEPTED'
            relationship.save()
            Notification.objects.create(
                recipient=relationship.sender,
                sender=request.user,
                notification_type='SYSTEM',
                title='Mentor Request Response',
                message=f'{request.user.username} has accepted your mentor request.',
                related_object_id=relationship.id,
                related_object_type='MentorMenteeRelationship'
            )
            return Response({'message': 'Request accepted.'}, status=status.HTTP_200_OK)
        if target == 'REJECTED':
            if request.user not in [relationship.receiver, relationship.sender]:
                return Response({'error': 'Only the receiver or sender can reject/cancel this request.'}, status=status.HTTP_403_FORBIDDEN)
            relationship.status = 'REJECTED'
            relationship.save()
            notify_recipient = relationship.sender if request.user == relationship.receiver else relationship.receiver
            Notification.objects.create(
                recipient=notify_recipient,
                sender=request.user,
                notification_type='SYSTEM',
                title='Mentor Request Update',
                message=f'{request.user.username} has rejected/cancelled the mentor request.',
                related_object_id=relationship.id,
                related_object_type='MentorMenteeRelationship'
            )
            return Response({'message': 'Request rejected/cancelled.'}, status=status.HTTP_200_OK)

    if target == 'TERMINATED':
        if request.user not in [relationship.mentor, relationship.mentee]:
            return Response({'error': 'Only mentor or mentee can terminate this relationship.'}, status=status.HTTP_403_FORBIDDEN)
        if relationship.status != 'ACCEPTED':
            return Response({'error': 'Only accepted relationships can be terminated.'}, status=status.HTTP_400_BAD_REQUEST)
        relationship.status = 'TERMINATED'
        relationship.save()
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

    return Response({'error': 'Unhandled status change'}, status=status.HTTP_400_BAD_REQUEST)