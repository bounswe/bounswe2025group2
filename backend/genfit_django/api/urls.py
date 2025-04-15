from django.contrib import admin
# import the user model

from django.urls import path, include
from .views import users

urlpatterns = [
    # create a mock endpoint for the api
    path('users/', users, name='users'),
]
