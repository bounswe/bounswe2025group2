from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from ..models import MentorMenteeRequest, Notification, UserWithType
from ..serializers import MentorMenteeRequestCreateSerializer, MentorMenteeRequestSerializer, UserSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_mentor_request(request, mentee_id):
    try:
        mentee = UserWithType.objects.get(id=mentee_id)  # Get mentee user
    except UserWithType.DoesNotExist:
        return Response({'error': 'Mentee not found.'}, status=status.HTTP_404_NOT_FOUND)
    mentor = request.user

    # Check if the user is already a mentor for the mentee
    if mentee in request.user.mentees.all():
        return Response({'error': 'You are already mentoring this user.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.user == mentee:
        return Response({'error': 'You cannot be your own mentor.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if request already exists
    if MentorMenteeRequest.objects.filter(mentor=request.user, mentee=mentee, status='PENDING').exists():
        return Response({'error': 'You have already sent a mentor request to this user.'}, status=status.HTTP_400_BAD_REQUEST)


    # Create and validate the request
    serializer = MentorMenteeRequestCreateSerializer(data={
        'mentor': mentor.id,
        'mentee': mentee.id,
        'sender': mentor.id,
        'recipient': mentee.id
    })
    if serializer.is_valid():
        # Save the mentor-mentee request
        mentor_mentee_request = serializer.save()

        # Create a notification for the mentee
        Notification.objects.create(
            recipient=mentee,
            sender=mentor,  # The mentor sends the request
            notification_type='MENTOR_REQUEST',
            title='New Mentor Request',
            message=f'{request.user.username} has sent you a request to be your mentor.',
            related_object_id=mentor_mentee_request.id,
            related_object_type='MentorMenteeRequest'
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_mentee_request(request, mentor_id):
    try:
        mentor = UserWithType.objects.get(id=mentor_id)  # Get mentor user
    except UserWithType.DoesNotExist:
        return Response({'error': 'Mentor not found.'}, status=status.HTTP_404_NOT_FOUND)

    mentee = request.user

    # Check if the user is already a mentee for the mentor
    if mentor in mentee.mentors.all():
        return Response({'error': 'You are already being mentored by this user.'}, status=status.HTTP_400_BAD_REQUEST)

    if mentee == mentor:
        return Response({'error': 'You cannot be your own mentee.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if request already exists
    if MentorMenteeRequest.objects.filter(mentor=mentor, mentee=mentee, status='PENDING').exists():
        return Response({'error': 'You have already sent a mentee request to this user.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create and validate the request
    serializer = MentorMenteeRequestCreateSerializer(data={
        'mentor': mentor.id,
        'mentee': mentee.id,
        'sender': mentee.id,
        'recipient': mentor.id
    })
    if serializer.is_valid():
        # Save the mentor-mentee request
        mentor_mentee_request = serializer.save()

        # Create a notification for the mentor
        Notification.objects.create(
            recipient=mentor,
            sender=mentee,
            notification_type='MENTEE_REQUEST',
            title='New Mentee Request',
            message=f'{mentee.username} has sent you a request to be their mentor.',
            related_object_id=mentor_mentee_request.id,
            related_object_type='MentorMenteeRequest'
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mentor_mentee_requests(request):
    # Get the user making the request
    user = request.user

    # Extract the 'status' query parameter (if any)
    status_filter = request.query_params.get('status', None)

    # Filter requests based on whether the user is the mentor or mentee
    requests = MentorMenteeRequest.objects.filter(
        Q(mentor=user) | Q(mentee=user)
    )

    # If a status is provided, filter the requests by the specified status
    if status_filter:
        requests = requests.filter(status=status_filter)

    # Serialize the filtered requests
    serializer = MentorMenteeRequestSerializer(requests, many=True)

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_mentor_mentee_request(request, request_id):
    """
    Accept or reject a mentor-mentee request.
    Payload must include: {"response": "ACCEPTED"} or {"response": "REJECTED"}
    Only the recipient of the request can respond.
    """
    try:
        req_obj = MentorMenteeRequest.objects.get(id=request_id)
    except MentorMenteeRequest.DoesNotExist:
        return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)

    if req_obj.recipient != request.user:
        return Response({'error': 'Only the recipient can respond to this request.'}, status=status.HTTP_403_FORBIDDEN)

    if req_obj.status != 'PENDING':
        return Response({'error': 'This request has already been responded to.'}, status=status.HTTP_400_BAD_REQUEST)

    response = request.data.get('response')
    if response not in ['ACCEPTED', 'REJECTED']:
        return Response({'error': 'Invalid response. Must be ACCEPTED or REJECTED.'}, status=status.HTTP_400_BAD_REQUEST)

    # Update the request status
    req_obj.status = response
    req_obj.save()

    # If accepted, create the mentor-mentee relationship
    if response == 'ACCEPTED':
        req_obj.mentor.mentees.add(req_obj.mentee)

    # Notify the sender
    Notification.objects.create(
        recipient=req_obj.sender,
        sender=request.user,
        notification_type='REQUEST_RESPONSE',
        title='Mentor Request Response',
        message=(
            f"{request.user.username} has {response.lower()} your mentor request."
        ),
        related_object_id=req_obj.id,
        related_object_type='MentorMenteeRequest'
    )

    return Response({'message': f'Request {response.lower()}.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_mentors(request):
    mentors = request.user.mentors.all()
    serializer = UserSerializer(mentors, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_mentees(request):
    mentees = request.user.mentees.all()
    serializer = UserSerializer(mentees, many=True)
    return Response(serializer.data)