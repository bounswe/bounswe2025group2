from django.urls import path
from . import views

urlpatterns = [
    path('get-chat-groups/', views.get_chat_groups, name='get_chat_groups'),
    path('create-chat-group/', views.create_chat_group, name='create_chat_group'),
]
