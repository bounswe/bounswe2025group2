from django.urls import path
from .consumers import DirectChatConsumer

websocket_urlpatterns = [
    path('ws/chat/<int:chat_id>/', DirectChatConsumer.as_asgi()),
]