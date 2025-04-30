import json
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import ChatGroup, GroupMessage

class ChatroomConsumer(WebsocketConsumer):
    def connect(self):
        self.user = self.scope['user']
        self.chatroom_name = self.scope['url_route']['kwargs']['room_name']
        self.chatroom = get_object_or_404(ChatGroup, group_name=self.chatroom_name)

        # Join the group
        async_to_sync(self.channel_layer.group_add)(
            self.chatroom_name,
            self.channel_name
        )

        self.accept()

        # Send existing messages to the newly connected user
        messages = GroupMessage.objects.filter(group=self.chatroom).order_by('created')[:50]  # Changed to ascending order
        for message in messages:
            self.send(text_data=json.dumps({
                'message': {
                    'author': message.author.username,
                    'body': message.body,
                    'created': message.created.strftime('%Y-%m-%d %H:%M:%S')
                }
            }))

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        body = text_data_json['body']

        # Create the message in the database
        message = GroupMessage.objects.create(
            group=self.chatroom,
            author=self.user,
            body=body
        )

        # Broadcast to the group
        async_to_sync(self.channel_layer.group_send)(
            self.chatroom_name,
            {
                'type': 'chat_message',
                'message': {
                    'author': message.author.username,
                    'body': message.body,
                    'created': message.created.strftime('%Y-%m-%d %H:%M:%S')
                }
            }
        )

    def chat_message(self, event):
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': event['message']
        }))

    def disconnect(self, close_code):
        # Leave group
        async_to_sync(self.channel_layer.group_discard)(
            self.chatroom_name,
            self.channel_name
        )