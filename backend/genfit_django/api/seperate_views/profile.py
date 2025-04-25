from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status

import os

from ..models import Profile
from ..serializers import ProfileSerializer



MAX_IMG_SIZE = 5 * 1024 * 1024

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def profile_detail(request):
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        profile = Profile.objects.create(user=request.user)

    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            # Handle profile picture upload
            if 'profile_picture' in request.FILES:
                file = request.FILES['profile_picture']

                # Check if file size exceeds limit
                if file.size > MAX_IMG_SIZE:  # 5MB limit
                    raise ValidationError("Profile picture size should not exceed 5MB.")

                profile.profile_picture = file
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_picture_file(request):
    profile = request.user.profile
    if not profile.profile_picture:
        raise Http404("No profile picture found")

    file_path = profile.profile_picture.path

    try:
        if os.path.exists(file_path):
            # Use a context manager to open the file safely
            with open(file_path, 'rb') as file:
                return FileResponse(file, content_type='image/jpeg')
        else:
            raise Http404("File not found")
    except Exception as e:
        raise Http404(f"Error opening file: {str(e)}")
