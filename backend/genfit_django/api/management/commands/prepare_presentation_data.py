import random
from datetime import datetime, timedelta, date
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from api.models import (
    UserWithType, FitnessGoal, Notification, Profile,
    Forum, Thread, Comment, Subcomment, Vote,
    Challenge, ChallengeParticipant
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Prepares realistic mock data for presentation demonstration'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting presentation data preparation...'))
        
        # Create users with realistic profiles and login streaks
        self.create_realistic_users()
        
        # Create challenges
        self.create_challenges()
        
        # Create fitness goals for users
        self.create_fitness_goals()
        
        # Create forums with realistic content
        self.create_general_forums()
        
        # Create threads, comments, and votes with natural content
        self.create_forum_content()
        
        self.stdout.write(self.style.SUCCESS('✅ Presentation data preparation completed successfully!'))
    
    def create_realistic_users(self):
        """Create users with filled profiles and realistic login streaks"""
        self.stdout.write('Creating realistic users with activity...')
        
        # Define realistic user data
        user_data = [
            {
                'username': 'betterselcuk',
                'email': 'alex.johnson@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Selçuk',
                    'surname': 'Kartal',
                    'bio': 'Marathon runner and fitness enthusiast. Love outdoor activities and helping others achieve their goals! 🏃‍♂️',
                    'location': 'İstanbul, Türkiye',
                    'birth_date': date(1992, 3, 15),
                    'preferred_sports': 'Running, Swimming'
                },
                'login_streak': {
                    'current_streak': 12,
                    'longest_streak': 28,
                    'total_login_days': 145,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'sarahwellness88',
                'email': 'sarah.martinez@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Sarah',
                    'surname': 'Martinez',
                    'bio': 'Yoga instructor & wellness coach. Believer in mindful movement and balanced living 🧘‍♀️✨',
                    'location': 'Austin, TX',
                    'birth_date': date(1988, 7, 22),
                    'preferred_sports': 'Yoga, Pilates, Dance'
                },
                'login_streak': {
                    'current_streak': 7,
                    'longest_streak': 45,
                    'total_login_days': 203,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'mikegains95',
                'email': 'mike.chen@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Mike',
                    'surname': 'Chen',
                    'bio': 'Powerlifter and nutrition nerd. Always looking to optimize my training and diet 💪',
                    'location': 'New York, NY',
                    'birth_date': date(1995, 11, 8),
                    'preferred_sports': 'Weightlifting, CrossFit'
                },
                'login_streak': {
                    'current_streak': 21,
                    'longest_streak': 21,
                    'total_login_days': 78,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'emmaactive90',
                'email': 'emma.davis@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Emma',
                    'surname': 'Davis',
                    'bio': 'Former college athlete now coaching high school soccer. Fitness is life! ⚽️🏋️‍♀️',
                    'location': 'Seattle, WA',
                    'birth_date': date(1990, 5, 30),
                    'preferred_sports': 'Soccer, Running, HIIT'
                },
                'login_streak': {
                    'current_streak': 5,
                    'longest_streak': 62,
                    'total_login_days': 287,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'jamescyclist87',
                'email': 'james.wilson@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'James',
                    'surname': 'Wilson',
                    'bio': 'Cycling enthusiast and weekend warrior. Love exploring new trails! 🚴‍♂️🌲',
                    'location': 'Portland, OR',
                    'birth_date': date(1987, 9, 12),
                    'preferred_sports': 'Cycling, Mountain Biking, Hiking'
                },
                'login_streak': {
                    'current_streak': 3,
                    'longest_streak': 34,
                    'total_login_days': 156,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'lisaswimmer93',
                'email': 'lisa.anderson@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Lisa',
                    'surname': 'Anderson',
                    'bio': 'Competitive swimmer turned triathlete. Training for my first Ironman! 🏊‍♀️🚴‍♀️🏃‍♀️',
                    'location': 'Miami, FL',
                    'birth_date': date(1993, 2, 18),
                    'preferred_sports': 'Swimming, Triathlon, Running'
                },
                'login_streak': {
                    'current_streak': 15,
                    'longest_streak': 56,
                    'total_login_days': 198,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'davidcrossfit91',
                'email': 'david.taylor@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'David',
                    'surname': 'Taylor',
                    'bio': 'CrossFit athlete and functional fitness coach. Embrace the grind! 🔥',
                    'location': 'Denver, CO',
                    'birth_date': date(1991, 8, 25),
                    'preferred_sports': 'CrossFit, Olympic Weightlifting'
                },
                'login_streak': {
                    'current_streak': 9,
                    'longest_streak': 41,
                    'total_login_days': 167,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'rachelrunner89',
                'email': 'rachel.brown@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Rachel',
                    'surname': 'Brown',
                    'bio': 'Ultra runner and trail enthusiast. The mountains are calling! 🏔️👟',
                    'location': 'Boulder, CO',
                    'birth_date': date(1989, 4, 7),
                    'preferred_sports': 'Trail Running, Hiking, Rock Climbing'
                },
                'login_streak': {
                    'current_streak': 18,
                    'longest_streak': 73,
                    'total_login_days': 312,
                    'last_login_date': date.today()
                }
            },
            # Less active users below
            {
                'username': 'chrisnewbie96',
                'email': 'chris.parker@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Chris',
                    'surname': 'Parker',
                    'bio': 'Just starting my fitness journey. Looking to build healthy habits!',
                    'location': 'Phoenix, AZ',
                    'birth_date': date(1996, 6, 10),
                    'preferred_sports': 'Walking, Light Cardio'
                },
                'login_streak': {
                    'current_streak': 2,
                    'longest_streak': 5,
                    'total_login_days': 12,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'jencasual94',
                'email': 'jennifer.moore@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Jennifer',
                    'surname': 'Moore',
                    'bio': 'Weekend warrior trying to stay active. Dog mom and occasional gym-goer.',
                    'location': 'Nashville, TN',
                    'birth_date': date(1994, 1, 28),
                    'preferred_sports': 'Walking, Hiking'
                },
                'login_streak': {
                    'current_streak': 1,
                    'longest_streak': 8,
                    'total_login_days': 23,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'tombeginner97',
                'email': 'thomas.kim@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Thomas',
                    'surname': 'Kim',
                    'bio': 'Software developer looking to balance desk life with fitness.',
                    'location': 'Seattle, WA',
                    'birth_date': date(1997, 9, 3),
                    'preferred_sports': 'Gym, Basketball'
                },
                'login_streak': {
                    'current_streak': 3,
                    'longest_streak': 9,
                    'total_login_days': 18,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'ninaexplorer98',
                'email': 'nina.patel@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Nina',
                    'surname': 'Patel',
                    'bio': 'Exploring different workout styles to find what I love.',
                    'location': 'Boston, MA',
                    'birth_date': date(1998, 11, 15),
                    'preferred_sports': 'Yoga, Dance'
                },
                'login_streak': {
                    'current_streak': 1,
                    'longest_streak': 6,
                    'total_login_days': 15,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'kevinlurker95',
                'email': 'kevin.nguyen@example.com',
                'password': 'password123',
                'user_type': 'User',
                'profile': {
                    'name': 'Kevin',
                    'surname': 'Nguyen',
                    'bio': 'Mostly here to learn and get motivated by others.',
                    'location': 'San Jose, CA',
                    'birth_date': date(1995, 3, 22),
                    'preferred_sports': 'Running, Swimming'
                },
                'login_streak': {
                    'current_streak': 0,
                    'longest_streak': 4,
                    'total_login_days': 8,
                    'last_login_date': date.today() - timedelta(days=3)
                }
            }
        ]
        
        # Coach users
        coach_data = [
            {
                'username': 'tahayalcin',
                'email': 'jessica.coach@example.com',
                'password': 'password123',
                'user_type': 'Coach',
                'is_verified': True,
                'profile': {
                    'name': 'Taha',
                    'surname': 'Yalçın',
                    'bio': 'Certified personal trainer with 10+ years experience. Specializing in strength training and nutrition coaching. Let\'s reach your goals together! 💪',
                    'location': 'İstanbul, Türkiye',
                    'birth_date': date(1985, 6, 14),
                    'preferred_sports': 'Strength Training, Cycling, Weightlifting'
                },
                'login_streak': {
                    'current_streak': 42,
                    'longest_streak': 89,
                    'total_login_days': 456,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'marcuscoach83',
                'email': 'marcus.coach@example.com',
                'password': 'password123',
                'user_type': 'Coach',
                'is_verified': True,
                'profile': {
                    'name': 'Marcus',
                    'surname': 'Rodriguez',
                    'bio': 'Former Olympic swimmer, now helping others achieve their fitness dreams. Endurance training specialist 🏊‍♂️🏃‍♂️',
                    'location': 'Chicago, IL',
                    'birth_date': date(1983, 10, 3),
                    'preferred_sports': 'Swimming, Running, Cycling'
                },
                'login_streak': {
                    'current_streak': 31,
                    'longest_streak': 104,
                    'total_login_days': 523,
                    'last_login_date': date.today()
                }
            },
            {
                'username': 'amandacoach86',
                'email': 'amanda.coach@example.com',
                'password': 'password123',
                'user_type': 'Coach',
                'is_verified': True,
                'profile': {
                    'name': 'Amanda',
                    'surname': 'Lee',
                    'bio': 'Yoga & mindfulness coach. Helping you find balance in body and mind 🧘‍♀️✨',
                    'location': 'San Diego, CA',
                    'birth_date': date(1986, 12, 20),
                    'preferred_sports': 'Yoga, Meditation, Pilates'
                },
                'login_streak': {
                    'current_streak': 26,
                    'longest_streak': 67,
                    'total_login_days': 389,
                    'last_login_date': date.today()
                }
            }
        ]
        
        # Create regular users
        for data in user_data:
            try:
                user = User.objects.create_user(
                    username=data['username'],
                    email=data['email'],
                    password=data['password'],
                    user_type=data['user_type'],
                    is_active=True
                )
                
                # Update login streak information
                user.current_streak = data['login_streak']['current_streak']
                user.longest_streak = data['login_streak']['longest_streak']
                user.total_login_days = data['login_streak']['total_login_days']
                user.last_login_date = data['login_streak']['last_login_date']
                user.save()
                
                # Update profile
                profile = user.profile
                profile.name = data['profile']['name']
                profile.surname = data['profile']['surname']
                profile.bio = data['profile']['bio']
                profile.location = data['profile']['location']
                profile.birth_date = data['profile']['birth_date']
                profile.preferred_sports = data['profile']['preferred_sports']
                profile.save()
                
                self.stdout.write(f"✓ Created user: {user.username} (Streak: {user.current_streak} days)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating user {data['username']}: {e}"))
        
        # Create coach users
        for data in coach_data:
            try:
                user = User.objects.create_user(
                    username=data['username'],
                    email=data['email'],
                    password=data['password'],
                    user_type=data['user_type'],
                    is_active=True,
                    is_verified_coach=data['is_verified']
                )
                
                # Update login streak information
                user.current_streak = data['login_streak']['current_streak']
                user.longest_streak = data['login_streak']['longest_streak']
                user.total_login_days = data['login_streak']['total_login_days']
                user.last_login_date = data['login_streak']['last_login_date']
                user.save()
                
                # Update profile
                profile = user.profile
                profile.name = data['profile']['name']
                profile.surname = data['profile']['surname']
                profile.bio = data['profile']['bio']
                profile.location = data['profile']['location']
                profile.birth_date = data['profile']['birth_date']
                profile.preferred_sports = data['profile']['preferred_sports']
                profile.save()
                
                self.stdout.write(f"✓ Created coach: {user.username} (Streak: {user.current_streak} days)")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating coach {data['username']}: {e}"))
    
    def create_challenges(self):
        """Create diverse challenges"""
        self.stdout.write('Creating challenges...')
        
        coaches = User.objects.filter(user_type='Coach', is_verified_coach=True)
        if not coaches.exists():
            self.stdout.write(self.style.WARNING('No coaches found. Skipping challenge creation.'))
            return
        
        challenge_data = [
            {
                'title': '30-Day Running Challenge',
                'description': 'Build your running habit! Run at least 3 miles every other day for 30 days. Perfect for beginners and experienced runners looking to maintain consistency.',
                'challenge_type': 'WALKING_RUNNING',
                'difficulty_level': 'Beginner',
                'target_value': 45.0,
                'unit': 'miles',
                'location': 'Golden Gate Park, San Francisco',
                'latitude': 37.7694,
                'longitude': -122.4862,
                'start_offset': -15,
                'duration_days': 30,
                'min_age': 16,
                'max_age': None
            },
            {
                'title': 'Summer Strength Challenge',
                'description': 'Get stronger this summer! Complete 20 strength training sessions with progressive overload. Focus on compound movements and proper form.',
                'challenge_type': 'WORKOUT',
                'difficulty_level': 'Intermediate',
                'target_value': 20.0,
                'unit': 'sessions',
                'location': 'CrossFit Downtown, Los Angeles',
                'latitude': 34.0522,
                'longitude': -118.2437,
                'start_offset': -10,
                'duration_days': 45,
                'min_age': 18,
                'max_age': 65
            },
            {
                'title': 'Century Cycling Challenge',
                'description': 'Ride 100 miles over the course of the month! Break it up however you like - perfect for building endurance and exploring new routes.',
                'challenge_type': 'CYCLING',
                'difficulty_level': 'Intermediate',
                'target_value': 100.0,
                'unit': 'miles',
                'location': 'Lakefront Trail, Chicago',
                'latitude': 41.8781,
                'longitude': -87.6298,
                'start_offset': -20,
                'duration_days': 30,
                'min_age': 14,
                'max_age': None
            },
            {
                'title': 'Swim to Success',
                'description': 'Swim 10,000 meters throughout the challenge period. Improve your technique and cardiovascular fitness in the pool!',
                'challenge_type': 'SWIMMING',
                'difficulty_level': 'Beginner',
                'target_value': 10000.0,
                'unit': 'meters',
                'location': 'Miami Beach Aquatic Center',
                'latitude': 25.7617,
                'longitude': -80.1918,
                'start_offset': -12,
                'duration_days': 35,
                'min_age': 12,
                'max_age': None
            },
            {
                'title': 'Morning Yoga Series',
                'description': 'Start your day with intention! Join us for 21 days of morning yoga sessions. All levels welcome.',
                'challenge_type': 'WORKOUT',
                'difficulty_level': 'Beginner',
                'target_value': 21.0,
                'unit': 'sessions',
                'location': 'Sunset Yoga Studio, San Diego',
                'latitude': 32.7157,
                'longitude': -117.1611,
                'start_offset': -7,
                'duration_days': 21,
                'min_age': None,
                'max_age': None
            },
            {
                'title': 'Trail Running Adventure',
                'description': 'Conquer 50 miles of trails! Experience the beauty of nature while building strength and endurance on varied terrain.',
                'challenge_type': 'WALKING_RUNNING',
                'difficulty_level': 'Advanced',
                'target_value': 50.0,
                'unit': 'miles',
                'location': 'Boulder Trail System, CO',
                'latitude': 40.0150,
                'longitude': -105.2705,
                'start_offset': -18,
                'duration_days': 40,
                'min_age': 18,
                'max_age': 70
            }
        ]
        
        created_challenges = []
        for i, challenge_info in enumerate(challenge_data):
            try:
                coach = coaches[i % len(coaches)]
                
                start_date = timezone.now() + timedelta(days=challenge_info['start_offset'])
                end_date = start_date + timedelta(days=challenge_info['duration_days'])
                
                challenge = Challenge.objects.create(
                    coach=coach,
                    title=challenge_info['title'],
                    description=challenge_info['description'],
                    challenge_type=challenge_info['challenge_type'],
                    difficulty_level=challenge_info['difficulty_level'],
                    target_value=challenge_info['target_value'],
                    unit=challenge_info['unit'],
                    location=challenge_info['location'],
                    latitude=challenge_info['latitude'],
                    longitude=challenge_info['longitude'],
                    start_date=start_date,
                    end_date=end_date,
                    min_age=challenge_info['min_age'],
                    max_age=challenge_info['max_age']
                )
                
                created_challenges.append(challenge)
                self.stdout.write(f"✓ Created challenge: {challenge.title}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating challenge: {e}"))
        
        # Add participants to challenges
        self.add_challenge_participants(created_challenges)
    
    def add_challenge_participants(self, challenges):
        """Add users to challenges with realistic progress"""
        self.stdout.write('Adding participants to challenges...')
        
        users = list(User.objects.filter(user_type='User'))
        
        # Identify active vs less active users based on login streak
        active_users = [u for u in users if u.current_streak >= 5]
        less_active_users = [u for u in users if u.current_streak < 5]
        
        for challenge in challenges:
            # 4-7 participants per challenge, mostly active users
            num_active = random.randint(3, 6)
            num_less_active = random.randint(0, 1)  # 0-1 less active users per challenge
            
            participants = []
            if active_users:
                participants.extend(random.sample(active_users, min(num_active, len(active_users))))
            if less_active_users and num_less_active > 0:
                participants.extend(random.sample(less_active_users, min(num_less_active, len(less_active_users))))
            
            for user in participants:
                try:
                    # Check age restrictions
                    if hasattr(user, 'profile') and user.profile.birth_date:
                        user_age = (date.today() - user.profile.birth_date).days // 365
                        if challenge.min_age and user_age < challenge.min_age:
                            continue
                        if challenge.max_age and user_age > challenge.max_age:
                            continue
                    
                    # Realistic progress - some ahead, some behind
                    progress_options = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1.0]
                    progress_multiplier = random.choice(progress_options)
                    current_value = challenge.target_value * progress_multiplier
                    
                    # If completed, set finish date
                    finish_date = None
                    if progress_multiplier >= 1.0:
                        finish_date = timezone.now() - timedelta(days=random.randint(1, 5))
                    
                    ChallengeParticipant.objects.create(
                        challenge=challenge,
                        user=user,
                        current_value=current_value,
                        finish_date=finish_date
                    )
                    
                except Exception as e:
                    # Skip if already exists
                    pass
    
    def create_fitness_goals(self):
        """Create fitness goals for users"""
        self.stdout.write('Creating fitness goals...')
        
        users = User.objects.filter(user_type='User')
        coaches = list(User.objects.filter(user_type='Coach', is_verified_coach=True))
        
        # Realistic goal templates
        goal_templates = [
            {
                'goal_type': 'WALKING_RUNNING',
                'title': 'Run a 5K',
                'description': 'Training to complete my first 5K race without stopping',
                'target_value': 5.0,
                'unit': 'km',
                'duration_days': 60
            },
            {
                'goal_type': 'WALKING_RUNNING',
                'title': 'Half Marathon Training',
                'description': 'Building endurance to complete a half marathon',
                'target_value': 21.1,
                'unit': 'km',
                'duration_days': 90
            },
            {
                'goal_type': 'WORKOUT',
                'title': 'Strength Training Consistency',
                'description': 'Complete 3 strength workouts per week for 8 weeks',
                'target_value': 24.0,
                'unit': 'sessions',
                'duration_days': 56
            },
            {
                'goal_type': 'CYCLING',
                'title': 'Cycle 200km This Month',
                'description': 'Increase my cycling distance and endurance',
                'target_value': 200.0,
                'unit': 'km',
                'duration_days': 30
            },
            {
                'goal_type': 'SWIMMING',
                'title': 'Swim 5000m',
                'description': 'Improve swimming technique and build endurance',
                'target_value': 5000.0,
                'unit': 'meters',
                'duration_days': 45
            },
            {
                'goal_type': 'WORKOUT',
                'title': 'Daily Yoga Practice',
                'description': '30 days of consistent yoga for flexibility and mindfulness',
                'target_value': 30.0,
                'unit': 'sessions',
                'duration_days': 30
            },
            {
                'goal_type': 'SPORTS',
                'title': 'Play Basketball Weekly',
                'description': 'Join pickup games twice a week for 6 weeks',
                'target_value': 12.0,
                'unit': 'games',
                'duration_days': 42
            },
            {
                'goal_type': 'WALKING_RUNNING',
                'title': '10,000 Steps Daily',
                'description': 'Maintain an active lifestyle with daily step goal',
                'target_value': 300000.0,
                'unit': 'steps',
                'duration_days': 30
            }
        ]
        
        for user in users:
            # Active users get 2-3 goals, less active users get 0-1 goals
            if user.current_streak >= 5:
                num_goals = random.randint(2, 3)
            else:
                num_goals = random.randint(0, 1)
            
            if num_goals == 0:
                continue
                
            user_goals = random.sample(goal_templates, num_goals)
            
            for goal_template in user_goals:
                try:
                    # Some goals have mentors
                    mentor = random.choice(coaches) if coaches and random.random() > 0.4 else None
                    
                    # Randomize status
                    status_options = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'COMPLETED', 'INACTIVE']
                    status = random.choice(status_options)
                    
                    # Calculate dates
                    if status == 'COMPLETED':
                        start_date = timezone.now() - timedelta(days=random.randint(30, 90))
                        target_date = start_date + timedelta(days=goal_template['duration_days'])
                        current_value = goal_template['target_value']
                    elif status == 'INACTIVE':
                        start_date = timezone.now() - timedelta(days=random.randint(60, 120))
                        target_date = start_date + timedelta(days=goal_template['duration_days'])
                        current_value = goal_template['target_value'] * random.uniform(0.1, 0.4)
                    else:  # ACTIVE
                        start_date = timezone.now() - timedelta(days=random.randint(5, 30))
                        target_date = start_date + timedelta(days=goal_template['duration_days'])
                        current_value = goal_template['target_value'] * random.uniform(0.3, 0.85)
                    
                    FitnessGoal.objects.create(
                        user=user,
                        mentor=mentor,
                        goal_type=goal_template['goal_type'],
                        title=goal_template['title'],
                        description=goal_template['description'],
                        target_value=goal_template['target_value'],
                        current_value=current_value,
                        unit=goal_template['unit'],
                        target_date=target_date,
                        status=status
                    )
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating goal for {user.username}: {e}"))
        
        self.stdout.write(f"✓ Created fitness goals for all users")
    
    def create_general_forums(self):
        """Create general fitness forums alongside inclusive forums"""
        self.stdout.write('Creating general forums...')
        
        users = list(User.objects.all())
        if not users:
            self.stdout.write(self.style.ERROR('No users found. Cannot create forums.'))
            return
        
        # General fitness forums that will be permanent
        general_forums = [
            {
                'title': 'Getting Started',
                'description': 'New to fitness? Start here! Ask questions, share your journey, and get support from the community.',
                'order': 1
            },
            {
                'title': 'Workout Discussion',
                'description': 'Share workout routines, training tips, and discuss effective exercise techniques for all fitness levels.',
                'order': 2
            },
            {
                'title': 'Nutrition & Diet',
                'description': 'Discuss meal planning, nutrition advice, supplements, and healthy eating habits to support your fitness goals.',
                'order': 3
            },
            {
                'title': 'Progress & Motivation',
                'description': 'Celebrate achievements, share progress photos, and motivate each other to keep pushing forward!',
                'order': 4
            },
            {
                'title': 'Equipment & Gear',
                'description': 'Reviews, recommendations, and discussions about fitness equipment, workout gear, and wearable technology.',
                'order': 5
            }
        ]
        
        for forum_data in general_forums:
            try:
                existing_forum = Forum.objects.filter(title=forum_data['title']).first()
                if existing_forum:
                    self.stdout.write(f"Forum '{forum_data['title']}' already exists, skipping...")
                    continue
                
                forum = Forum.objects.create(
                    title=forum_data['title'],
                    description=forum_data['description'],
                    created_by=random.choice(users),
                    order=forum_data['order'],
                    is_active=True
                )
                self.stdout.write(f"✓ Created forum: {forum.title}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating forum: {e}"))
    
    def create_forum_content(self):
        """Create realistic threads, comments, and votes"""
        self.stdout.write('Creating forum content...')
        
        all_users = list(User.objects.all())
        # Active users are more likely to create threads and comments
        active_users = [u for u in all_users if u.current_streak >= 5 or u.user_type == 'Coach']
        forums = Forum.objects.all()
        
        # Realistic thread content for each forum
        forum_threads = {
            'Getting Started': [
                {
                    'title': 'Complete beginner - where do I start?',
                    'content': 'Hi everyone! I\'m 28 and completely new to fitness. I\'ve never really worked out before and feeling overwhelmed with all the information out there. Where should someone like me even begin? Any advice for building a sustainable routine?',
                    'comments': [
                        'Welcome! Start small - even 10-15 minutes of walking daily is a great beginning. Don\'t try to do everything at once!',
                        'I was in your shoes 2 years ago. My advice: find something you actually enjoy. If you hate running, don\'t force yourself to run!',
                        'Consider working with a trainer for the first few sessions to learn proper form. It\'s worth the investment!',
                        'The r/fitness wiki has great beginner programs. I started with the beginner routine there and saw good results.',
                        'Remember: consistency beats intensity. Better to do moderate workouts regularly than intense workouts sporadically.'
                    ]
                },
                {
                    'title': 'How long before I see results?',
                    'content': 'I\'ve been working out for 3 weeks now, going to the gym 4 times a week. When should I expect to see visible results? Getting a bit discouraged...',
                    'comments': [
                        'Results depend on your goals, but generally: strength gains in 2-4 weeks, visible muscle changes in 6-8 weeks, significant body comp changes in 12+ weeks.',
                        'Take progress photos! Sometimes we don\'t notice gradual changes in the mirror, but photos don\'t lie.',
                        'Focus on performance improvements too - can you lift heavier? Run longer? Those are results!',
                        'Don\'t get discouraged! 3 weeks is still early. The first few months are about building the habit.',
                        'Make sure your nutrition is on point. You can\'t out-exercise a bad diet!'
                    ]
                },
                {
                    'title': 'Gym anxiety is real - help!',
                    'content': 'I have a gym membership but I\'m too intimidated to actually go. Everyone there seems to know what they\'re doing and I feel like I\'ll just be in the way or doing everything wrong. How did you get over gym anxiety?',
                    'comments': [
                        'I felt the same way! Here\'s the truth: everyone is focused on their own workout. No one is judging you.',
                        'Go during off-peak hours at first - usually mid-morning or early afternoon. Way less crowded!',
                        'Have a plan before you go. Write down your exercises so you\'re not wandering around looking lost.',
                        'Bring a friend if possible! Having a workout buddy made all the difference for me.',
                        'YouTube videos at home helped me practice form before trying exercises at the gym.',
                        'Remember that everyone was a beginner once. Even the most jacked people started somewhere!'
                    ]
                }
            ],
            'Workout Discussion': [
                {
                    'title': 'Best workout split for muscle building?',
                    'content': 'Currently doing a bro split (chest day, back day, etc.) but hearing mixed things about its effectiveness. What split do you guys recommend for hypertrophy? Should I switch to PPL or Upper/Lower?',
                    'comments': [
                        'PPL (Push/Pull/Legs) has been great for me. Hit each muscle group 2x per week with good recovery time.',
                        'Upper/Lower 4 days a week is my go-to. More frequency than bro split but still manageable.',
                        'Honestly, the best split is the one you\'ll stick to consistently. All of them work if you put in effort!',
                        'I made better gains when I switched from bro split to PPL. The increased frequency made a difference.',
                        'Don\'t forget about full body workouts! Great for beginners and can be effective for experienced lifters too.'
                    ]
                },
                {
                    'title': 'Running form check - knee pain issues',
                    'content': 'I\'ve been experiencing knee pain after runs lately. I think it might be my form. What should I focus on to prevent injury? Should I see a professional?',
                    'comments': [
                        'Definitely see a physical therapist if the pain persists! Better safe than sorry with joints.',
                        'Could be your shoes. When was the last time you replaced them? Running shoes should be changed every 300-500 miles.',
                        'Focus on landing mid-foot rather than heel striking. That helped my knee pain tremendously.',
                        'Are you increasing mileage too quickly? Remember the 10% rule - never increase weekly mileage by more than 10%.',
                        'Strength training for runners is crucial! Strong glutes and core protect your knees.',
                        'I had similar issues and foam rolling + stretching really helped. Don\'t skip the recovery work!'
                    ]
                },
                {
                    'title': 'Plateau in bench press - help me break through!',
                    'content': 'I\'ve been stuck at 185lbs on bench press for about 2 months now. Can\'t seem to break through to 200. What techniques or programming changes helped you overcome plateaus?',
                    'comments': [
                        'Try adding more volume at a slightly lower weight. Sometimes quality reps beat trying to force heavier weight.',
                        'Incorporate variations: incline press, dumbbell press, close-grip bench. They all carry over to regular bench.',
                        'I broke my plateau by focusing on my weak points. For me it was lockout strength, so I added board presses.',
                        'Make sure you\'re eating enough and getting adequate sleep. Recovery is where you get stronger!',
                        'Deload week helped me. Sometimes your body just needs a break to supercompensate.',
                        'Check your form. Video yourself and post a form check. Small technique issues can limit progress.'
                    ]
                }
            ],
            'Nutrition & Diet': [
                {
                    'title': 'Protein shake recommendations?',
                    'content': 'Looking for a good protein powder that doesn\'t taste like chalk. What brands do you recommend? Also, is whey better than plant-based options?',
                    'comments': [
                        'Optimum Nutrition Gold Standard is the classic for a reason. Chocolate flavor is delicious!',
                        'If you want plant-based, Orgain is pretty good. The texture isn\'t as smooth as whey though.',
                        'Whey is slightly better for muscle building due to amino acid profile, but plant-based works fine if you\'re vegan.',
                        'I mix mine with milk and frozen banana - makes any protein powder taste better!',
                        'MyProtein has good flavors and is usually cheaper than other brands during sales.',
                        'Don\'t forget you can get plenty of protein from whole foods too. Powder is just convenient, not necessary.'
                    ]
                },
                {
                    'title': 'Meal prep Sunday - show me your meals!',
                    'content': 'Starting meal prep to stay on track with my diet. What are your go-to meals that keep well throughout the week? Looking for inspiration!',
                    'comments': [
                        'Chicken breast, brown rice, and roasted vegetables. Simple but effective!',
                        'I make a big batch of chili or curry on Sunday. Great for both lunch and dinner throughout the week.',
                        'Overnight oats for breakfast - so many flavor variations and they\'re grab-and-go.',
                        'Don\'t sleep on egg muffins! Make a dozen at once, full of veggies and protein.',
                        'Stir-fry is my go-to. Cook protein and veggies, keep rice separate, combine when reheating.',
                        'Pro tip: invest in good containers. It makes meal prep so much more enjoyable!'
                    ]
                },
                {
                    'title': 'Cutting without losing muscle - is it possible?',
                    'content': 'I want to lose about 15lbs of fat but preserve my hard-earned muscle. What should my calorie deficit be? How much protein? Any specific training adjustments?',
                    'comments': [
                        'Aim for 0.5-1lb loss per week. Slower is better for muscle retention.',
                        'Keep protein high - 0.8-1g per pound of bodyweight. Don\'t skimp on this!',
                        'Maintain your lifting intensity. Your muscles need a reason to stick around during a cut.',
                        'You might not be able to increase your lifts much during a cut, but try to maintain your strength.',
                        'I do a 500 calorie deficit and it\'s been sustainable. Losing about 1lb per week.',
                        'Don\'t cut carbs too low - you need energy for your workouts!'
                    ]
                }
            ],
            'Progress & Motivation': [
                {
                    'title': '[Progress] Down 40lbs in 6 months!',
                    'content': 'I can\'t believe it! Started at 220lbs, now at 180lbs. Combination of consistent gym 4x/week and tracking calories. Never thought I could do it but here we are! If I can do it, anyone can. Don\'t give up!',
                    'comments': [
                        'This is amazing! Congratulations on your hard work!',
                        'That\'s a healthy rate of weight loss too. You did it the right way!',
                        'Seeing posts like this keeps me motivated. Thanks for sharing!',
                        'What was the hardest part of your journey?',
                        'You should be so proud! That takes serious dedication.',
                        'Inspirational! Did you have any setbacks along the way? How did you handle them?'
                    ]
                },
                {
                    'title': 'Finally hit a 225lb squat!',
                    'content': 'It took me almost a year but I did it! Two plates feels so good. Thanks to everyone in this community for the form tips and encouragement!',
                    'comments': [
                        'Congrats! That\'s a huge milestone!',
                        'Next stop: 315! You got this!',
                        'Love seeing people hit their goals. Well done!',
                        'A year of consistent work - that\'s the key. Awesome job!',
                        'Form over ego always pays off. Great work!',
                        'These posts make my day. Crushing it!'
                    ]
                },
                {
                    'title': 'Having a rough week - need motivation',
                    'content': 'Been really struggling this week. Missed three workouts, ate terribly, and just feeling unmotivated. How do you guys push through slumps like this?',
                    'comments': [
                        'We all have rough weeks. Don\'t beat yourself up - just get back on track tomorrow!',
                        'Remember why you started. Look at old progress photos or journal entries.',
                        'One bad week won\'t undo months of progress. Be kind to yourself!',
                        'Sometimes you need to rest. Listen to your body and come back stronger.',
                        'I find that just showing up to the gym, even for a light workout, helps me get back in the groove.',
                        'This too shall pass. You\'ve got this! We\'re all here cheering for you.'
                    ]
                }
            ],
            'Equipment & Gear': [
                {
                    'title': 'Best budget home gym equipment?',
                    'content': 'Want to set up a basic home gym but working with a limited budget. What are the essentials I should invest in first? Thinking about getting adjustable dumbbells and a bench.',
                    'comments': [
                        'Adjustable dumbbells and a bench are perfect starting points! You can do so many exercises with just those.',
                        'Add a pull-up bar! Cheap and incredibly effective for upper body.',
                        'Resistance bands are underrated. Great for warming up and assistance work.',
                        'If you can, invest in a good quality bench. Cheap ones tend to wobble.',
                        'Don\'t forget a yoga mat for floor work and stretching!',
                        'Facebook Marketplace often has great deals on used equipment. Check there!'
                    ]
                },
                {
                    'title': 'Running watch - Garmin vs Apple Watch?',
                    'content': 'Looking to get a fitness watch primarily for running tracking. Torn between Garmin Forerunner and Apple Watch. Runners, what do you use and recommend?',
                    'comments': [
                        'Garmin for serious running. Way better battery life and more detailed metrics.',
                        'I love my Apple Watch for the ecosystem integration, but Garmin is better for pure running features.',
                        'Garmin Forerunner 245 is the sweet spot for price/features. Highly recommend!',
                        'Apple Watch is great if you want an all-around smartwatch. Garmin if you\'re focused on training.',
                        'Battery life on Garmin is a game changer. My Apple Watch barely lasts through a long run.',
                        'Can\'t go wrong with either honestly. Depends if you prioritize running metrics or smart features.'
                    ]
                },
                {
                    'title': 'Weightlifting belt - necessary or unnecessary?',
                    'content': 'I\'m squatting around 250lbs and deadlifting 300lbs. Do I need a weightlifting belt at this point? Some people say yes, others say it\'s a crutch. What\'s your take?',
                    'comments': [
                        'A belt doesn\'t replace core strength, but it does allow you to lift more safely at heavy weights.',
                        'I use a belt for my top sets only. I still do warm-ups and lighter work without it to build core strength.',
                        'At those weights, a belt is definitely useful. It\'s not a crutch - it\'s a tool.',
                        'Get a good quality leather belt. Cheap ones aren\'t worth it.',
                        'Learn to brace properly first. A belt just gives your core something to push against.',
                        'I only use mine for 85%+ of my max. For everything else, raw core work is better.'
                    ]
                }
            ]
        }
        
        # Create threads, comments, and votes
        for forum in forums:
            if forum.title in forum_threads:
                threads_data = forum_threads[forum.title]
                
                for thread_data in threads_data:
                    try:
                        # Thread authors are active users
                        author = random.choice(active_users)
                        
                        thread = Thread.objects.create(
                            forum=forum,
                            title=thread_data['title'],
                            content=thread_data['content'],
                            author=author,
                            is_pinned=random.random() < 0.1,
                            is_locked=False,
                            view_count=random.randint(50, 500),
                            like_count=random.randint(5, 50)
                        )
                        
                        # Create comments - also from active users
                        for comment_text in thread_data['comments']:
                            comment_author = random.choice([u for u in active_users if u != author])
                            
                            comment = Comment.objects.create(
                                thread=thread,
                                author=comment_author,
                                content=comment_text
                            )
                            
                            thread.comment_count += 1
                            thread.save(update_fields=['comment_count'])
                            
                            # Add votes to comments - all users can vote
                            voters = random.sample(all_users, min(random.randint(3, 8), len(all_users)))
                            for voter in voters:
                                try:
                                    vote_type = 'UPVOTE' if random.random() < 0.85 else 'DOWNVOTE'
                                    Vote.objects.create(
                                        user=voter,
                                        content_type=ContentType.objects.get_for_model(Comment),
                                        object_id=comment.id,
                                        vote_type=vote_type
                                    )
                                except:
                                    pass
                            
                            # Add subcomments (30% chance) - active users only
                            if random.random() < 0.3 and len(active_users) > 1:
                                subcomment_author = random.choice([u for u in active_users if u != comment_author])
                                subcomment = Subcomment.objects.create(
                                    comment=comment,
                                    author=subcomment_author,
                                    content=random.choice([
                                        'Thanks for the advice!',
                                        'This is exactly what I needed to hear.',
                                        'Great point! I\'ll try that.',
                                        'Couldn\'t agree more.',
                                        'I had a similar experience.',
                                        'Really helpful, appreciate it!'
                                    ])
                                )
                                comment.subcomment_count += 1
                                comment.save(update_fields=['subcomment_count'])
                        
                        # Add votes to threads - all users can vote
                        thread_voters = random.sample(all_users, min(random.randint(5, 15), len(all_users)))
                        for voter in thread_voters:
                            try:
                                vote_type = 'UPVOTE' if random.random() < 0.9 else 'DOWNVOTE'
                                Vote.objects.create(
                                    user=voter,
                                    content_type=ContentType.objects.get_for_model(Thread),
                                    object_id=thread.id,
                                    vote_type=vote_type
                                )
                            except:
                                pass
                        
                        self.stdout.write(f"✓ Created thread: {thread.title[:50]}...")
                        
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error creating thread: {e}"))

