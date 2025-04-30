from django.urls import path
from .consumers import *

websocket_urlpatterns = [
    path('ws/chat/<str:room_name>/', ChatroomConsumer.as_asgi()),
]