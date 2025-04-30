from django.contrib import admin

# Register your models here.

from .models import ChatGroup, GroupMessage

admin.site.register(ChatGroup)
admin.site.register(GroupMessage)


