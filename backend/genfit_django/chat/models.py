from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DirectChat(models.Model):
    participants = models.ManyToManyField(User, related_name='direct_chats')
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        participant_names = ", ".join([user.username for user in self.participants.all()])
        return f"Chat between {participant_names}"

    class Meta:
        ordering = ['-created']

class DirectMessage(models.Model):
    chat = models.ForeignKey(DirectChat, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.CharField(max_length=300, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        if self.body:
            return f'{self.sender.username}: {self.body}'
        return None

    class Meta:
        ordering = ['created']