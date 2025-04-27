from rest_framework import serializers
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model
from .models import Notification, UserWithType, FitnessGoal, Profile


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
        if value and value.user_type != 'Coach':
            raise serializers.ValidationError("Mentor must be a coach.")
        return value

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
