from django.urls import path
from . import views
from .seperate_views import fitness_goals
from .separate_views import profile


urlpatterns = [
    path('register/', views.register, name='register'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('notifications/', views.get_user_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/', views.get_single_notification, name='get_single_notification'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('user/', views.get_user, name='get_user'),
    # Fitness Goals URLs
    path('goals/', fitness_goals.fitness_goals, name='fitness_goals'),
    path('goals/<int:goal_id>/', fitness_goals.fitness_goal_detail, name='fitness_goal_detail'),
    path('goals/<int:goal_id>/progress/', fitness_goals.update_goal_progress, name='update_goal_progress'),
    path('goals/check-inactive/', fitness_goals.check_inactive_goals, name='check_inactive_goals'),
    path('profile/', profile.profile_detail, name='profile-detail'),
    path('profile/picture/', profile.get_profile_picture_file, name='get-profile-picture'),  # Current user
    path('profile/picture/<str:username>/', profile.get_profile_picture_file, name='get-other-profile-picture'),  # Other user
    path('profile/picture/delete/', profile.delete_profile_picture, name='delete-profile-picture'),
]
