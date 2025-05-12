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
from .separate_views import quote_views


urlpatterns = [
    path('register/', views.register, name='register'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('user/', views.get_user, name='get_user'),
    path('users/', views.get_users, name='get_users'),
    path('change-password/', views.change_password, name='change_password'),
    path('delete-account/', views.delete_account, name='delete_account'),


    # Notifications
    path('notifications/', views.get_user_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/', views.get_single_notification, name='get_single_notification'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),

    # Quote endpoints
    path('quotes/random/', quote_views.get_random_quote, name='get_random_quote'),
    path('quotes/daily/', quote_views.get_daily_quote, name='get_daily_quote'),

    # Fitness Goals URLs
    path('goals/', fitness_goals.fitness_goals, name='fitness_goals'),
    path('goals/<int:goal_id>/', fitness_goals.fitness_goal_detail, name='fitness_goal_detail'),
    path('goals/<int:goal_id>/progress/', fitness_goals.update_goal_progress, name='update_goal_progress'),
    path('goals/check-inactive/', fitness_goals.check_inactive_goals, name='check_inactive_goals'),

    #Profile URLs
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
    # get info about whether a user voted on the content
    path('forum/vote/<str:content_type>/<int:object_id>/status/', forum_vote.get_user_vote, name='get_user_vote'),

    # Challenge-related views
    path('challenges/<int:challenge_id>/', challenges.get_challenge_detail, name='get_challenge_detail'),
    path('challenges/create/', challenges.create_challenge, name='create_challenge'),
    path('challenges/<int:challenge_id>/update/', challenges.update_challenge, name='update_challenge'),
    path('challenges/<int:challenge_id>/delete/', challenges.delete_challenge, name='delete_challenge'),

    # Participant-related views
    path('challenges/<int:challenge_id>/join/', challenges.join_challenge, name='join_challenge'),
    path('challenges/<int:challenge_id>/leave/', challenges.leave_challenge, name='leave_challenge'),
    path('challenges/<int:challenge_id>/update-progress/', challenges.update_progress, name='update_progress'),

    # Leaderboard-related view
    path('challenges/<int:challenge_id>/leaderboard/', challenges.challenge_leaderboard, name='challenge_leaderboard'),

    # Interactive search directory for challenges
    path('challenges/search/', challenges.search_challenges, name='search_challenges'),
]

router = DefaultRouter()
router.register(r'forums', ForumViewSet)
router.register(r'threads', ThreadViewSet)
router.register(r'ai-tutor', AiTutorViewSet, basename='ai-tutor')

urlpatterns += router.urls
