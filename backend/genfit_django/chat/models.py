from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatGroup(models.Model):
    group_name = models.CharField(max_length=128, unique=True, blank=True)

    def __str__(self):
        return self.group_name

class GroupMessage(models.Model):
    group = models.ForeignKey(ChatGroup, related_name='chat_messages', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.CharField(max_length=300, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.body:
            return f'{self.author.username} : {self.body}'
        return None

    class Meta:
        ordering = ['-created']
