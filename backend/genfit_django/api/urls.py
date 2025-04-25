from django.urls import path, include
from . import views

urlpatterns = [
    path('user/', views.get_user, name='get_user'),

    path('users/<str:username>/', views.mock_page, name="views.mock_page"),

    path('register/', views.register, name='register'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # Notifications end points
    path('notifications/', views.get_user_notifications, name='get_user_notifications'),
    path('notifications/<int:notification_id>/', views.get_single_notification, name='get_single_notification'),
    path('notifications/<int:notification_id>/mark-as-read/', views.mark_notification_read,
         name='mark_notification_read'),
    path('notifications/mark-all-as-read/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
]
