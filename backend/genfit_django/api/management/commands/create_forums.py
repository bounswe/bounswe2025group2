"""
Django management command to create 3 random forums.

Usage:
    python manage.py create_forums
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Forum, UserWithType

class Command(BaseCommand):
    help = 'Create 3 random forums for testing and development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=3,
            help='Number of forums to create (default: 3)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if forums already exist'
        )

    def handle(self, *args, **options):
        count = options['count']
        force = options['force']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Creating {count} random forums...')
        )
        
        # Sample forum data
        forum_templates = [
            {
                'title': 'Fitness Tips & Advice',
                'description': 'Share your fitness tips, workout routines, and get advice from the community. Whether you\'re a beginner or an expert, this is the place to discuss all things fitness.',
                'order': 1
            },
            {
                'title': 'Nutrition & Diet',
                'description': 'Discuss healthy eating habits, meal planning, supplements, and nutrition strategies. Share recipes and get advice on maintaining a balanced diet.',
                'order': 2
            },
            {
                'title': 'Workout Routines',
                'description': 'Share and discover effective workout routines for different fitness goals. From strength training to cardio, find the perfect routine for your needs.',
                'order': 3
            },
            {
                'title': 'Weight Loss Journey',
                'description': 'Share your weight loss experiences, tips, and challenges. Get support and motivation from others on similar journeys.',
                'order': 4
            },
            {
                'title': 'Muscle Building',
                'description': 'Discuss muscle building strategies, training techniques, and nutrition for gaining lean muscle mass.',
                'order': 5
            },
            {
                'title': 'Cardio & Endurance',
                'description': 'Share cardio workouts, running tips, cycling, swimming, and other endurance training discussions.',
                'order': 6
            }
        ]
        
        # Get an admin user
        admin_user = UserWithType.objects.filter(user_type='Admin').first()
        if not admin_user:
            # Create a default admin user if none exists
            admin_user = UserWithType.objects.create_user(
                username='admin',
                email='admin@genfit.com',
                password='admin123',
                user_type='Admin'
            )
            self.stdout.write(
                self.style.WARNING('Created default admin user: admin@genfit.com')
            )
        
        created_count = 0
        
        for i in range(min(count, len(forum_templates))):
            forum_info = forum_templates[i]
            
            # Check if forum already exists
            existing_forum = Forum.objects.filter(title=forum_info['title']).first()
            if existing_forum and not force:
                self.stdout.write(
                    self.style.WARNING(f'Forum "{forum_info["title"]}" already exists. Skipping...')
                )
                continue
            
            # Create the forum
            forum = Forum.objects.create(
                title=forum_info['title'],
                description=forum_info['description'],
                created_by=admin_user,
                is_active=True,
                order=forum_info['order']
            )
            
            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'✅ Created forum: "{forum.title}"')
            )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'\n🎉 Successfully created {created_count} forum(s)!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('\nℹ️  No new forums were created (they may already exist)')
            )
