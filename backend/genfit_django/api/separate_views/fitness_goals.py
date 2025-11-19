from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from ..models import FitnessGoal, Notification, UserWithType, MentorMenteeRelationship
from ..serializers import FitnessGoalSerializer, FitnessGoalUpdateSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def fitness_goals(request):
    if request.method == 'GET':
        username = request.query_params.get('username')
        if username:
            try:
                target_user = UserWithType.objects.get(username=username)
            except UserWithType.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)
            if target_user != request.user:
                rel_exists = MentorMenteeRelationship.objects.filter(
                    mentor=request.user,
                    mentee=target_user,
                    status='ACCEPTED'
                ).exists()
                if not rel_exists:
                    return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            goals = FitnessGoal.objects.filter(Q(user=target_user))
        else:
            goals = FitnessGoal.objects.filter(Q(user=request.user))
        serializer = FitnessGoalSerializer(goals, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Check if status is set to 'ACTIVE', if not, set it to 'ACTIVE'
        if 'status' not in request.data or request.data['status'] != 'ACTIVE':
            request.data['status'] = 'ACTIVE'

        serializer = FitnessGoalSerializer(data=request.data)
        if serializer.is_valid():
            target_user_id = request.data.get('user')
            if target_user_id and str(target_user_id) != str(request.user.id):
                try:
                    target_user = UserWithType.objects.get(id=target_user_id)
                except UserWithType.DoesNotExist:
                    return Response({'detail': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
                rel_exists = MentorMenteeRelationship.objects.filter(
                    mentor=request.user,
                    mentee=target_user,
                    status='ACCEPTED'
                ).exists()
                if not rel_exists:
                    return Response({'detail': 'Not authorized to create goals for this user'}, status=status.HTTP_403_FORBIDDEN)
                instance = serializer.save(user=target_user, mentor=request.user)
                Notification.objects.create(
                    recipient=target_user,
                    sender=request.user,
                    notification_type='GOAL',
                    title='New Fitness Goal Assigned',
                    message=f'Your mentor has set a new fitness goal: {instance.title}',
                    related_object_id=instance.id,
                    related_object_type='FitnessGoal'
                )
                return Response(FitnessGoalSerializer(instance).data, status=status.HTTP_201_CREATED)
            instance = serializer.save(user=request.user, mentor=None)
            return Response(FitnessGoalSerializer(instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    else:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def fitness_goal_detail(request, goal_id):
    try:
        goal = FitnessGoal.objects.get(
            Q(user=request.user) | Q(mentor=request.user),
            id=goal_id
        )
    except FitnessGoal.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = FitnessGoalSerializer(goal)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = FitnessGoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    else:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_goal_progress(request, goal_id):
    try:
        goal = FitnessGoal.objects.get(user=request.user, id=goal_id)
    except FitnessGoal.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    serializer = FitnessGoalUpdateSerializer(goal, data=request.data, partial=True)
    if serializer.is_valid():
        # Update progress and check if goal is completed
        if 'current_value' in request.data:
            if request.data['current_value'] >= goal.target_value:
                serializer.save(status='COMPLETED')
                # Create completion notification
                Notification.objects.create(
                    recipient=request.user,
                    notification_type='ACHIEVEMENT',
                    title='Goal Completed!',
                    message=f'Congratulations! You have completed your goal: {goal.title}',
                    related_object_id=goal_id,
                    related_object_type='FitnessGoal'
                )
            else:
                serializer.save()

        # Handle goal restart
        if 'status' in request.data and request.data['status'] == 'RESTARTED':
            serializer.save(current_value=0.0, start_date=timezone.now())

        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restart_goal(request, goal_id):
    try:
        goal = FitnessGoal.objects.get(user=request.user, id=goal_id)
    except FitnessGoal.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if goal.status != 'INACTIVE':
        return Response({'detail': 'Only inactive goals can be restarted.'}, status=status.HTTP_400_BAD_REQUEST)

    duration = goal.target_date - goal.start_date
    goal.status = 'RESTARTED'
    goal.current_value = 0.0
    goal.start_date = timezone.now()
    goal.target_date = goal.start_date + duration
    goal.save()

    serializer = FitnessGoalSerializer(goal)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_inactive_goals(request):
    # Get goals that haven't been updated in the last 7 days
    inactive_threshold = timezone.now() - timezone.timedelta(days=7)
    inactive_goals = FitnessGoal.objects.filter(
        user=request.user,
        status='ACTIVE',
        last_updated__lt=inactive_threshold
    )

    for goal in inactive_goals:
        # Create notification for inactive goal
        Notification.objects.create(
            recipient=request.user,
            notification_type='GOAL_INACTIVE',
            title='Inactive Goal Alert',
            message=f'Your goal "{goal.title}" has been inactive for 7 days. Keep pushing!',
            related_object_id=goal.id,
            related_object_type='FitnessGoal'
        )
        # Update goal status to inactive
        goal.status = 'INACTIVE'
        goal.save()

    return Response({'message': f'{len(inactive_goals)} goals marked as inactive'})