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
    
        
        # Create forums and threads
        self.create_forums_and_threads()
        
        # Create comments, subcomments and votes
        self.create_comments_and_votes()
        
        self.stdout.write(self.style.SUCCESS('Database population completed successfully!'))
    
    def create_users(self):

        self.stdout.write('Creating superuser...')
        
        # Create a superuser
        try:
            if not User.objects.filter(username='admin').exists():
                superuser = User.objects.create_superuser(
                    username='berkaybgk',
                    email='berkay@gmail.com',
                    password='password123',
                    user_type='User',  
                )
                superuser.is_active = True
                superuser.is_verified_coach = False  
                superuser.save()
                self.stdout.write(self.style.SUCCESS("Created superuser: berkaybgk"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating superuser: {e}"))
        
        self.stdout.write('Creating users...')
        
        # Create regular users
        regular_users = [
            {'username': 'erenkarayilan', 'email': 'eren.karayilan@example.com', 'password': 'erenkarayilan123', 'user_type': 'User'},
            {'username': 'rambookan', 'email': 'rambo.okan@example.com', 'password': 'rambookan123', 'user_type': 'User'},
            {'username': 'konsoloyun', 'email': 'konsol.oyun@example.com', 'password': 'konsoloyun123', 'user_type': 'User'},
            {'username': 'mertcanbahar', 'email': 'mertcan.bahar@example.com', 'password': 'mertcanbahar123', 'user_type': 'User'},
        ]
        
        # Create coach users
        coach_users = [
            {'username': 'testotaylan', 'email': 'testo.taylan@example.com', 'password': 'testotaylan123', 'user_type': 'Coach', 'is_verified': True},
            {'username': 'harun1453', 'email': 'harun.1453@example.com', 'password': 'harun1453123', 'user_type': 'Coach', 'is_verified': True},
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
                
                # Check if profile exists, create if it doesn't
                profile, created = Profile.objects.get_or_create(user=user)
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
                
                # Check if profile exists, create if it doesn't
                profile, created = Profile.objects.get_or_create(user=user)
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
        self.stdout.write('Creating comments, subcomments and votes...')
        
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
        
        # Create comments for threads
        for thread in threads:
            num_comments = random.randint(1, 5)
            for _ in range(num_comments):
                try:
                    author = random.choice(users)
                    content = random.choice(comment_contents)
                    comment = Comment.objects.create(
                        thread=thread,
                        author=author,
                        content=content
                    )

                    # Update thread comment count
                    thread.comment_count += 1
                    thread.save(update_fields=['comment_count'])
                    
                    # Create votes for comment (ensure unique combinations)
                    voters = random.sample(users, min(3, len(users)))  # Get unique random users
                    for voter in voters:
                        try:
                            Vote.objects.create(
                                user=voter,
                                content_type=ContentType.objects.get_for_model(Comment),
                                object_id=comment.id,
                                vote_type=random.choice(['UPVOTE', 'DOWNVOTE'])
                            )
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error creating vote: {e}"))
                    
                    # Create subcomments
                    num_subcomments = random.randint(0, 3)
                    for _ in range(num_subcomments):
                        try:
                            subcomment_author = random.choice(users)
                            subcomment_content = random.choice(comment_contents)
                            subcomment = Subcomment.objects.create(
                                comment=comment,
                                author=subcomment_author,
                                content=subcomment_content
                            )

                            # Update comment subcomment count
                            comment.subcomment_count += 1
                            comment.save(update_fields=['subcomment_count'])
                            
                            # Create votes for subcomment (ensure unique combinations)
                            subcomment_voters = random.sample(users, min(2, len(users)))  # Get unique random users
                            for voter in subcomment_voters:
                                try:
                                    Vote.objects.create(
                                        user=voter,
                                        content_type=ContentType.objects.get_for_model(Subcomment),
                                        object_id=subcomment.id,
                                        vote_type=random.choice(['UPVOTE', 'DOWNVOTE'])
                                    )
                                except Exception as e:
                                    self.stdout.write(self.style.ERROR(f"Error creating vote: {e}"))
                                    
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error creating subcomment: {e}"))
                            
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating comment: {e}"))
        
        # Create votes for threads (ensure unique combinations)
        for thread in threads:
            voters = random.sample(users, min(4, len(users)))  # Get unique random users
            for voter in voters:
                try:
                    Vote.objects.create(
                        user=voter,
                        content_type=ContentType.objects.get_for_model(Thread),
                        object_id=thread.id,
                        vote_type=random.choice(['UPVOTE', 'DOWNVOTE'])
                    )
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating vote: {e}"))
