from django.contrib import admin

# Register your models here.

from .models import DirectMessage, DirectChat

admin.site.register(DirectChat)
admin.site.register(DirectMessage)


