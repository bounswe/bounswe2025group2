from rest_framework import serializers
from django.contrib.auth import password_validation
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Notification, UserWithType, FitnessGoal, Profile, Forum, Thread, Comment, Subcomment, Vote


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
        Profile.objects.create(user=user)

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
        fields = ['id', 'username', 'email', 'user_type', 'is_verified_coach']
        read_only_fields = ['id', 'is_verified_coach']

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
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'is_email_sent']

    def create(self, validated_data):
        notification = Notification.objects.create(**validated_data)
        return notification

    def update(self, instance, validated_data):
        instance.is_read = validated_data.get('is_read', instance.is_read)
        instance.save()
        return instance

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
        fields = ['username', 'bio', 'location', 'birth_date', 'age', 'created_at', 'updated_at']
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

    class Meta:
        model = Comment
        fields = [
            'id',
            'author_id',
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
        validated_data['thread_id'] = self.context.get('thread_id') 
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

    class Meta:
        model = Subcomment
        fields = [
            'id',
            'author_id',
            'comment_id',
            'content',
            'like_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'author_id', 'comment_id', 'created_at', 'updated_at', 'like_count']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['comment_id'] = self.context.get('comment_id') 

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




