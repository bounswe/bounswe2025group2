import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from api.models import (
    UserWithType, FitnessGoal, Notification, Profile, 
    Forum, Thread, Comment, Subcomment, Vote
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database population...'))
        
        # Create users with different roles
        self.create_users()
        
        # Create fitness goals for users
        self.create_fitness_goals()
        
        # Create notifications
        self.create_notifications()
        
        # Create forums and threads
        self.create_forums_and_threads()
        
        # Create comments, subcomments and votes
        self.create_comments_and_votes()
        
        self.stdout.write(self.style.SUCCESS('Database population completed successfully!'))
    
    def create_users(self):
        self.stdout.write('Creating users...')
        
        # Create regular users
        regular_users = [
            {'username': 'user1', 'email': 'user1@example.com', 'password': 'password123', 'user_type': 'User'},
            {'username': 'user2', 'email': 'user2@example.com', 'password': 'password123', 'user_type': 'User'},
            {'username': 'user3', 'email': 'user3@example.com', 'password': 'password123', 'user_type': 'User'},
            {'username': 'user4', 'email': 'user4@example.com', 'password': 'password123', 'user_type': 'User'},
        ]
        
        # Create coach users
        coach_users = [
            {'username': 'coach1', 'email': 'coach1@example.com', 'password': 'password123', 'user_type': 'Coach', 'is_verified': True},
            {'username': 'coach2', 'email': 'coach2@example.com', 'password': 'password123', 'user_type': 'Coach', 'is_verified': True},
        ]
        
        # Create regular users
        for user_data in regular_users:
            try:
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    user_type=user_data['user_type'],
                    is_active=True
                )
                
                # Update profile
                profile = Profile.objects.get(user=user)
                profile.bio = f"Bio for {user.username}"
                profile.location = random.choice(['New York', 'London', 'Tokyo', 'Paris', 'Berlin'])
                profile.birth_date = datetime.now().date() - timedelta(days=random.randint(7000, 15000))
                profile.save()
                
                self.stdout.write(f"Created user: {user.username}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating user {user_data['username']}: {e}"))
        
        # Create coach users
        for user_data in coach_users:
            try:
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    user_type=user_data['user_type'],
                    is_active=True,
                    is_verified_coach=user_data['is_verified']
                )
                
                # Update profile
                profile = Profile.objects.get(user=user)
                profile.bio = f"Professional coach specializing in fitness and nutrition. {user.username}"
                profile.location = random.choice(['Los Angeles', 'Miami', 'Chicago', 'Sydney', 'Toronto'])
                profile.birth_date = datetime.now().date() - timedelta(days=random.randint(9000, 15000))
                profile.save()
                
                self.stdout.write(f"Created coach: {user.username}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating coach {user_data['username']}: {e}"))
    
    def create_fitness_goals(self):
        self.stdout.write('Creating fitness goals...')
        
        # Get all users and coaches
        users = User.objects.filter(user_type='User')
        coaches = User.objects.filter(user_type='Coach')
        
        goal_types = [
            'WALKING_RUNNING', 'WORKOUT', 'CYCLING', 'SWIMMING', 'SPORTS'
        ]
        
        goal_titles = [
            'Run 5K', 'Complete 30 workouts', 'Cycle 100km', 'Swim 20 laps', 
            'Play basketball 10 times', 'Walk 10,000 steps daily', 'Lift weights 3x a week',
            'Yoga for 30 days', 'Hike 5 mountains', 'Train for marathon'
        ]
        
        goal_descriptions = [
            'Improve cardiovascular health',
            'Build muscle and strength',
            'Increase endurance',
            'Lose weight and improve fitness',
            'Maintain active lifestyle',
            'Prepare for upcoming competition',
            'Recover from injury with gentle exercise',
            'Improve flexibility and balance'
        ]
        
        goal_units = [
            'km', 'minutes', 'sessions', 'laps', 'games', 'steps', 'workouts'
        ]
        
        goal_statuses = ['ACTIVE', 'COMPLETED', 'INACTIVE', 'RESTARTED']
        
        # Create 2-3 goals for each user
        for user in users:
            num_goals = random.randint(2, 3)
            for _ in range(num_goals):
                try:
                    goal_type = random.choice(goal_types)
                    title = random.choice(goal_titles)
                    description = random.choice(goal_descriptions)
                    target_value = random.randint(10, 100)
                    current_value = random.randint(0, int(target_value * 0.8))
                    unit = random.choice(goal_units)
                    status = random.choice(goal_statuses)
                    
                    # 50% chance of having a mentor
                    mentor = random.choice(coaches) if random.random() > 0.5 else None
                    
                    # Create start and target dates
                    start_date = timezone.now() - timedelta(days=random.randint(1, 30))
                    target_date = start_date + timedelta(days=random.randint(30, 90))
                    
                    goal = FitnessGoal.objects.create(
                        user=user,
                        mentor=mentor,
                        goal_type=goal_type,
                        title=title,
                        description=description,
                        target_value=target_value,
                        current_value=current_value,
                        unit=unit,
                        target_date=target_date,
                        status=status
                    )
                    
                    self.stdout.write(f"Created goal '{title}' for {user.username}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating goal for {user.username}: {e}"))
    
    def create_notifications(self):
        self.stdout.write('Creating notifications...')
        
        users = User.objects.all()
        notification_types = [
            'LIKE', 'COMMENT', 'TAG', 'REPLY', 'CHALLENGE', 'PROGRESS', 
            'ACHIEVEMENT', 'BADGE', 'GOAL', 'FEEDBACK', 'SYSTEM', 'NEW_MESSAGE', 'GOAL_INACTIVE'
        ]
        
        notification_titles = [
            'New like on your post', 'Someone commented on your thread', 
            'You were tagged in a post', 'New reply to your comment',
            'Challenge invitation', 'Goal progress update',
            'Achievement unlocked!', 'New badge earned',
            'New goal from your mentor', 'Feedback on your progress',
            'System maintenance notification', 'New message received',
            'Goal inactive warning'
        ]
        
        # Create 3-5 notifications for each user
        for recipient in users:
            num_notifications = random.randint(3, 5)
            for _ in range(num_notifications):
                try:
                    # 70% chance of having a sender
                    sender = random.choice([u for u in users if u != recipient]) if random.random() > 0.3 else None
                    
                    notification_type = random.choice(notification_types)
                    title_index = min(notification_types.index(notification_type), len(notification_titles) - 1)
                    title = notification_titles[title_index]
                    
                    message = f"This is a sample notification message for {notification_type.lower()}"
                    is_read = random.choice([True, False])
                    
                    # Create notification
                    notification = Notification.objects.create(
                        recipient=recipient,
                        sender=sender,
                        notification_type=notification_type,
                        title=title,
                        message=message,
                        is_read=is_read,
                        is_email_sent=is_read  # If read, email was sent
                    )
                    
                    self.stdout.write(f"Created notification '{title}' for {recipient.username}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating notification for {recipient.username}: {e}"))
    
    def create_forums_and_threads(self):
        self.stdout.write('Creating forums and threads...')
        
        # Create forums
        forum_data = [
            {'title': 'General Discussion', 'description': 'Talk about anything fitness related', 'order': 1},
            {'title': 'Nutrition', 'description': 'Discuss diet plans and nutrition tips', 'order': 2},
            {'title': 'Workout Plans', 'description': 'Share and discuss workout routines', 'order': 3},
            {'title': 'Success Stories', 'description': 'Share your fitness journey and achievements', 'order': 4},
            {'title': 'Equipment & Gear', 'description': 'Discuss fitness equipment and gear', 'order': 5},
        ]
        
        forums = []
        users = list(User.objects.all())
        
        # Create forums
        for forum in forum_data:
            try:
                created_forum = Forum.objects.create(
                    title=forum['title'],
                    description=forum['description'],
                    created_by=random.choice(users),
                    order=forum['order'],
                    is_active=True
                )
                forums.append(created_forum)
                self.stdout.write(f"Created forum: {created_forum.title}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating forum {forum['title']}: {e}"))
        
        # Create threads in each forum
        thread_titles = [
            'Getting started with fitness', 'Best protein supplements?',
            'How to stay motivated', 'My weight loss journey',
            'Recommended running shoes', 'Dealing with muscle soreness',
            'Meal prep ideas for the week', 'Home workout equipment recommendations',
            'Training for my first marathon', 'How to improve flexibility'
        ]
        
        for forum in forums:
            # Create 2-4 threads per forum
            num_threads = random.randint(2, 4)
            for i in range(num_threads):
                try:
                    title = random.choice(thread_titles)
                    content = f"This is a sample thread content for {title}. It contains information relevant to the topic."
                    author = random.choice(users)
                    is_pinned = random.random() < 0.2  # 20% chance of being pinned
                    is_locked = random.random() < 0.1  # 10% chance of being locked
                    view_count = random.randint(5, 100)
                    like_count = random.randint(0, 20)
                    
                    thread = Thread.objects.create(
                        forum=forum,
                        title=f"{title} - {i+1}",
                        content=content,
                        author=author,
                        is_pinned=is_pinned,
                        is_locked=is_locked,
                        view_count=view_count,
                        like_count=like_count
                    )
                    
                    self.stdout.write(f"Created thread: {thread.title} in {forum.title}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating thread in {forum.title}: {e}"))
    
    def create_comments_and_votes(self):
        self.stdout.write('Creating comments, subcomments, and votes...')
        
        users = list(User.objects.all())
        threads = list(Thread.objects.all())
        
        # Sample comment content
        comment_contents = [
            "Great post! Thanks for sharing.",
            "I've been trying this approach and it works well.",
            "Could you provide more details about this?",
            "I disagree with some points, but overall good information.",
            "This has been very helpful for my training.",
            "I had a similar experience with this.",
            "Looking forward to more posts like this!",
            "Has anyone else tried this method?",
            "What are your thoughts on alternative approaches?",
            "This is exactly what I needed to know."
        ]
        
        # Create comments for each thread
        for thread in threads:
            # Create 2-5 comments per thread
            num_comments = random.randint(2, 5)
            comments = []
            
            for _ in range(num_comments):
                try:
                    author = random.choice(users)
                    content = random.choice(comment_contents)
                    
                    comment = Comment.objects.create(
                        thread=thread,
                        author=author,
                        content=content
                    )
                    comments.append(comment)
                    
                    # Update thread comment count
                    thread.comment_count += 1
                    thread.save(update_fields=['comment_count'])
                    
                    self.stdout.write(f"Created comment in thread: {thread.title}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating comment in thread {thread.title}: {e}"))
            
            # Create subcomments for some comments
            for comment in comments:
                # 50% chance of having subcomments
                if random.random() > 0.5:
                    # Create 1-3 subcomments
                    num_subcomments = random.randint(1, 3)
                    
                    for _ in range(num_subcomments):
                        try:
                            author = random.choice(users)
                            content = f"Reply to comment: {random.choice(comment_contents)}"
                            
                            subcomment = Subcomment.objects.create(
                                comment=comment,
                                author=author,
                                content=content
                            )
                            
                            # Update comment subcomment count
                            comment.subcomment_count += 1
                            comment.save(update_fields=['subcomment_count'])
                            
                            self.stdout.write(f"Created subcomment for comment in thread: {thread.title}")
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error creating subcomment: {e}"))
            
            # Create votes for thread, comments, and subcomments
            self.create_votes(thread, comments)
    
    def create_votes(self, thread, comments):
        users = list(User.objects.all())
        vote_types = ['UPVOTE', 'DOWNVOTE']
        
        # Create votes for thread
        for _ in range(random.randint(3, 8)):
            try:
                user = random.choice(users)
                vote_type = random.choice(vote_types)
                
                # Get content type for thread
                content_type = ContentType.objects.get_for_model(Thread)
                
                # Create vote
                vote = Vote.objects.create(
                    user=user,
                    content_type=content_type,
                    object_id=thread.id,
                    vote_type=vote_type
                )
                
                # Update thread like count if upvote
                if vote_type == 'UPVOTE':
                    thread.like_count += 1
                    thread.save(update_fields=['like_count'])
                
                self.stdout.write(f"Created {vote_type} for thread: {thread.title}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating vote for thread: {e}"))
        
        # Create votes for comments
        for comment in comments:
            # 70% chance of having votes
            if random.random() > 0.3:
                for _ in range(random.randint(1, 5)):
                    try:
                        user = random.choice(users)
                        vote_type = random.choice(vote_types)
                        
                        # Get content type for comment
                        content_type = ContentType.objects.get_for_model(Comment)
                        
                        # Create vote
                        vote = Vote.objects.create(
                            user=user,
                            content_type=content_type,
                            object_id=comment.id,
                            vote_type=vote_type
                        )
                        
                        # Update comment like count if upvote
                        if vote_type == 'UPVOTE':
                            comment.like_count += 1
                            comment.save(update_fields=['like_count'])
                        
                        self.stdout.write(f"Created {vote_type} for comment in thread: {thread.title}")
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error creating vote for comment: {e}"))
                
                # Create votes for subcomments
                for subcomment in comment.subcomments.all():
                    # 50% chance of having votes
                    if random.random() > 0.5:
                        for _ in range(random.randint(1, 3)):
                            try:
                                user = random.choice(users)
                                vote_type = random.choice(vote_types)
                                
                                # Get content type for subcomment
                                content_type = ContentType.objects.get_for_model(Subcomment)
                                
                                # Create vote
                                vote = Vote.objects.create(
                                    user=user,
                                    content_type=content_type,
                                    object_id=subcomment.id,
                                    vote_type=vote_type
                                )
                                
                                # Update subcomment like count if upvote
                                if vote_type == 'UPVOTE':
                                    subcomment.like_count += 1
                                    subcomment.save(update_fields=['like_count'])
                                
                                self.stdout.write(f"Created {vote_type} for subcomment")
                            except Exception as e:
                                self.stdout.write(self.style.ERROR(f"Error creating vote for subcomment: {e}"))