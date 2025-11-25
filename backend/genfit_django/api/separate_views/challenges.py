from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from math import radians, sin, cos, sqrt, atan2

from ..models import Challenge, ChallengeParticipant
from ..serializers import ChallengeSerializer, ChallengeParticipantSerializer
from ..utils import geocode_location

# Gets one challenge for the user. If user has joined to that challenge "joined" will be true. Otherwise flase
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenge_detail(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    challenge_data = ChallengeSerializer(challenge).data

    participants = ChallengeParticipant.objects.filter(challenge=challenge)
    joined = participants.filter(user=request.user).exists()

    return Response({
        "joined": joined,
        "challenge": challenge_data,
        "participants": ChallengeParticipantSerializer(participants, many=True).data if joined else []
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_joined_challenges(request):
    # Get all challenge ids from the challenge participants table
    challenge_ids = ChallengeParticipant.objects.filter(user=request.user).values_list('challenge_id', flat=True)
    # Return as a list of dicts with stringified IDs
    joined_challenges = [{"id": str(ch_id)} for ch_id in challenge_ids]
    
    return Response(joined_challenges)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_challenge_progresses(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    if not challenge.is_active():
        return Response({"detail": "This challenge is not active"}, status=status.HTTP_403_FORBIDDEN)

    participant = ChallengeParticipant.objects.filter(challenge=challenge, user=request.user).first()
    serializer = ChallengeParticipantSerializer(participant)
    return Response(serializer.data, status=status.HTTP_200_OK)

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
    return Response({"detail": "Challenge deleted successfully."}, status=status.HTTP_200_OK)


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
    return Response({"detail": "Successfully left the challenge."}, status=status.HTTP_200_OK)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_challenges(request):
    """
    Search and filter challenges based on various criteria:
    - active/passive status
    - user participation
    - age range
    - location proximity
    """
    # Get query parameters
    is_active = request.GET.get('is_active')
    user_participating = request.GET.get('user_participating')
    min_age = request.GET.get('min_age')
    max_age = request.GET.get('max_age')
    location = request.GET.get('location')
    radius_km = request.GET.get('radius_km', 10)  # Default 10km radius

    # Start with all challenges
    challenges = Challenge.objects.all()

    # Filter by active/passive status
    if is_active is not None:
        now = timezone.now()
        if is_active.lower() == 'true':
            challenges = challenges.filter(start_date__lte=now, end_date__gte=now)
        else:
            challenges = challenges.filter(Q(start_date__gt=now) | Q(end_date__lt=now))

    # Filter by user participation
    if user_participating is not None:
        if user_participating.lower() == 'true':
            challenges = challenges.filter(participants__user=request.user)
        else:
            challenges = challenges.exclude(participants__user=request.user)

    # Filter by age range
    if min_age is not None:
        challenges = challenges.filter(Q(min_age__lte=min_age) | Q(min_age__isnull=True))
    if max_age is not None:
        challenges = challenges.filter(Q(max_age__gte=max_age) | Q(max_age__isnull=True))

    # Filter by location proximity
    if location:
        # Get coordinates for the search location
        lat, lon = geocode_location(location)
        if lat is not None and lon is not None:
            # Convert radius from km to degrees (approximate)
            if radius_km:
                try:
                    radius_deg = float(radius_km) / 111.32
                except ValueError:
                    return Response(
                        {"error": "Invalid radius value. Must be a valid number."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            # Filter challenges within the radius
            challenges = challenges.filter(
                latitude__isnull=False,
                longitude__isnull=False,
                latitude__range=(lat - radius_deg, lat + radius_deg),
                longitude__range=(lon - radius_deg, lon + radius_deg)
            )

            # Calculate exact distances and filter
            def calculate_distance(lat1, lon1, lat2, lon2):
                R = 6371  # Earth's radius in kilometers
                lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                return R * c

            # Filter challenges by exact distance
            challenges = [
                challenge for challenge in challenges
                if calculate_distance(lat, lon, challenge.latitude, challenge.longitude) <= float(radius_km)
            ]

    # Serialize the results
    serializer = ChallengeSerializer(challenges, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
