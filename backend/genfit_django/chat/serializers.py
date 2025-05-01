from .models import ChatGroup, GroupMessage
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

User = get_user_model()
class ChatGroupCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new chat group.
    """
    class Meta:
        model = ChatGroup
        fields = ['group_name']

    def validate_group_name(self, value):
        """
        Validate that the group name is unique.
        """
        if ChatGroup.objects.filter(group_name=value).exists():
            raise ValidationError(_('Group name already exists.'))
        return value

class ChatGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for the ChatGroup model.
    """
    class Meta:
        model = ChatGroup
        fields = ['id', 'group_name']
