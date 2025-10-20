import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from api.models import (
    UserWithType, FitnessGoal, Notification, Profile,
    Forum, Thread, Comment, Subcomment, Vote,
    Challenge, ChallengeParticipant
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Adds inclusive forums with threads, comments, and votes for testing.'

    def handle(self, *args, **options):
        self.create_inclusive_forums()

    def create_inclusive_forums(self):
        self.stdout.write('Creating inclusive forums with threads, comments, and votes...')
        
        # Get users to assign as creators and participants
        users = list(User.objects.all())
        if not users:
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return
        
        # Define inclusive forum data
        inclusive_forum_data = [
            {
                'title': 'Adaptive Fitness & Disabilities',
                'description': 'A supportive community for people with disabilities to share adaptive fitness strategies, equipment recommendations, and success stories.',
                'order': 6
            },
            {
                'title': 'Inclusive Nutrition',
                'description': 'Nutrition advice and meal planning for diverse dietary needs, including food allergies, cultural preferences, and medical restrictions.',
                'order': 7
            },
            {
                'title': 'Mental Health & Wellness',
                'description': 'Discussing the connection between physical fitness and mental health, including resources for anxiety, depression, and stress management.',
                'order': 8
            },
            {
                'title': 'LGBTQ+ Fitness Community',
                'description': 'A safe space for LGBTQ+ individuals to discuss fitness goals, find supportive workout partners, and share experiences.',
                'order': 9
            },
            {
                'title': 'Senior Fitness',
                'description': 'Fitness advice and community support for older adults, focusing on mobility, balance, and age-appropriate exercises.',
                'order': 10
            },
            {
                'title': 'Body Positivity & Self-Acceptance',
                'description': 'Promoting healthy relationships with fitness and body image, celebrating all body types and fitness levels.',
                'order': 11
            }
        ]
        
        # Create inclusive forums
        forums = []
        for forum_data in inclusive_forum_data:
            try:
                # Check if forum already exists
                existing_forum = Forum.objects.filter(title=forum_data['title']).first()
                if existing_forum:
                    self.stdout.write(f"Forum '{forum_data['title']}' already exists, skipping...")
                    forums.append(existing_forum)
                    continue
                
                created_forum = Forum.objects.create(
                    title=forum_data['title'],
                    description=forum_data['description'],
                    created_by=random.choice(users),
                    order=forum_data['order'],
                    is_active=True
                )
                forums.append(created_forum)
                self.stdout.write(f"Created inclusive forum: {created_forum.title}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating forum {forum_data['title']}: {e}"))
        
        # Create threads for each forum
        self.create_inclusive_threads(forums, users)
        
        # Create comments and votes
        self.create_inclusive_comments_and_votes(users)
    
    def create_inclusive_threads(self, forums, users):
        """Create inclusive threads for each forum"""
        self.stdout.write('Creating inclusive threads...')
        
        # Define thread data for each forum type
        thread_data_by_forum = {
            'Adaptive Fitness & Disabilities': [
                {
                    'title': 'Wheelchair-accessible gym recommendations',
                    'content': 'Looking for gyms with proper wheelchair accessibility. What features should I look for? Any recommendations in major cities?'
                },
                {
                    'title': 'Adaptive equipment for upper body workouts',
                    'content': 'Sharing some great adaptive equipment I\'ve discovered for upper body strength training. What equipment has worked well for you?'
                },
                {
                    'title': 'Swimming with prosthetics - tips and experiences',
                    'content': 'I\'m new to swimming with a prosthetic leg. Any tips on waterproof options or techniques that have worked for others?'
                },
                {
                    'title': 'Vision impairment and running safety',
                    'content': 'Tips for safe running with vision impairment. Guide running, audio cues, and safe route recommendations welcome!'
                }
            ],
            'Inclusive Nutrition': [
                {
                    'title': 'Gluten-free meal prep for athletes',
                    'content': 'Sharing my weekly gluten-free meal prep routine that supports my training schedule. What are your go-to recipes?'
                },
                {
                    'title': 'Halal protein sources for muscle building',
                    'content': 'Looking for diverse halal protein sources to support muscle building. Beyond chicken and beef - what works for you?'
                },
                {
                    'title': 'Managing diabetes while staying active',
                    'content': 'How do you balance blood sugar management with an active lifestyle? Timing meals around workouts, etc.'
                },
                {
                    'title': 'Plant-based nutrition for endurance sports',
                    'content': 'Transitioning to plant-based eating while training for marathons. Sharing what I\'ve learned and seeking advice!'
                }
            ],
            'Mental Health & Wellness': [
                {
                    'title': 'Exercise as anxiety management',
                    'content': 'How has regular exercise helped with your anxiety? What types of workouts work best for mental health benefits?'
                },
                {
                    'title': 'Dealing with gym anxiety and social fears',
                    'content': 'Tips for overcoming gym intimidation and social anxiety around fitness spaces. You\'re not alone in feeling this way!'
                },
                {
                    'title': 'Depression and motivation to exercise',
                    'content': 'On days when depression makes everything hard, how do you find motivation to move? Small wins and gentle approaches welcome.'
                },
                {
                    'title': 'Mindful movement and meditation',
                    'content': 'Combining mindfulness practices with physical activity. Yoga, tai chi, walking meditation - what works for you?'
                }
            ],
            'LGBTQ+ Fitness Community': [
                {
                    'title': 'LGBTQ+-friendly gyms and fitness spaces',
                    'content': 'Recommendations for inclusive fitness spaces where everyone feels welcome and safe to be themselves.'
                },
                {
                    'title': 'Fitness during gender transition',
                    'content': 'Navigating fitness goals and body changes during transition. Support and advice from those who\'ve been there.'
                },
                {
                    'title': 'Pride run/walk groups in your city',
                    'content': 'Looking to connect with LGBTQ+ running or walking groups. Great way to stay fit and build community!'
                },
                {
                    'title': 'Dealing with locker room anxiety',
                    'content': 'Tips for feeling more comfortable in gym changing areas. Practical advice and emotional support welcome.'
                }
            ],
            'Senior Fitness': [
                {
                    'title': 'Starting fitness after 60 - where to begin?',
                    'content': 'Never too late to start! Sharing beginner-friendly exercises and programs that work well for seniors.'
                },
                {
                    'title': 'Balance exercises to prevent falls',
                    'content': 'Simple balance exercises you can do at home. Fall prevention is so important as we age!'
                },
                {
                    'title': 'Joint-friendly cardio options',
                    'content': 'Low-impact cardio that\'s easier on aging joints. Swimming, cycling, walking - what are your favorites?'
                },
                {
                    'title': 'Staying motivated with chronic conditions',
                    'content': 'How do you maintain fitness routines while managing arthritis, heart conditions, or other health challenges?'
                }
            ],
            'Body Positivity & Self-Acceptance': [
                {
                    'title': 'Fitness goals beyond weight loss',
                    'content': 'Celebrating non-scale victories! Strength gains, better sleep, improved mood - what victories are you celebrating?'
                },
                {
                    'title': 'Finding joy in movement at any size',
                    'content': 'Movement should feel good! Sharing activities that bring joy regardless of body size or fitness level.'
                },
                {
                    'title': 'Overcoming negative self-talk during workouts',
                    'content': 'Tips for quieting that inner critic during exercise. How do you practice self-compassion in fitness?'
                },
                {
                    'title': 'Inclusive fitness clothing and gear',
                    'content': 'Recommendations for workout clothes and equipment that work for all body types and sizes.'
                }
            ]
        }
        
        # Create threads for each forum
        for forum in forums:
            if forum.title in thread_data_by_forum:
                threads_data = thread_data_by_forum[forum.title]
                for thread_data in threads_data:
                    try:
                        author = random.choice(users)
                        is_pinned = random.random() < 0.15  # 15% chance of being pinned
                        is_locked = False  # Keep inclusive threads unlocked
                        view_count = random.randint(10, 150)
                        like_count = random.randint(5, 40)
                        
                        thread = Thread.objects.create(
                            forum=forum,
                            title=thread_data['title'],
                            content=thread_data['content'],
                            author=author,
                            is_pinned=is_pinned,
                            is_locked=is_locked,
                            view_count=view_count,
                            like_count=like_count
                        )
                        
                        self.stdout.write(f"Created thread: {thread.title} in {forum.title}")
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Error creating thread in {forum.title}: {e}"))
    
    def create_inclusive_comments_and_votes(self, users):
        """Create comments, subcomments and votes for inclusive threads"""
        self.stdout.write('Creating inclusive comments, subcomments and votes...')
        
        # Get all threads from inclusive forums
        inclusive_forums = Forum.objects.filter(order__gte=6, order__lte=11)
        threads = Thread.objects.filter(forum__in=inclusive_forums)
        
        # Thread-specific comment content for more realistic discussions
        thread_specific_comments = {
            # Adaptive Fitness & Disabilities
            'Wheelchair-accessible gym recommendations': [
                "Planet Fitness has been great for wheelchair access - wide aisles and accessible equipment!",
                "Look for gyms with roll-in showers and adjustable cable machines. Game changers!",
                "The YMCA near me has excellent accessibility features and staff training.",
                "Don't forget to check parking accessibility too - it makes such a difference.",
                "I called ahead and asked for a tour to check accessibility before joining."
            ],
            'Adaptive equipment for upper body workouts': [
                "Resistance bands have been my go-to! So versatile and portable.",
                "The FES bike at my gym has been amazing for maintaining leg muscle tone.",
                "Wheelchair gloves made such a difference for grip during workouts.",
                "TRX suspension trainers work great for adaptive upper body exercises.",
                "My occupational therapist recommended some great adaptive dumbbells."
            ],
            'Swimming with prosthetics - tips and experiences': [
                "I use a waterproof liner - it's been a game changer for pool workouts!",
                "Started with water walking before swimming laps. Build confidence first!",
                "The pool staff at my local center are super helpful with entry/exit.",
                "Consider a swimming prosthetic if you're serious about it - worth the investment.",
                "Water aerobics classes are also great for building strength and confidence."
            ],
            'Vision impairment and running safety': [
                "Guide running with my local club has been incredible - highly recommend!",
                "Bone conduction headphones let me hear traffic while still getting audio cues.",
                "Treadmill running gives me confidence to work on pace and form safely.",
                "Bright, reflective gear is essential - visibility works both ways!",
                "My running app has great audio feedback for pace and distance."
            ],
            
            # Inclusive Nutrition
            'Gluten-free meal prep for athletes': [
                "Quinoa bowls with roasted vegetables are my weekly staple!",
                "Rice paper wraps are great for portable, gluten-free meals.",
                "I batch cook gluten-free oats with different toppings for variety.",
                "Sweet potato and black bean combinations give great energy for workouts.",
                "Always check labels - gluten hides in surprising places like seasonings!"
            ],
            'Halal protein sources for muscle building': [
                "Lentils and chickpeas are protein powerhouses! I make huge batches.",
                "Halal turkey and lamb are great alternatives to the usual chicken routine.",
                "Don't sleep on nuts and seeds - almonds and pumpkin seeds pack protein.",
                "Fish is often overlooked but salmon and tuna are excellent choices.",
                "Greek yogurt (halal certified) with berries is my post-workout go-to."
            ],
            'Managing diabetes while staying active': [
                "I always carry glucose tablets during longer workouts - safety first!",
                "Testing blood sugar before and after exercise helped me find my patterns.",
                "My endocrinologist helped adjust my insulin timing around workouts.",
                "Complex carbs 1-2 hours before exercise work best for me.",
                "Continuous glucose monitors are game-changers for active diabetics!"
            ],
            'Plant-based nutrition for endurance sports': [
                "Beet juice before long runs has really improved my endurance!",
                "I focus on iron-rich foods like spinach and legumes to prevent deficiency.",
                "B12 supplementation is crucial - learned this the hard way!",
                "Chia seed puddings are perfect for pre-run fuel.",
                "Plant protein powder helps me hit my daily protein goals easily."
            ],
            
            # Mental Health & Wellness
            'Exercise as anxiety management': [
                "Morning walks before work set a calm tone for my entire day.",
                "High-intensity workouts help me burn off anxious energy effectively.",
                "Yoga has taught me breathing techniques I use outside the gym too.",
                "Even 10 minutes of movement helps when anxiety peaks.",
                "Exercise gives me a sense of control when everything else feels chaotic."
            ],
            'Dealing with gym anxiety and social fears': [
                "I started with off-peak hours when the gym was less crowded.",
                "Having a workout plan written down helped me feel more confident.",
                "Most people are focused on their own workouts - they're not judging!",
                "I brought a friend the first few times for moral support.",
                "Staff at my gym were super helpful in showing me around equipment."
            ],
            'Depression and motivation to exercise': [
                "On bad days, I commit to just putting on workout clothes. Often that's enough to get moving.",
                "I track mood alongside workouts - seeing the correlation helps motivation.",
                "Walking outside, even for 5 minutes, can shift my mental state.",
                "I have a 'bare minimum' workout for really tough days - something is better than nothing.",
                "Exercise buddies help with accountability when self-motivation is low."
            ],
            'Mindful movement and meditation': [
                "Walking meditation in nature combines two of my favorite stress-relievers.",
                "Tai chi has improved both my balance and my ability to stay present.",
                "I do body scans during stretching - it's like meditation with movement.",
                "Focusing on breath during yoga helps quiet my racing thoughts.",
                "Even mindful dishwashing can be meditative movement!"
            ],
            
            # LGBTQ+ Fitness Community
            'LGBTQ+-friendly gyms and fitness spaces': [
                "My local community center has explicitly inclusive policies - feels so safe!",
                "Look for gyms with gender-neutral changing areas if that's important to you.",
                "Some CrossFit boxes are incredibly welcoming - found my fitness family there!",
                "Outdoor running groups often have the most inclusive vibes.",
                "Ask about their non-discrimination policies - good gyms will be proud to share them."
            ],
            'Fitness during gender transition': [
                "Working with a trans-friendly trainer made all the difference in my journey.",
                "I focused on exercises that helped me feel more aligned with my body goals.",
                "Sports bras/binders designed for exercise are worth the investment.",
                "My gym has private changing areas which reduced a lot of stress.",
                "Remember that your fitness journey is yours - go at your own pace."
            ],
            'Pride run/walk groups in your city': [
                "Our local Pride running group meets every Saturday - such a supportive community!",
                "Check Facebook for LGBTQ+ running groups - that's how I found mine.",
                "Many cities have Rainbow running clubs - they're usually very welcoming to all paces.",
                "Pride training runs are great prep for Pride events and build community.",
                "Even if you're not a runner, many groups welcome walkers too!"
            ],
            'Dealing with locker room anxiety': [
                "I change at home when possible - removes that stress entirely.",
                "Some gyms have family/private changing rooms you can use.",
                "I found changing quickly and confidently helps - fake it till you make it!",
                "Bringing a friend for moral support helped me initially.",
                "Remember you have every right to be there - you belong in fitness spaces too."
            ],
            
            # Senior Fitness
            'Starting fitness after 60 - where to begin?': [
                "I started with chair exercises and gradually built up - no shame in starting slow!",
                "Water aerobics was perfect for me - easy on joints but still a great workout.",
                "My doctor helped me understand what exercises were safe for my conditions.",
                "Senior center fitness classes are designed for our needs and very supportive.",
                "Walking groups are social and fitness combined - perfect for beginners!"
            ],
            'Balance exercises to prevent falls': [
                "Standing on one foot while brushing teeth - easy daily balance practice!",
                "Tai chi classes have dramatically improved my balance and confidence.",
                "I practice heel-to-toe walking in my hallway - simple but effective.",
                "Balance boards are great tools, but start with something stable nearby.",
                "My physical therapist gave me specific exercises after my fall - so helpful!"
            ],
            'Joint-friendly cardio options': [
                "Swimming is my favorite - full body workout with zero joint impact!",
                "Recumbent bikes are much easier on my back than regular bikes.",
                "Walking in the mall during bad weather keeps me moving safely.",
                "Water walking gives resistance without the joint stress.",
                "Elliptical machines work well when my knees are bothering me."
            ],
            'Staying motivated with chronic conditions': [
                "I adjust my routine based on how I'm feeling - flexibility is key.",
                "Celebrating small victories keeps me motivated on tough days.",
                "My exercise buddy understands my limitations and keeps me accountable.",
                "I track energy levels, not just exercise - helps me see the benefits.",
                "Some movement is always better than no movement - I remind myself daily."
            ],
            
            # Body Positivity & Self-Acceptance
            'Fitness goals beyond weight loss': [
                "I can now carry all my groceries in one trip - that's real strength!",
                "My resting heart rate has improved so much - cardiovascular health matters!",
                "I sleep so much better since starting regular exercise.",
                "Climbing stairs without getting winded is my favorite non-scale victory!",
                "My mood and energy levels have improved dramatically with regular movement."
            ],
            'Finding joy in movement at any size': [
                "Dancing in my living room brings me so much joy - who cares what I look like!",
                "I found activities I love rather than forcing myself through boring workouts.",
                "Swimming makes me feel graceful and strong regardless of my size.",
                "Hiking connects me with nature and my body's capabilities.",
                "Movement is a celebration of what my body can do, not punishment for what I ate."
            ],
            'Overcoming negative self-talk during workouts': [
                "I practice positive self-talk like I would encourage a good friend.",
                "When negative thoughts come up, I redirect to what my body is accomplishing.",
                "I remind myself that everyone started somewhere - comparison is the thief of joy.",
                "Focusing on how exercise makes me feel rather than how I look helps.",
                "I've learned to treat my body with the same kindness I show others."
            ],
            'Inclusive fitness clothing and gear': [
                "Torrid has great plus-size activewear that actually fits and flatters!",
                "Look for moisture-wicking fabrics in extended sizes - game changer for comfort.",
                "Sports bras with proper support in larger sizes are worth the investment.",
                "Compression shorts prevent chafing and boost confidence during workouts.",
                "Don't let clothing be a barrier - there are options for every body type!"
            ]
        }
        
        # General inclusive comment content as fallback
        general_inclusive_comments = [
            "Thank you for sharing your experience! This is really helpful.",
            "I've had similar challenges and found that approach works well too.",
            "This is such an important topic. Thanks for bringing it up!",
            "Your perspective really resonates with me. Appreciate you sharing.",
            "I hadn't considered this before - thanks for the insight!",
            "This community is so supportive. Grateful to be part of it.",
            "Your journey is inspiring! Keep up the great work.",
            "I'd love to hear more about your experience with this.",
            "This is exactly the kind of discussion we need more of.",
            "Thanks for creating such a welcoming space for this conversation.",
            "Your advice has been really helpful in my own journey.",
            "I appreciate how thoughtful and inclusive this discussion is.",
            "This gives me hope and motivation to keep trying.",
            "What a wonderful resource! Thanks for sharing.",
            "Your story shows that everyone's path is different and valid.",
        ]
        
        # Create comments for threads
        for thread in threads:
            num_comments = random.randint(2, 8)  # More comments for inclusive discussions
            for _ in range(num_comments):
                try:
                    author = random.choice(users)
                    
                    # Use thread-specific comments if available, otherwise use general comments
                    if thread.title in thread_specific_comments:
                        available_comments = thread_specific_comments[thread.title] + general_inclusive_comments
                        content = random.choice(available_comments)
                    else:
                        content = random.choice(general_inclusive_comments)
                    comment = Comment.objects.create(
                        thread=thread,
                        author=author,
                        content=content
                    )

                    # Update thread comment count
                    thread.comment_count += 1
                    thread.save(update_fields=['comment_count'])
                    
                    # Create votes for comment (more positive votes for inclusive content)
                    voters = random.sample(users, min(random.randint(2, 6), len(users)))
                    for voter in voters:
                        try:
                            # 80% chance of upvote, 20% chance of downvote for inclusive content
                            vote_type = 'UPVOTE' if random.random() < 0.8 else 'DOWNVOTE'
                            Vote.objects.create(
                                user=voter,
                                content_type=ContentType.objects.get_for_model(Comment),
                                object_id=comment.id,
                                vote_type=vote_type
                            )
                        except Exception as e:
                            # Skip if vote already exists (unique constraint)
                            pass
                    
                    # Create subcomments
                    num_subcomments = random.randint(0, 4)
                    for _ in range(num_subcomments):
                        try:
                            subcomment_author = random.choice(users)
                            
                            # Use thread-specific comments for subcomments too
                            if thread.title in thread_specific_comments:
                                available_comments = thread_specific_comments[thread.title] + general_inclusive_comments
                                subcomment_content = random.choice(available_comments)
                            else:
                                subcomment_content = random.choice(general_inclusive_comments)
                            subcomment = Subcomment.objects.create(
                                comment=comment,
                                author=subcomment_author,
                                content=subcomment_content
                            )

                            # Update comment subcomment count
                            comment.subcomment_count += 1
                            comment.save(update_fields=['subcomment_count'])
                            
                            # Create votes for subcomment
                            subcomment_voters = random.sample(users, min(random.randint(1, 4), len(users)))
                            for voter in subcomment_voters:
                                try:
                                    vote_type = 'UPVOTE' if random.random() < 0.8 else 'DOWNVOTE'
                                    Vote.objects.create(
                                        user=voter,
                                        content_type=ContentType.objects.get_for_model(Subcomment),
                                        object_id=subcomment.id,
                                        vote_type=vote_type
                                    )
                                except Exception as e:
                                    # Skip if vote already exists
                                    pass
                                    
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error creating subcomment: {e}"))
                            
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating comment: {e}"))
        
        # Create votes for threads
        for thread in threads:
            voters = random.sample(users, min(random.randint(3, 8), len(users)))
            for voter in voters:
                try:
                    vote_type = 'UPVOTE' if random.random() < 0.85 else 'DOWNVOTE'  # Even more positive for thread votes
                    Vote.objects.create(
                        user=voter,
                        content_type=ContentType.objects.get_for_model(Thread),
                        object_id=thread.id,
                        vote_type=vote_type
                    )
                except Exception as e:
                    # Skip if vote already exists
                    pass
        
        self.stdout.write(self.style.SUCCESS('Successfully created inclusive forums with threads, comments, and votes!'))

