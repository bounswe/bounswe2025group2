from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .separate_views import fitness_goals
from .separate_views import profile
from .separate_views.forum_forumthread import ForumViewSet, ThreadViewSet
from .separate_views import forum_comments
from .separate_views import forum_vote
from .separate_views import challenges
from .separate_views.ai_tutor_views import AiTutorViewSet
from .separate_views import local_hour
from .separate_views import quote_views
from .separate_views import parse_food
from .separate_views import cat_info
from .separate_views import fitness_gif
from .separate_views import ip_location
from .separate_views import fitness_gif
from .separate_views import ip_location
from .separate_views import goal_suggestions
from .separate_views import daily_advice_views
from .separate_views import mentor_relationships
from .separate_views import report_views


urlpatterns = [
    path('register/', views.register, name='register'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('user/', views.get_user, name='get_user'),
    path('user/login-stats/', views.get_login_stats, name='get_login_stats'),
    path('user/settings/', views.user_settings, name='user_settings'),
    path('users/', views.get_users, name='get_users'),
    path('csrf-token/', views.get_csrf_token, name='get_csrf_token'),
    path('change-password/', views.change_password, name='change_password'),
    path('delete-account/', views.delete_account, name='delete_account'),

    # Notifications
    path('notifications/', views.get_user_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/', views.get_single_notification, name='get_single_notification'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/<int:notification_id>/unread/', views.mark_notification_unread, name='mark_notification_unread'),
    path('notifications/<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),

    # Quote endpoints
    path('quotes/random/', quote_views.get_random_quote, name='get_random_quote'),
    path('quotes/daily/', quote_views.get_daily_quote, name='get_daily_quote'),

    # Daily Advice endpoints
    path('daily-advice/', daily_advice_views.get_daily_advice, name='get_daily_advice'),
    path('daily-advice/regenerate/', daily_advice_views.regenerate_daily_advice, name='regenerate_daily_advice'),

    # Nutrition endpoints
    path('parse_food/', parse_food.parse_food, name='parse_food'),

    # Giphy endpoints
    path('fitness-gifs/', fitness_gif.random_fitness_gif, name='get_fitness_gif'),

    # IP location endpoint
    path('ip-location/', ip_location.get_location_from_ip, name='get_location_from_ip'),

    # Cat info endpoints
    path('cats/fact/', cat_info.get_cat_fact, name='get_cat_fact'),
    path('cats/', cat_info.get_cat_info, name='get_random_cats'),
    path('cats/<str:cat_id>/', cat_info.get_cat_info, name='get_cat_info'),
    # Fitness Goals URLs
    path('goals/', fitness_goals.fitness_goals, name='fitness_goals'),
    path('goals/<int:goal_id>/', fitness_goals.fitness_goal_detail, name='fitness_goal_detail'),
    path('goals/<int:goal_id>/progress/', fitness_goals.update_goal_progress, name='update_goal_progress'),
    path('goals/<int:goal_id>/restart/', fitness_goals.restart_goal, name='restart_goal'),
    path('goals/check-inactive/', fitness_goals.check_inactive_goals, name='check_inactive_goals'),
    path('goals/suggestions/', goal_suggestions.get_goal_suggestions, name='get_goal_suggestions'),

    # Profile URLs
    path('profile/', profile.profile_detail, name='profile-detail'),
    path('profile/other/<str:username>/', profile.other_profile_detail, name='other-profile-detail'),
    path('profile/picture/upload/', profile.upload_profile_picture, name='upload-profile-picture'),
    path('profile/picture/', profile.get_profile_picture_file, name='get-profile-picture'),
    path('profile/picture/delete/', profile.delete_profile_picture, name='delete-profile-picture'),
    path('profile/other/picture/<str:username>/', profile.get_other_profile_picture, name='get-other-profile-picture'),

    # Comment endpoints
    path('comments/<int:comment_id>/', forum_comments.get_comment, name='get_comment'),
    path('comments/update/<int:comment_id>/', forum_comments.update_comment, name='update_comment'),
    path('comments/delete/<int:comment_id>/', forum_comments.delete_comment, name='delete_comment'),
    path('comments/add/<int:thread_id>/', forum_comments.add_comment, name='add_comment'),

    # Comment endpoints by thread
    path('comments/thread/<int:thread_id>/date/', forum_comments.get_comments_for_thread_by_date, name='get_comments_for_thread_date'),
    path('comments/thread/<int:thread_id>/likes/', forum_comments.get_comments_for_thread_by_likes, name='get_comments_for_thread_likes'),
    path('comments/thread/<int:thread_id>/', forum_comments.get_comments_for_thread_by_date, name='get_comments_for_thread'),

    # SubComment endpoints by comment
    path('subcomments/comment/<int:comment_id>/date/', forum_comments.get_subcomments_for_comment_by_date, name='get_subcomments_by_comment_date'),
    path('subcomments/comment/<int:comment_id>/likes/', forum_comments.get_subcomments_for_comment_by_likes, name='get_subcomments_by_comment_likes'),
    path('subcomments/comment/<int:comment_id>/', forum_comments.get_subcomments_for_comment_by_date, name='get_subcomments_by_comment'),

    # SubComment individual endpoints
    path('subcomments/<int:subcomment_id>/', forum_comments.get_subcomment, name='get_subcomment'),
    path('subcomments/update/<int:subcomment_id>/', forum_comments.update_subcomment, name='update_subcomment'),
    path('subcomments/delete/<int:subcomment_id>/', forum_comments.delete_subcomment, name='delete_subcomment'),
    path('subcomments/add/<int:comment_id>/', forum_comments.add_subcomment, name='add_subcomment'),

    # Vote URLs
    path('forum/vote/', forum_vote.create_vote, name='create_vote'),
    path('forum/vote/<str:content_type>/<int:object_id>/', forum_vote.delete_vote, name='delete_vote'),
    path('forum/vote/<str:content_type>/<int:object_id>/status/', forum_vote.get_user_vote, name='get_user_vote'),

    # Local time
    path('localtime/<str:lat>/<str:lon>', local_hour.get_local_hour, name='get_local_hour'),

    # Challenge-related views
    path('challenges/<int:challenge_id>/', challenges.get_challenge_detail, name='get_challenge_detail'),
    path('challenges/create/', challenges.create_challenge, name='create_challenge'),
    path('challenges/<int:challenge_id>/update/', challenges.update_challenge, name='update_challenge'),
    path('challenges/<int:challenge_id>/delete/', challenges.delete_challenge, name='delete_challenge'),
    path('challenges/joined/', challenges.get_joined_challenges, name='get_joined_challenges'),
    path('challenges/progress/', challenges.get_challenge_progresses, name='get_progress_challenges'),

    # Participant-related views
    path('challenges/<int:challenge_id>/join/', challenges.join_challenge, name='join_challenge'),
    path('challenges/<int:challenge_id>/leave/', challenges.leave_challenge, name='leave_challenge'),
    path('challenges/<int:challenge_id>/update-progress/', challenges.update_progress, name='update_progress'),

    # Leaderboard
    path('challenges/<int:challenge_id>/leaderboard/', challenges.challenge_leaderboard, name='challenge_leaderboard'),

    # Challenge search
    path('challenges/search/', challenges.search_challenges, name='search-challenges'),

    path('contact/', views.contact_submission, name='contact-submission'),


    path('reports/', report_views.create_report, name='create_report'),
    path('reports/user/', report_views.get_user_reports, name='get_user_reports'),
    path('reports/<int:report_id>/', report_views.get_report_detail, name='get_report_detail'),
    path('reports/<int:report_id>/delete/', report_views.delete_report, name='delete_report'),
    
    # Admin report endpoints
    path('admin/reports/', report_views.get_all_reports, name='get_all_reports'),
    path('admin/reports/<int:report_id>/status/', report_views.update_report_status, name='update_report_status'),


    # Mentor-Mentee Relationship endpoints
    path('mentor-relationships/', mentor_relationships.create_mentor_relationship, name='create_mentor_relationship'),
    path('mentor-relationships/user/', mentor_relationships.get_user_mentor_relationships, name='get_user_mentor_relationships'),
    path('mentor-relationships/<int:relationship_id>/', mentor_relationships.get_mentor_relationship_detail, name='get_mentor_relationship_detail'),
    path('mentor-relationships/<int:relationship_id>/status/', mentor_relationships.change_mentor_relationship_status, name='change_mentor_relationship_status'),
]

# Routers
router = DefaultRouter()
router.register(r'forums', ForumViewSet)
router.register(r'threads', ThreadViewSet)
router.register(r'ai-tutor', AiTutorViewSet, basename='ai-tutor')

urlpatterns += router.urls
