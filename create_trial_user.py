#!/usr/bin/env python
"""
Script to create a trial user with username: trial123456, password: trial123456
and add random goals, notifications, and challenges for them.
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random
from django.utils import timezone

# Add the Django project directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'genfit_django'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'genfit_django.settings')
django.setup()

from api.models import (
    UserWithType, Profile, FitnessGoal, Challenge, ChallengeParticipant, 
    Notification, Forum, Thread, Comment
)

def create_trial_user():
    """Create a trial user with the specified credentials."""
    username = "trial123456"
    password = "trial123456"
    email = "trial123456@example.com"
    
    # Check if user already exists
    if UserWithType.objects.filter(username=username).exists():
        print(f"User {username} already exists. Deleting and recreating...")
        UserWithType.objects.filter(username=username).delete()
    
    # Create the user
    user = UserWithType.objects.create_user(
        username=username,
        email=email,
        password=password,
        user_type='User',
        first_name='Trial',
        last_name='User'
    )
    
    # Update profile
    profile = user.profile
    profile.name = 'Trial'
    profile.surname = 'User'
    profile.bio = 'This is a trial user account for testing purposes.'
    profile.location = 'Test City'
    profile.birth_date = datetime(1990, 1, 1).date()
    profile.save()
    
    print(f"✅ Created user: {username}")
    return user

def create_random_goals(user):
    """Create random fitness goals for the user."""
    goal_types = ['WALKING_RUNNING', 'WORKOUT', 'CYCLING', 'SWIMMING', 'SPORTS']
    goal_templates = {
        'WALKING_RUNNING': [
            {'title': 'Daily Walking Goal', 'description': 'Walk 10,000 steps daily', 'target': 10000, 'unit': 'steps'},
            {'title': '5K Run Challenge', 'description': 'Complete a 5K run', 'target': 5, 'unit': 'km'},
            {'title': 'Weekly Running Goal', 'description': 'Run 20km this week', 'target': 20, 'unit': 'km'},
        ],
        'WORKOUT': [
            {'title': 'Gym Workout Goal', 'description': 'Complete 3 gym sessions this week', 'target': 3, 'unit': 'sessions'},
            {'title': 'Push-up Challenge', 'description': 'Do 100 push-ups this week', 'target': 100, 'unit': 'reps'},
            {'title': 'Plank Challenge', 'description': 'Hold plank for 5 minutes total', 'target': 5, 'unit': 'minutes'},
        ],
        'CYCLING': [
            {'title': 'Bike to Work', 'description': 'Cycle to work 5 times this week', 'target': 5, 'unit': 'trips'},
            {'title': 'Weekend Cycling', 'description': 'Complete 50km cycling this weekend', 'target': 50, 'unit': 'km'},
        ],
        'SWIMMING': [
            {'title': 'Pool Sessions', 'description': 'Swim 3 times this week', 'target': 3, 'unit': 'sessions'},
            {'title': 'Swimming Distance', 'description': 'Swim 2km this week', 'target': 2, 'unit': 'km'},
        ],
        'SPORTS': [
            {'title': 'Basketball Games', 'description': 'Play basketball 2 times this week', 'target': 2, 'unit': 'games'},
            {'title': 'Tennis Matches', 'description': 'Play 3 tennis matches this week', 'target': 3, 'unit': 'matches'},
        ]
    }
    
    goals_created = 0
    for goal_type in random.sample(goal_types, k=random.randint(2, 4)):  # Create 2-4 goals
        template = random.choice(goal_templates[goal_type])
        
        # Random target date (1-4 weeks from now)
        target_date = timezone.now() + timedelta(weeks=random.randint(1, 4))
        
        goal = FitnessGoal.objects.create(
            user=user,
            goal_type=goal_type,
            title=template['title'],
            description=template['description'],
            target_value=template['target'],
            current_value=random.uniform(0, template['target'] * 0.3),  # 0-30% progress
            unit=template['unit'],
            target_date=target_date,
            status='ACTIVE'
        )
        goals_created += 1
        print(f"✅ Created goal: {goal.title}")
    
    return goals_created

def create_random_notifications(user):
    """Create random notifications for the user."""
    notification_templates = [
        {
            'type': 'ACHIEVEMENT',
            'title': 'Goal Achievement!',
            'message': 'Congratulations! You\'ve completed your daily walking goal.'
        },
        {
            'type': 'GOAL',
            'title': 'New Goal Assigned',
            'message': 'Your coach has assigned you a new fitness goal. Check it out!'
        },
        {
            'type': 'CHALLENGE',
            'title': 'Challenge Invitation',
            'message': 'You\'ve been invited to join the "Summer Fitness Challenge"!'
        },
        {
            'type': 'PROGRESS',
            'title': 'Great Progress!',
            'message': 'You\'re making excellent progress on your workout goals. Keep it up!'
        },
        {
            'type': 'BADGE',
            'title': 'New Badge Earned',
            'message': 'You\'ve earned the "Early Bird" badge for completing morning workouts!'
        },
        {
            'type': 'SYSTEM',
            'title': 'Welcome to GenFit!',
            'message': 'Welcome to GenFit! Start your fitness journey today.'
        },
        {
            'type': 'FEEDBACK',
            'title': 'Coach Feedback',
            'message': 'Your coach has left feedback on your recent workout. Check it out!'
        }
    ]
    
    notifications_created = 0
    for _ in range(random.randint(3, 7)):  # Create 3-7 notifications
        template = random.choice(notification_templates)
        
        # Random creation time (last 7 days)
        created_at = timezone.now() - timedelta(days=random.randint(0, 7))
        
        notification = Notification.objects.create(
            recipient=user,
            notification_type=template['type'],
            title=template['title'],
            message=template['message'],
            is_read=random.choice([True, False]),
            created_at=created_at
        )
        notifications_created += 1
        print(f"✅ Created notification: {notification.title}")
    
    return notifications_created

def create_random_challenges(user):
    """Create random challenges and enroll the user in them."""
    challenge_templates = [
        {
            'title': '30-Day Fitness Challenge',
            'description': 'Complete 30 days of consistent fitness activities',
            'challenge_type': 'FITNESS_STREAK',
            'target_value': 30,
            'unit': 'days'
        },
        {
            'title': '10K Steps Daily',
            'description': 'Walk 10,000 steps every day for a week',
            'challenge_type': 'WALKING',
            'target_value': 70000,
            'unit': 'steps'
        },
        {
            'title': 'Plank Master',
            'description': 'Hold a plank for a total of 60 minutes this month',
            'challenge_type': 'STRENGTH',
            'target_value': 60,
            'unit': 'minutes'
        },
        {
            'title': 'Cardio Blast',
            'description': 'Complete 5 hours of cardio this week',
            'challenge_type': 'CARDIO',
            'target_value': 300,
            'unit': 'minutes'
        },
        {
            'title': 'Swimming Champion',
            'description': 'Swim 5km this month',
            'challenge_type': 'SWIMMING',
            'target_value': 5,
            'unit': 'km'
        }
    ]
    
    challenges_created = 0
    participants_created = 0
    
    # Create a coach user for challenges (if not exists)
    coach_username = "coach_trial"
    if not UserWithType.objects.filter(username=coach_username).exists():
        coach = UserWithType.objects.create_user(
            username=coach_username,
            email="coach@example.com",
            password="coach123",
            user_type='Coach',
            is_verified_coach=True,
            first_name='Trial',
            last_name='Coach'
        )
        print(f"✅ Created coach: {coach_username}")
    else:
        coach = UserWithType.objects.get(username=coach_username)
    
    for _ in range(random.randint(2, 4)):  # Create 2-4 challenges
        template = random.choice(challenge_templates)
        
        # Random end date (1-8 weeks from now)
        end_date = timezone.now() + timedelta(weeks=random.randint(1, 8))
        
        challenge = Challenge.objects.create(
            coach=coach,
            title=template['title'],
            description=template['description'],
            challenge_type=template['challenge_type'],
            target_value=template['target_value'],
            unit=template['unit'],
            end_date=end_date,
            location='Virtual Challenge'
        )
        challenges_created += 1
        print(f"✅ Created challenge: {challenge.title}")
        
        # Enroll user in the challenge
        participant = ChallengeParticipant.objects.create(
            challenge=challenge,
            user=user,
            current_value=random.uniform(0, challenge.target_value * 0.2)  # 0-20% progress
        )
        participants_created += 1
        print(f"✅ Enrolled user in challenge: {challenge.title}")
    
    return challenges_created, participants_created

def create_forum_activity(user):
    """Create some forum activity for the user."""
    # Create a forum if it doesn't exist
    forum, created = Forum.objects.get_or_create(
        title='General Fitness Discussion',
        defaults={
            'description': 'General discussion about fitness and health',
            'created_by': user
        }
    )
    
    if created:
        print(f"✅ Created forum: {forum.title}")
    
    # Create a thread
    thread = Thread.objects.create(
        forum=forum,
        title='My Fitness Journey - Week 1',
        content='Hi everyone! I\'m starting my fitness journey and would love to share my progress and get some tips from the community.',
        author=user
    )
    print(f"✅ Created thread: {thread.title}")
    
    # Create a comment
    comment = Comment.objects.create(
        thread=thread,
        author=user,
        content='Thanks for all the support! I\'m really excited about this journey.'
    )
    print(f"✅ Created comment on thread: {thread.title}")
    
    return 1

def main():
    """Main function to create the trial user and populate with data."""
    print("🚀 Starting trial user creation...")
    
    try:
        # Create the user
        user = create_trial_user()
        
        # Create random goals
        print("\n📊 Creating random goals...")
        goals_count = create_random_goals(user)
        
        # Create random notifications
        print("\n🔔 Creating random notifications...")
        notifications_count = create_random_notifications(user)
        
        # Create random challenges
        print("\n🏆 Creating random challenges...")
        challenges_count, participants_count = create_random_challenges(user)
        
        # Create forum activity
        print("\n💬 Creating forum activity...")
        forum_activity = create_forum_activity(user)
        
        # Summary
        print("\n" + "="*50)
        print("✅ TRIAL USER CREATION COMPLETE!")
        print("="*50)
        print(f"👤 User: trial123456")
        print(f"🔑 Password: trial123456")
        print(f"📊 Goals created: {goals_count}")
        print(f"🔔 Notifications created: {notifications_count}")
        print(f"🏆 Challenges created: {challenges_count}")
        print(f"👥 Challenge participations: {participants_count}")
        print(f"💬 Forum activity: {forum_activity}")
        print("="*50)
        
    except Exception as e:
        print(f"❌ Error creating trial user: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
