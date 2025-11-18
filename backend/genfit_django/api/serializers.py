from rest_framework import serializers
from django.contrib.auth import password_validation
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from .utils import geocode_location
from .models import Notification, UserWithType, FitnessGoal, Profile, Forum, Thread, Comment, Subcomment, Vote, Challenge, ChallengeParticipant, AiTutorChat, AiTutorResponse, UserAiMessage, DailyAdvice, MentorMenteeRelationship
from django.utils import timezone


User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Normally, we would set verification_file as type FileField, but for now, let's set it as a TextField
    verification_file = serializers.CharField(required=False, allow_blank=True)
    remember_me = serializers.BooleanField(default=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'user_type', 'verification_file', 'remember_me']

    def validate_username(self, value):
        # Username validation: starts with lowercase letter, contains at least one digit and one letter
        username_validator = RegexValidator(
            regex=r'^[a-z][a-zA-Z0-9]*(?:[a-zA-Z]*[0-9]|[0-9]*[a-zA-Z])[a-zA-Z0-9]*$',
            message='Username must start with a lowercase letter and contain at least one digit and one letter'
        )
        username_validator(value)
        return value

    def create(self, validated_data):
        verification_file = validated_data.pop('verification_file', None)
        remember_me = validated_data.pop('remember_me', False)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            # Normally, we would set is_active to False here, but for now, let's set it to True
            is_active=True
        )

        # Create profile for the new user
        #Profile.objects.create(user=user)

        if user.user_type == 'Coach' and verification_file:
            # Handle verification file for coach
            user.is_verified_coach = True
            user.save()
            pass

        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    remember_me = serializers.BooleanField(default=False)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWithType
        fields = ['id', 'username', 'email', 'user_type', 'is_verified_coach', 
                  'current_streak', 'longest_streak', 'last_login_date', 'total_login_days',
                  'daily_advice_enabled']
        read_only_fields = ['id', 'is_verified_coach', 'current_streak', 'longest_streak', 
                           'last_login_date', 'total_login_days']

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.user_type = validated_data.get('user_type', instance.user_type)

        # Normally, we would handle password hashing here, but for now, let's skip it
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])

        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True, allow_null=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    target_thread_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'sender_username',
            'recipient_username',
            'notification_type',
            'title',
            'message',
            'related_object_id',
            'related_object_type',
            'is_read',
            'is_email_sent',
            'created_at',
            'target_thread_id',
        ]
        read_only_fields = ['id', 'created_at', 'is_email_sent']

    def create(self, validated_data):
        notification = Notification.objects.create(**validated_data)
        return notification

    def update(self, instance, validated_data):
        instance.is_read = validated_data.get('is_read', instance.is_read)
        instance.save()
        return instance

    def get_target_thread_id(self, obj):
        # Determine the thread id that the notification should navigate to
        try:
            if obj.related_object_type == 'Thread' and obj.related_object_id:
                return obj.related_object_id
            if obj.related_object_type == 'Comment' and obj.related_object_id:
                comment = Comment.objects.filter(id=obj.related_object_id).only('thread_id').first()
                return comment.thread_id if comment else None
            if obj.related_object_type == 'Subcomment' and obj.related_object_id:
                sub = Subcomment.objects.filter(id=obj.related_object_id).only('comment_id').first()
                if not sub:
                    return None
                comment = Comment.objects.filter(id=sub.comment_id).only('thread_id').first()
                return comment.thread_id if comment else None
        except Exception:
            return None
        return None

class FitnessGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.FloatField(read_only=True)
    mentor = serializers.PrimaryKeyRelatedField(queryset=UserWithType.objects.filter(user_type='Coach'), required=False, allow_null=True)

    class Meta:
        model = FitnessGoal
        fields = '__all__'
        read_only_fields = ('user', 'current_value', 'status', 'last_updated', 'progress_percentage')

    def validate_mentor(self, value):
        if value:
            return True
        return False

class FitnessGoalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessGoal
        fields = ('current_value', 'status')

    def validate_status(self, value):
        if value not in ['ACTIVE', 'COMPLETED', 'INACTIVE', 'RESTARTED']:
            raise serializers.ValidationError("Invalid status value.")
        return value


class ProfileSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username',
            'name',
            'surname',
            'bio',
            'location',
            'birth_date',
            'age',
            'created_at',
            'updated_at',
            'preferred_sports',
        ]
        read_only_fields = ['username', 'created_at', 'updated_at']


