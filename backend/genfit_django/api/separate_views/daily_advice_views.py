from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..models import DailyAdvice, FitnessGoal, Profile, ChallengeParticipant
from ..serializers import DailyAdviceSerializer
from datetime import date, timedelta
from django.utils import timezone
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def get_user_context_for_advice(user):
    """
    Gather comprehensive user context for generating personalized daily advice
    """
    context_parts = []
    
    # Get user profile information
    try:
        profile = user.profile
        if profile.name or profile.surname:
            full_name = f"{profile.name} {profile.surname}".strip()
            context_parts.append(f"User's name: {full_name}")
        
        if profile.age:
            context_parts.append(f"Age: {profile.age} years old")
        
        if profile.location:
            context_parts.append(f"Location: {profile.location}")
        
        if profile.bio:
            context_parts.append(f"Bio: {profile.bio}")
            
    except Profile.DoesNotExist:
        context_parts.append("No profile information available")
    
    # Get active fitness goals
    active_goals = FitnessGoal.objects.filter(user=user, status='ACTIVE').order_by('target_date')[:5]
    if active_goals:
        context_parts.append("\nCurrent Active Fitness Goals:")
        for goal in active_goals:
            progress = goal.progress_percentage
            days_until_deadline = (goal.target_date.date() - date.today()).days
            goal_info = f"- {goal.title} ({goal.get_goal_type_display()}): {goal.current_value}/{goal.target_value} {goal.unit} ({progress:.1f}% complete)"
            if days_until_deadline <= 7:
                goal_info += f" - URGENT: {days_until_deadline} days until deadline!"
            elif days_until_deadline <= 14:
                goal_info += f" - {days_until_deadline} days until deadline"
            if goal.description:
                goal_info += f" - {goal.description}"
            context_parts.append(goal_info)
    
    # Get recently completed goals for motivation
    completed_goals = FitnessGoal.objects.filter(user=user, status='COMPLETED').order_by('-last_updated')[:2]
    if completed_goals:
        context_parts.append("\nRecently Completed Goals:")
        for goal in completed_goals:
            context_parts.append(f"- {goal.title} ({goal.get_goal_type_display()}): {goal.target_value} {goal.unit}")
    
    # Get active challenge participations
    now = timezone.now()
    active_challenges = ChallengeParticipant.objects.filter(
        user=user, 
        challenge__start_date__lte=now,
        challenge__end_date__gte=now
    ).select_related('challenge')[:3]
    
    if active_challenges:
        context_parts.append("\nCurrent Challenge Participations:")
        for participation in active_challenges:
            challenge = participation.challenge
            progress_percent = (participation.current_value / challenge.target_value * 100) if challenge.target_value > 0 else 0
            days_until_end = (challenge.end_date.date() - date.today()).days
            challenge_info = f"- {challenge.title}: {participation.current_value}/{challenge.target_value} {challenge.unit} ({progress_percent:.1f}% complete)"
            if days_until_end <= 3:
                challenge_info += f" - URGENT: {days_until_end} days remaining!"
            elif days_until_end <= 7:
                challenge_info += f" - {days_until_end} days remaining"
            context_parts.append(challenge_info)
    
    return "\n".join(context_parts) if context_parts else "No specific user context available"


def generate_daily_advice_with_ai(user):
    """
    Generate personalized daily advice using AI based on user's profile, goals, and challenges
    """
    user_context = get_user_context_for_advice(user)
    
    # Create the prompt for AI
    system_content = (
        "You are a professional fitness coach and motivational advisor. Your task is to create a personalized daily fitness plan and advice. "
        "Analyze the user's current goals, challenges, progress, and deadlines to provide actionable, specific, and motivating advice. "
        "\n\nGuidelines:\n"
        "1. Start with a brief motivational greeting\n"
        "2. Acknowledge their recent progress or current status\n"
        "3. Create a specific plan for TODAY with 2-4 actionable items\n"
        "4. Prioritize goals/challenges with close deadlines (mark as URGENT if deadline is within 7 days)\n"
        "5. Explain WHY each recommendation matters for their specific goals, you can also include some nutrition advice if relevant\n"
        "6. Keep the tone encouraging, supportive, and professional\n"
        "7. Be concise but comprehensive (aim for 100-200 words)\n"
        "8. Use plain text without markdown formatting\n"
        "9. If they have urgent deadlines, emphasize those in your plan\n"
        "10. Consider their fitness level and age when making recommendations\n\n"
        f"USER PROFILE AND CONTEXT:\n{user_context}\n\n"
        "Based on this information, create today's personalized fitness plan and advice."
    )
    
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_content
                },
                {
                    "role": "user",
                    "content": f"Generate my personalized daily fitness plan for {date.today().strftime('%A, %B %d, %Y')}."
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,  # Add some creativity while keeping it focused
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        # Fallback advice if AI fails
        return (
            f"Good morning! Welcome to your fitness journey for {date.today().strftime('%A, %B %d')}.\n\n"
            "Today's Focus:\n"
            "1. Start with a 10-minute warm-up to prepare your body\n"
            "2. Work on your active goals with consistent effort\n"
            "3. Stay hydrated throughout the day\n"
            "4. Track your progress to stay motivated\n\n"
            "Remember: Every small step counts towards your fitness goals. Stay consistent and believe in yourself!"
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_advice(request):
    """
    Get or generate daily advice for the authenticated user
    Returns cached advice if already generated today, otherwise generates new advice
    """
    user = request.user
    today = date.today()
    
    # Check if user has daily advice enabled (default to True if field doesn't exist)
    daily_advice_enabled = getattr(user, 'daily_advice_enabled', True)
    if not daily_advice_enabled:
        return Response({
            'enabled': False,
            'message': 'Daily advice is disabled. Enable it in your settings to receive personalized fitness plans.'
        }, status=status.HTTP_200_OK)
    
    # Check if advice already exists for today
    try:
        daily_advice = DailyAdvice.objects.get(user=user, date=today)
        serializer = DailyAdviceSerializer(daily_advice)
        response_data = serializer.data
        response_data['enabled'] = True
        return Response(response_data, status=status.HTTP_200_OK)
    except DailyAdvice.DoesNotExist:
        # Generate new advice for today
        advice_text = generate_daily_advice_with_ai(user)
        
        # Save the generated advice
        daily_advice = DailyAdvice.objects.create(
            user=user,
            advice_text=advice_text,
            date=today
        )
        
        serializer = DailyAdviceSerializer(daily_advice)
        response_data = serializer.data
        response_data['enabled'] = True
        return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_daily_advice(request):
    """
    Force regenerate daily advice for the authenticated user
    Useful if user wants fresh advice
    """
    user = request.user
    today = date.today()
    
    # Delete existing advice for today if it exists
    DailyAdvice.objects.filter(user=user, date=today).delete()
    
    # Generate new advice
    advice_text = generate_daily_advice_with_ai(user)
    
    # Save the generated advice
    daily_advice = DailyAdvice.objects.create(
        user=user,
        advice_text=advice_text,
        date=today
    )
    
    serializer = DailyAdviceSerializer(daily_advice)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

