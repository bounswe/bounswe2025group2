from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import AiTutorChat, AiTutorResponse, UserAiMessage
from ..serializers import AiTutorChatSerializer, AiTutorResponseSerializer, UserAiMessageSerializer
import uuid
import os
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

def get_response_from_groq(message, chat):
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
    
    # Create the messages array with system message first
    messages = [
        {
            "role": "system",
            "content": "You are a helpful tutor assistant which excells at fitness. Give precise and consise answers to the user. "
                       "Try to be helpful and supportive. If the question is not related to fitness, say you are not able to help with that. "
                       "Finally, give your responses in plain text and don't use markdown formatting."
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
