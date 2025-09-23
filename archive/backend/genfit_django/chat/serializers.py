from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import DirectChat, DirectMessage

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class DirectMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username')

    class Meta:
        model = DirectMessage
        fields = ['id', 'sender', 'body', 'created', 'is_read']

class DirectChatSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = DirectChat
        fields = ['id', 'participants', 'other_user', 'created', 'last_message', 'unread_count']

    def get_other_user(self, obj):
        request = self.context.get('request')
        if not request:
            return None

        # Get the other user in the chat (excluding the current user)
        other_user = obj.participants.exclude(id=request.user.id).first()

        # If there's no other user, return None
        if not other_user:
            return None

        return UserSerializer(other_user).data

    def get_last_message(self, obj):
        # Get the last message in the chat
        last_message = DirectMessage.objects.filter(chat=obj).order_by('-created').first()
        if not last_message:
            return None

        return {
            'body': last_message.body,
            'created': last_message.created,
            'sender': last_message.sender.username
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0

        # Get the other user
        other_user = obj.participants.exclude(id=request.user.id).first()
        if not other_user:
            return 0

        # Count unread messages sent by the other user
        return DirectMessage.objects.filter(
            chat=obj,
            sender=other_user,
            is_read=False
        ).count()

class DirectChatCreateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        request = self.context.get('request')

        # Check if the user exists
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

        # Check if the user is not the requesting user
        if request and user.id == request.user.id:
            raise serializers.ValidationError("Cannot create a chat with yourself")

        return value

    def create(self, validated_data):
        request = self.context.get('request')
        user_id = validated_data.get('user_id')

        # Get the target user
        other_user = User.objects.get(id=user_id)

        # Check if a chat already exists between these users
        existing_chat = DirectChat.objects.filter(participants=request.user).filter(participants=other_user).first()
        if existing_chat:
            return existing_chat

        # Create a new chat
        chat = DirectChat.objects.create()
        chat.participants.add(request.user, other_user)
        return chat