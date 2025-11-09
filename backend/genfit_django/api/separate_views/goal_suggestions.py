from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..models import FitnessGoal, Profile, ChallengeParticipant
from django.utils import timezone
import os
from groq import Groq
from dotenv import load_dotenv
import json
import re

load_dotenv()


def get_user_context_for_goal_suggestion(user):
    """
    Gather comprehensive user context for goal suggestion personalization
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
    active_goals = FitnessGoal.objects.filter(user=user, status='ACTIVE').order_by('-start_date')[:5]
    if active_goals:
        context_parts.append("\nCurrent Active Fitness Goals:")
        for goal in active_goals:
            progress = goal.progress_percentage
            goal_info = f"- {goal.title} ({goal.get_goal_type_display()}): {goal.current_value}/{goal.target_value} {goal.unit} ({progress:.1f}% complete)"
            if goal.description:
                goal_info += f"\n  Description: {goal.description}"
            context_parts.append(goal_info)
    
    # Get recently completed goals for context
    completed_goals = FitnessGoal.objects.filter(user=user, status='COMPLETED').order_by('-last_updated')[:3]
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
            context_parts.append(f"- {challenge.title}: {participation.current_value}/{challenge.target_value} {challenge.unit} ({progress_percent:.1f}% complete)")
    
    return "\n".join(context_parts) if context_parts else "No specific user context available"


def get_goal_suggestions_from_groq(user, title, description, retry_count=0, max_retries=3):
    """
    Get AI-powered suggestions for a new fitness goal based on user context and goal details
    Includes retry logic if AI doesn't return valid JSON
    """
    user_context = get_user_context_for_goal_suggestion(user)
    
    # Create the system message with detailed instructions
    system_content = (
        "You are an expert fitness coach AI that provides personalized goal suggestions. "
        "Based on the user's profile, current goals, and the new goal details provided, "
        "you will suggest appropriate target values, target dates, and personalized exercise tips.\n\n"
        "IMPORTANT: You must respond ONLY with a valid JSON object in the following exact format:\n"
        "{\n"
        '  "suggested_target_value": <number>,\n'
        '  "suggested_unit": "<string>",\n'
        '  "suggested_target_date_days": <number of days from today>,\n'
        '  "goal_type": "<WALKING_RUNNING|WORKOUT|CYCLING|SWIMMING|SPORTS>",\n'
        '  "exercise_tips": "<string with helpful exercise tips>",\n'
        '  "personalized_advice": "<string with advice based on user profile>",\n'
        '  "reasoning": "<brief explanation of why these values were suggested>"\n'
        "}\n\n"
        "Guidelines:\n"
        "- suggested_target_value should be realistic based on the user's current fitness level\n"
        "- suggested_unit should match the goal type (e.g., 'km' for running, 'minutes' for workouts, 'reps' for exercises)\n"
        "- suggested_target_date_days should be between 1 and 600 days based on goal difficulty\n"
        "- goal_type must be ONE of: WALKING_RUNNING, WORKOUT, CYCLING, SWIMMING, SPORTS\n"
        "- exercise_tips should provide specific, actionable advice on how to perform the exercise\n"
        "- personalized_advice should reference the user's profile, age, current goals, or fitness level\n"
        "- Be encouraging and supportive in your tone\n"
        "- Consider the user's existing goals to avoid overtraining or conflicts\n\n"
        f"USER CONTEXT:\n{user_context}\n"
    )
    
    # Create the user message with goal details
    user_message = (
        f"Please suggest target values, timeline, and personalized tips for this new fitness goal:\n\n"
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        f"Remember to respond ONLY with a valid JSON object following the exact format specified."
    )
    
    # Add retry context if this is a retry attempt
    if retry_count > 0:
        user_message += f"\n\nIMPORTANT: This is retry attempt {retry_count}. Your previous response was not in valid JSON format. Please ensure you respond with ONLY the JSON object, nothing else."
    
    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message}
    ]
    
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )
        
        response_text = chat_completion.choices[0].message.content
        
        # Try to extract JSON from the response
        # Sometimes the model might include extra text, so we look for JSON pattern
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group()
            suggestions = json.loads(json_str)
            
            # Validate required fields
            required_fields = [
                'suggested_target_value',
                'suggested_unit',
                'suggested_target_date_days',
                'goal_type',
                'exercise_tips',
                'personalized_advice',
                'reasoning'
            ]
            
            for field in required_fields:
                if field not in suggestions:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate goal_type
            valid_goal_types = ['WALKING_RUNNING', 'WORKOUT', 'CYCLING', 'SWIMMING', 'SPORTS']
            if suggestions['goal_type'] not in valid_goal_types:
                suggestions['goal_type'] = 'WORKOUT'  # Default fallback
            
            # Ensure target_date_days is within reasonable range
            days = suggestions['suggested_target_date_days']
            if not isinstance(days, (int, float)) or days < 1 or days > 600:
                suggestions['suggested_target_date_days'] = 30  # Default to 30 days
            
            return suggestions
        else:
            # No valid JSON found - retry if possible
            if retry_count < max_retries:
                print(f"No valid JSON in response (attempt {retry_count + 1}/{max_retries + 1}). Retrying...")
                return get_goal_suggestions_from_groq(user, title, description, retry_count + 1, max_retries)
            else:
                raise ValueError(f"No valid JSON found in AI response after {max_retries + 1} attempts")
            
    except json.JSONDecodeError as e:
        # JSON parsing failed - retry if possible
        if retry_count < max_retries:
            print(f"JSON parsing failed (attempt {retry_count + 1}/{max_retries + 1}). Retrying...")
            return get_goal_suggestions_from_groq(user, title, description, retry_count + 1, max_retries)
        else:
            raise Exception(f"Failed to parse AI response after {max_retries + 1} attempts: {str(e)}")
    except ValueError as e:
        # Missing required fields - retry if possible
        if retry_count < max_retries and "Missing required field" in str(e):
            print(f"Missing required field (attempt {retry_count + 1}/{max_retries + 1}). Retrying...")
            return get_goal_suggestions_from_groq(user, title, description, retry_count + 1, max_retries)
        else:
            raise Exception(f"AI suggestion validation error: {str(e)}")
    except Exception as e:
        raise Exception(f"AI suggestion service error: {str(e)}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_goal_suggestions(request):
    """
    Endpoint to get AI-powered suggestions for a new fitness goal
    
    Request body:
    {
        "title": "Goal title",
        "description": "Goal description"
    }
    
    Response:
    {
        "suggested_target_value": 10.0,
        "suggested_unit": "km",
        "suggested_target_date_days": 30,
        "goal_type": "WALKING_RUNNING",
        "exercise_tips": "...",
        "personalized_advice": "...",
        "reasoning": "..."
    }
    """
    title = request.data.get('title', '').strip()
    description = request.data.get('description', '').strip()
    
    if not title:
        return Response(
            {'error': 'Title is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Default description if not provided
    if not description:
        description = "No description provided"
    
    try:
        suggestions = get_goal_suggestions_from_groq(request.user, title, description)
        return Response(suggestions, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {
                'error': 'Failed to generate suggestions',
                'detail': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
