from django.urls import path
from . import views

urlpatterns = [
    path('get-users/', views.get_users, name='get_users'),
    path('get-chats/', views.get_chats, name='get_chats'),
    path('create-chat/', views.create_chat, name='create_chat'),
]