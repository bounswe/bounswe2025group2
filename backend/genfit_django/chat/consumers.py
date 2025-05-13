import json
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import DirectChat, DirectMessage
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

# Set up logging
logger = logging.getLogger(__name__)

class DirectChatConsumer(WebsocketConsumer):
    def connect(self):
        self.user = self.scope['user']

        # Check if user is authenticated
        if not self.user.is_authenticated:
            logger.error(f"Unauthenticated user tried to connect to chat")
            self.close()
            return

        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'

        # Get the direct chat and verify the user is a participant
        try:
            self.chat = DirectChat.objects.get(id=self.chat_id)
            if self.user not in self.chat.participants.all():
                logger.warning(f"User {self.user.username} tried to access chat {self.chat_id} but is not a participant")
                self.close()
                return
        except DirectChat.DoesNotExist:
            logger.warning(f"Chat {self.chat_id} does not exist")
            self.close()
            return
        except Exception as e:
            logger.error(f"Error connecting to chat {self.chat_id}: {str(e)}")
            self.close()
            return

        # Join the group
        try:
            async_to_sync(self.channel_layer.group_add)(
                self.chat_group_name,
                self.channel_name
            )
            self.accept()
        except Exception as e:
            logger.error(f"Error joining chat group: {str(e)}")
            self.close()
            return

        try:
            # Send existing messages to the newly connected user
            messages = DirectMessage.objects.filter(chat=self.chat).order_by('created')
            for message in messages:
                self.send(text_data=json.dumps({
                    'message': {
                        'id': message.id,
                        'sender': message.sender.username,
                        'body': message.body,
                        'created': message.created.strftime('%Y-%m-%d %H:%M:%S'),
                        'is_read': message.is_read
                    }
                }))

            # Mark all unread messages from other users as read
            DirectMessage.objects.filter(
                chat=self.chat,
                is_read=False
            ).exclude(sender=self.user).update(is_read=True)
        except Exception as e:
            logger.error(f"Error loading messages: {str(e)}")
            # We don't close here, as the connection is already established

    def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            body = text_data_json['body']

            # Create the message in the database
            message = DirectMessage.objects.create(
                chat=self.chat,
                sender=self.user,
                body=body
            )

            # Broadcast to the group
            async_to_sync(self.channel_layer.group_send)(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message.id,
                        'sender': message.sender.username,
                        'body': message.body,
                        'created': message.created.strftime('%Y-%m-%d %H:%M:%S'),
                        'is_read': message.is_read
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            self.send(text_data=json.dumps({
                'error': 'An error occurred while processing your message'
            }))

    def chat_message(self, event):
        # Send message to WebSocket
        try:
            self.send(text_data=json.dumps({
                'message': event['message']
            }))
        except Exception as e:
            logger.error(f"Error sending message to client: {str(e)}")

    def disconnect(self, close_code):
        # Leave group
        try:
            async_to_sync(self.channel_layer.group_discard)(
                self.chat_group_name,
                self.channel_name
            )
        except Exception as e:
            logger.error(f"Error disconnecting from chat: {str(e)}")


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['body']
        sender = self.scope["user"].username

        # You can save to DB here if needed

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': 1,  # dummy ID
                    'sender': sender,
                    'body': message,
                    'created': '',  # you can add timestamp here
                    'is_read': False
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))
