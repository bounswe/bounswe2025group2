from django.urls import re_path
from .consumers import DirectChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<chat_id>\d+)/$', DirectChatConsumer.as_asgi()),
]
