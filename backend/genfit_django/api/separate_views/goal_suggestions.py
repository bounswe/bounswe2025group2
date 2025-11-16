from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle
from ..models import FitnessGoal, Profile, ChallengeParticipant
from django.utils import timezone
import os
from groq import Groq
from dotenv import load_dotenv
import json
import re

load_dotenv()

class GoalSuggestionsThrottle(UserRateThrottle):
    rate = '20/hour'  # Max 10 suggestions per hour per user


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
    Get AI-powered suggestions for a new fitness goal based on user context and goal details.
    Includes retry logic if AI doesn't return valid JSON.
    AI also validates if the goal is realistic/safe.
    """
    user_context = get_user_context_for_goal_suggestion(user)
    
    # Create the system message with detailed instructions
    system_content = (
        "Expert fitness coach AI. Provide SAFE, REALISTIC goal suggestions. Return ONLY valid JSON.\n\n"
        "SAFETY: Set is_realistic=false ONLY if goal is physically dangerous/impossible OR completely unrealistic for THIS user. IMPORTANT: If user is already elite/professional (world-ranked, champion, pro athlete), their ambitious goals ARE realistic - support them! Only flag unrealistic if truly dangerous or beyond their capability. Include safer alternative in warning_message when unrealistic.\n\n"
        "JSON FORMAT:\n"
        '{"is_realistic":<bool>,"warning_message":<str|null>,"target_value":<num>,"unit":<str>,"days_to_complete":<1-6000>,"goal_type":<WALKING_RUNNING|WORKOUT|CYCLING|SWIMMING|SPORTS>,"tips":[<str>,<str>,<str>]}\n\n'
        "FIELDS:\n"
        "• is_realistic: false ONLY if dangerous/impossible for this user. Elite athletes pursuing championships = realistic!\n"
        "• warning_message: Why unsafe + safer alternative (null if realistic)\n"
        "• target_value: Realistic number for user's level\n"
        "• unit: Simple string (km/minutes/reps/kg/sessions/title/championship) - NOT complex descriptions\n"
        "• days_to_complete: Realistic timeline (1-6000 days)\n"
        "• goal_type: One of 5 types above\n"
        "• tips: Exactly 3 tips (max 150 chars each). CRITICAL: Match user's fitness level from profile. Elite athlete = elite-level advice. Beginner = beginner advice. Cover: technique, progression, recovery. Add reasoning when helpful. Multi-sport goals: include distances.\n\n"
        "EXAMPLES:\n"
        "Beginner/'Run 5K' → {is_realistic:true,warning_message:null,target_value:5,unit:'km',days_to_complete:45,goal_type:'WALKING_RUNNING',tips:['Walk-run intervals','Build gradually','Rest between sessions']}\n"
        "3rd in world MMA/'Become champion' → {is_realistic:true,warning_message:null,target_value:1,unit:'championship',days_to_complete:730,goal_type:'SPORTS',tips:['Refine weaknesses - study top 2 fighters','Peak conditioning for title shot','Mental game with sports psychologist']}\n"
        "Pro marathoner/'Walk 50m' → {is_realistic:true,warning_message:null,target_value:50,unit:'m',days_to_complete:1,goal_type:'WALKING_RUNNING',tips:['Too easy - try 10K instead','Add speed work','Set challenging goals']}\n"
        "'Lose 30kg in 1 week' → {is_realistic:false,warning_message:'Medically dangerous. Safe: 0.5-1kg/week over 30-60 weeks',target_value:0.5,unit:'kg',days_to_complete:7,goal_type:'WORKOUT',tips:['Sustainable deficit','Cardio+strength 4-5x/week','Prioritize protein+sleep']}\n"
        "Beginner/'Run 200km today' → {is_realistic:false,warning_message:'Exceeds human limits. Elite ultramarathoners: 100km in 20+ hours. Start with 10K',target_value:10,unit:'km',days_to_complete:60,goal_type:'WALKING_RUNNING',tips:['Build gradually','Conversational pace','Rest days crucial']}\n"
        "'Iron Man' → {target_value:1,unit:'triathlon',days_to_complete:365,goal_type:'SPORTS',tips:['1.5km swim, 40km bike, 10km run weekly','Practice transitions','Medical clearance first']}\n\n"
        f"USER:\n{user_context}\n"
    )
    
    # Create the user message with goal details
    user_message = (
        f"Analyze this fitness goal and provide suggestions:\n\n"
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        f"Remember: Respond ONLY with the JSON object. No extra text."
    )
    
    # Add retry context if this is a retry attempt
    if retry_count > 0:
        user_message += f"\n\n[RETRY {retry_count}/{max_retries}] Previous response was invalid JSON. Return ONLY the JSON object."
    
    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message}
    ]
    
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,  # Lower temperature for more consistent, safe responses
        )
        
        response_text = chat_completion.choices[0].message.content
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group()
            suggestions = json.loads(json_str)
            
            # Validate required fields
            required_fields = [
                'is_realistic',
                'warning_message',
                'target_value',
                'unit',
                'days_to_complete',
                'goal_type',
                'tips'
            ]
            
            for field in required_fields:
                if field not in suggestions:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate types
            if not isinstance(suggestions['is_realistic'], bool):
                raise ValueError("is_realistic must be a boolean")
            
            if not isinstance(suggestions['tips'], list):
                raise ValueError("tips must be an array")
            
            if len(suggestions['tips']) != 3:
                raise ValueError("tips must contain exactly 3 items")
            
            # Validate goal_type
            valid_goal_types = ['WALKING_RUNNING', 'WORKOUT', 'CYCLING', 'SWIMMING', 'SPORTS']
            if suggestions['goal_type'] not in valid_goal_types:
                suggestions['goal_type'] = 'WORKOUT'  # Default fallback
            
            # Ensure days_to_complete is within range
            days = suggestions['days_to_complete']
            if not isinstance(days, (int, float)) or days < 1 or days > 6000:
                suggestions['days_to_complete'] = 30
            
            # Trim tips if too long
            for i, tip in enumerate(suggestions['tips']):
                if tip and len(tip) > 200:
                    suggestions['tips'][i] = tip[:197] + "..."
            
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
        if retry_count < max_retries and ("Missing required field" in str(e) or "must be a boolean" in str(e)):
            print(f"Validation error (attempt {retry_count + 1}/{max_retries + 1}). Retrying...")
            return get_goal_suggestions_from_groq(user, title, description, retry_count + 1, max_retries)
        else:
            raise Exception(f"AI suggestion validation error: {str(e)}")
    except Exception as e:
        raise Exception(f"AI suggestion service error: {str(e)}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([GoalSuggestionsThrottle])
def get_goal_suggestions(request):
    """
    Endpoint to get AI-powered suggestions for a new fitness goal
    
    Request body:
    {
        "title": "Goal title",
        "description": "Goal description"
    }
    
    Response (realistic goal):
    {
        "is_realistic": true,
        "warning_message": null,
        "target_value": 5.0,
        "unit": "km",
        "days_to_complete": 45,
        "goal_type": "WALKING_RUNNING",
        "tip": "Start with walk-run intervals, 3x per week for 20-30 minutes."
    }
    
    Response (unrealistic goal):
    {
        "is_realistic": false,
        "warning_message": "Losing 30kg in 1 week is medically dangerous. Safe target is 0.5-1kg per week over 30-60 weeks.",
        "target_value": 0.5,
        "unit": "kg",
        "days_to_complete": 7,
        "goal_type": "WORKOUT",
        "tip": "Focus on sustainable calorie deficit and regular exercise."
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
        
        # Always return 200, frontend checks is_realistic flag
        return Response(suggestions, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {
                'error': 'Failed to generate suggestions',
                'detail': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
