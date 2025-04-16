from django.contrib.auth.models import AbstractUser
from django.db import models

class UserWithType(AbstractUser):
    email = models.EmailField(
        unique=True,
        help_text='Email address must be unique.',
    )
    user_type = models.CharField(choices=[('Coach', 'Coach'), ('User', 'User')], max_length=10)
    is_verified_coach = models.BooleanField(default=False)

