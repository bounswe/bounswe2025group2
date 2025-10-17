from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import AiTutorChat, AiTutorResponse, UserAiMessage, FitnessGoal, Profile, ChallengeParticipant
from ..serializers import AiTutorChatSerializer, AiTutorResponseSerializer, UserAiMessageSerializer
import uuid
import os
from groq import Groq
from dotenv import load_dotenv
from datetime import date
from django.utils import timezone
load_dotenv()

def get_user_context(user):
    """
    Gather comprehensive user context for AI tutor personalization
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
        context_parts.append("Current Active Fitness Goals:")
        for goal in active_goals:
            progress = goal.progress_percentage
            goal_info = f"- {goal.title} ({goal.get_goal_type_display()}): {goal.current_value}/{goal.target_value} {goal.unit} ({progress:.1f}% complete)"
            if goal.description:
                goal_info += f" - {goal.description}"
            context_parts.append(goal_info)
    
    # Get recently completed goals for context
    completed_goals = FitnessGoal.objects.filter(user=user, status='COMPLETED').order_by('-last_updated')[:3]
    if completed_goals:
        context_parts.append("Recently Completed Goals:")
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
        context_parts.append("Current Challenge Participations:")
        for participation in active_challenges:
            challenge = participation.challenge
            progress_percent = (participation.current_value / challenge.target_value * 100) if challenge.target_value > 0 else 0
            context_parts.append(f"- {challenge.title}: {participation.current_value}/{challenge.target_value} {challenge.unit} ({progress_percent:.1f}% complete)")
    
    return "\n".join(context_parts) if context_parts else "No specific user context available"

def get_response_from_groq(message, chat):
    # Get user context for personalization
    user_context = get_user_context(chat.user)
    
    # Get the last 3 messages and responses
    user_messages = UserAiMessage.objects.filter(chat=chat).order_by('-created_at')[:3]
    ai_responses = AiTutorResponse.objects.filter(chat=chat).order_by('-created_at')[:3]
    
    # Combine and sort messages by created_at
    history = []
    for msg in user_messages:
        history.append({"role": "user", "content": msg.message})
    for resp in ai_responses:
        history.append({"role": "assistant", "content": resp.response})
    
    # Sort by created_at in ascending order (oldest first)
    history.sort(key=lambda x: x.get('created_at', ''), reverse=False)
    
    # Create enhanced system message with user context
    system_content = (
        "You are a helpful fitness tutor assistant that excels at providing personalized fitness advice. "
        "Give precise and concise answers to the user. Try to be helpful and supportive. "
        "If the question is not related to fitness, politely say you are not able to help with that topic. "
        "Give your responses in plain text and don't use markdown formatting.\n\n"
        f"USER CONTEXT:\n{user_context}\n\n"
        "Use this context to provide personalized advice. Reference their goals, progress, and challenges when relevant. "
        "If they ask about their progress, refer to their specific goals and current achievements. "
        "Encourage them based on their current fitness journey and provide advice tailored to their goals and experience level."
    )
    
    # Create the messages array with enhanced system message first
    messages = [
        {
            "role": "system",
            "content": system_content
        }
    ]
    
    # Add historical context
    messages.extend(history)
    
    # Add the current message
    messages.append({"role": "user", "content": message})
    
    client = Groq(
        api_key=os.environ.get("GROQ_API_KEY"),
    )

    chat_completion = client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
    )

    response = chat_completion.choices[0].message.content
    return response


class AiTutorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AiTutorChatSerializer

    def get_queryset(self):
        return AiTutorChat.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Generate a unique chat_id
        chat_id = str(uuid.uuid4())
        serializer.save(user=self.request.user, chat_id=chat_id)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        chat = self.get_object()
        message = request.data.get('message')
        
        if not message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user's message
        user_message = UserAiMessage.objects.create(
            user=request.user,
            chat=chat,
            message=message
        )

        # Get AI response with chat history context
        ai_response = get_response_from_groq(message, chat)
        
        # Save AI's response
        tutor_response = AiTutorResponse.objects.create(
            chat=chat,
            response=ai_response
        )

        return Response({
            'user_message': UserAiMessageSerializer(user_message).data,
            'ai_response': AiTutorResponseSerializer(tutor_response).data
        })

    @action(detail=True, methods=['get'])
    def chat_history(self, request, pk=None):
        chat = self.get_object()
        
        # Get all messages and responses for this chat
        user_messages = UserAiMessage.objects.filter(chat=chat).order_by('created_at')
        ai_responses = AiTutorResponse.objects.filter(chat=chat).order_by('created_at')

        return Response({
            'user_messages': UserAiMessageSerializer(user_messages, many=True).data,
            'ai_responses': AiTutorResponseSerializer(ai_responses, many=True).data
        })
