from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from ..models import Challenge, ChallengeParticipant
from ..serializers import ChallengeSerializer, ChallengeParticipantSerializer

# Gets one challenge for the user. If user has joined to that challenge "joined" will be true. Otherwise flase
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenge_detail(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    challenge_data = ChallengeSerializer(challenge).data

    participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).first()

    if participant:
        participant_data = ChallengeParticipantSerializer(participant).data
        return Response({
            "joined": True,
            "challenge": challenge_data,
            "participant": participant_data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "joined": False,
            "challenge": challenge_data
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_challenge(request):
    if request.user.user_type != 'Coach':
        return Response({"detail": "Only users with 'Coach' user_type can create challenges."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ChallengeSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        challenge = serializer.save(coach=request.user)
        return Response(ChallengeSerializer(challenge).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    if challenge.coach != request.user:
        return Response({"detail": "You do not have permission to update this challenge."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ChallengeSerializer(challenge, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        updated_challenge = serializer.save()
        return Response(ChallengeSerializer(updated_challenge).data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    if challenge.coach != request.user:
        return Response({"detail": "You do not have permission to delete this challenge."}, status=status.HTTP_403_FORBIDDEN)

    challenge.delete()
    return Response({"detail": "Challenge deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    if not challenge.is_active():
        return Response({"detail": "This challenge is not active"}, status=status.HTTP_403_FORBIDDEN)
    if ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).exists():
        return Response({"detail": "You have already joined this challenge."}, status=status.HTTP_400_BAD_REQUEST)

    ChallengeParticipant.objects.create(challenge=challenge, user=request.user)
    return Response({"detail": "Successfully joined the challenge!"}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).first()
    if not participant:
        return Response({"detail": "You are not a participant of this challenge."}, status=status.HTTP_400_BAD_REQUEST)

    participant.delete()
    return Response({"detail": "Successfully left the challenge."}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_progress(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).first()

    if not challenge.is_active():
        return Response({"detail": "This challenge is not active"}, status=status.HTTP_403_FORBIDDEN)

    if not participant:
        return Response({"detail": "You are not a participant of this challenge."}, status=status.HTTP_400_BAD_REQUEST)

    added_value = request.data.get('added_value')
    if added_value is not None:
        participant.update_progress(added_value)

    return Response({"detail": "Progress updated successfully!"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def challenge_leaderboard(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)

    # Default ordering rules
    order_fields = {
        'finish_date': 'finish_date',
        'progress': '-current_value',
        'joined_at': 'joined_at',
        'username': 'user__username'
    }

    # Apply query param overrides if provided
    custom_order = []
    for field in ['finish_date', 'progress', 'joined_at', 'username']:
        user_order = request.GET.get(field)
        if user_order == '-':
            field_path = order_fields[field]
            if field_path.startswith('-'):
                custom_order.append(field_path[1:])  # reverse if already descending
            else:
                custom_order.append(f'-{field_path}')
        else:
            custom_order.append(order_fields[field])

    participants = ChallengeParticipant.objects.filter(challenge=challenge).order_by(*custom_order)
    serializer = ChallengeParticipantSerializer(participants, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