class ForumSerializer(serializers.ModelSerializer):
    thread_count = serializers.IntegerField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Forum
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 
                 'created_by', 'is_active', 'order', 'thread_count']
        read_only_fields = ['created_at', 'updated_at']

class ThreadListSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    forum = serializers.StringRelatedField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Thread
        fields = ['id', 'title', 'author', 'forum', 'created_at', 'updated_at',
                 'is_pinned', 'is_locked', 'view_count', 'like_count', 'last_activity',
                 'comment_count']
        read_only_fields = ['created_at', 'updated_at', 'view_count', 'like_count', 'last_activity']

class ThreadDetailSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    forum = serializers.PrimaryKeyRelatedField(queryset=Forum.objects.all())
    comment_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Thread
        fields = ['id', 'title', 'content', 'author', 'forum', 'created_at', 
                 'updated_at', 'is_pinned', 'is_locked', 'view_count', 
                 'like_count', 'last_activity', 'comment_count']
        read_only_fields = ['created_at', 'updated_at', 'view_count', 'like_count', 'last_activity']

    def update(self, instance, validated_data):
        instance.updated_at = timezone.now()
        instance.save()
        return instance

class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    thread_id = serializers.IntegerField(source='thread.id', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'author_id',
            'author_username',
            'thread_id',
            'content',
            'like_count',
            'subcomment_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'author_id', 'thread_id', 'created_at', 'updated_at', 'subcomment_count', 'like_count']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        thread_id = self.context.get('thread_id')
        if not thread_id:
            raise serializers.ValidationError("Thread ID is required in context.")

        # Get the actual Thread instance
        validated_data['thread'] = Thread.objects.get(id=thread_id)
        return Comment.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.content = validated_data.get('content', instance.content)
        instance.updated_at = timezone.now()
        instance.save()
        return instance

    def delete(self, instance):
        thread = instance.thread
        thread.comment_count = max(0, thread.comment_count - 1)
        thread.save(update_fields=['comment_count'])

        for sub in instance.subcomments.all():
            sub.votes.all().delete()
            sub.delete()

        instance.votes.all().delete()
        instance.delete()

class SubcommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    comment_id = serializers.IntegerField(source='comment.id', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Subcomment
        fields = [
            'id',
            'author_id',
            'author_username',
            'comment_id',
            'content',
            'like_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'author_id', 'comment_id', 'created_at', 'updated_at', 'like_count']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        comment_id = self.context.get('comment_id')
        if not comment_id:
            raise serializers.ValidationError("Comment ID is required in context.")
        # Get the actual Comment instance
        validated_data['comment'] = Comment.objects.get(id=comment_id)

        return Subcomment.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.content = validated_data.get('content', instance.content)
        instance.updated_at = timezone.now()
        instance.save()
        return instance

    def delete(self, instance):
        comment = instance.comment
        instance.votes.all().delete()
        instance.delete()

        comment.subcomment_count = max(0, comment.subcomment_count - 1)
        comment.save(update_fields=['subcomment_count'])
        
class VoteSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Vote
        fields = [
            'id',
            'user_username',
            'content_type',
            'object_id',
            'vote_type',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Get the content type and object
        content_type = validated_data.get('content_type')
        object_id = validated_data.get('object_id')
        vote_type = validated_data.get('vote_type')
        
        # Get the actual content object
        content_object = content_type.get_object_for_this_type(id=object_id)
        
        # Create or update the vote using the class method
        vote = Vote.create_or_update_vote(
            user=self.context['request'].user,
            content_object=content_object,
            new_vote_type=vote_type
        )
        return vote


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

#Challenges
class ChallengeSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    is_joined = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = '__all__'
        read_only_fields = ['coach', 'created_at', 'is_active', 'is_joined', 'user_progress', 'participant_count']

    def get_is_active(self, obj):
        return obj.is_active()
    
    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ChallengeParticipant.objects.filter(challenge=obj, user=request.user).exists()
        return False
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            participant = ChallengeParticipant.objects.filter(challenge=obj, user=request.user).first()
            return participant.current_value if participant else 0
        return 0
    
    def get_participant_count(self, obj):
        return obj.participants.count()

    def create(self, validated_data):
        request = self.context['request']
        user = request.user

        validated_data['coach'] = user

        # Auto-geocode if location is provided but lat/lon are missing
        location = validated_data.get('location')
        if (not validated_data.get('latitude') or not validated_data.get('longitude')) and location:
            try:
                lat, lon = geocode_location(location)
                validated_data['latitude'] = lat
                validated_data['longitude'] = lon
            except:
                validated_data['latitude'] = None
                validated_data['longitude'] = None

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Auto-geocode if location is updated but lat/lon are missing
        location = validated_data.get('location', instance.location)
        lat = validated_data.get('latitude', instance.latitude)
        lon = validated_data.get('longitude', instance.longitude)

        if (lat is None or lon is None) and location:
            lat, lon = geocode_location(location)
            validated_data['latitude'] = lat
            validated_data['longitude'] = lon

        return super().update(instance, validated_data)

class ChallengePartSerializer(serializers.ModelSerializer):
    challenge_id = serializers.IntegerField(source='challenge.id')

    class Meta:
        model = ChallengeParticipant
        fields = ['challenge_id'] 

class ChallengeParticipantSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeParticipant
        fields = '__all__'
        read_only_fields = ['challenge', 'user', 'joined_at', 'last_updated', 'finish_date']

    def update(self, instance, validated_data):
        # First, call the parent update method to update other fields if necessary
        instance = super().update(instance, validated_data)

        # Now, update the progress (if `added_value` is provided)
        added_value = validated_data.get('current_value', None)
        if added_value is not None:
            instance.update_progress(added_value)

        return instance

    def get_username(self, obj):
        return obj.user.username

class AiTutorChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiTutorChat
        fields = ['id', 'chat_id', 'user', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'chat_id', 'user']

class AiTutorResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiTutorResponse
        fields = ['id', 'chat', 'response', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class UserAiMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAiMessage
        fields = ['id', 'user', 'chat', 'message', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DailyAdviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAdvice
        fields = ['id', 'user', 'advice_text', 'date', 'created_at']
        read_only_fields = ['created_at']


class MentorMenteeRelationshipSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    mentor_username = serializers.CharField(source='mentor.username', read_only=True)
    mentee_username = serializers.CharField(source='mentee.username', read_only=True)

    class Meta:
        model = MentorMenteeRelationship
        fields = [
            'id', 'sender', 'receiver', 'mentor', 'mentee', 'status',
            'sender_username', 'receiver_username', 'mentor_username', 'mentee_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'receiver', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate the mentor-mentee relationship data"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        mentor = data.get('mentor')
        mentee = data.get('mentee')
        
        if mentor.id == mentee.id:
            raise serializers.ValidationError("Mentor and mentee cannot be the same user")

        # The authenticated user must be either the mentor or the mentee
        if request.user.id not in [mentor.id, mentee.id]:
            raise serializers.ValidationError("You can only create relationships for yourself")
        
        # Check if relationship already exists
        existing = MentorMenteeRelationship.objects.filter(
            mentor=mentor, mentee=mentee
        ).exclude(status='REJECTED').exists()
        
        if existing:
            raise serializers.ValidationError("A relationship between this mentor and mentee already exists")
        
        return data

    def create(self, validated_data):
        """Create a new mentor-mentee relationship request"""
        request = self.context.get('request')
        user = request.user
        
        mentor = validated_data['mentor']
        mentee = validated_data['mentee']
        
        # Determine sender and receiver based on who is making the request
        if user == mentor:
            # Coach is sending the request to be a mentor
            sender = mentor
            receiver = mentee
        elif user == mentee:
            # User is sending the request to have a mentor
            sender = mentee
            receiver = mentor
        else:
            raise serializers.ValidationError("You can only create relationships for yourself")
        
        # Create the relationship
        relationship = MentorMenteeRelationship.objects.create(
            sender=sender,
            receiver=receiver,
            mentor=mentor,
            mentee=mentee,
            status='PENDING'
        )
        
        # Create notification for the receiver
        Notification.objects.create(
            recipient=receiver,
            sender=sender,
            notification_type='MENTOR_REQUEST',
            title='New Mentor Request',
            message=f'{sender.username} wants to establish a mentor-mentee relationship with you.',
            related_object_id=relationship.id,
            related_object_type='MentorMenteeRelationship'
        )
        
        return relationship

