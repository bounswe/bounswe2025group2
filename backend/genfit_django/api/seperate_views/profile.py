from django.http import FileResponse, Http404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status
import os
import mimetypes
from django.conf import settings  # Add this import at the top

from ..models import Profile, UserWithType
from ..serializers import ProfileSerializer

MAX_IMG_SIZE = 5 * 1024 * 1024
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']


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
        old_picture = None
        if profile.profile_picture:
            old_picture = profile.profile_picture.path

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            if 'profile_picture' in request.FILES:
                file = request.FILES['profile_picture']

                # Validate file size
                if file.size > MAX_IMG_SIZE:
                    raise ValidationError("Profile picture size should not exceed 5MB.")

                # Validate file extension
                ext = os.path.splitext(file.name)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    raise ValidationError(f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")

                # Delete old picture if it exists and is not the default
                if old_picture and 'default.png' not in old_picture and os.path.exists(old_picture):
                    os.remove(old_picture)

                profile.profile_picture = file

            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_picture_file(request):
    profile = request.user.profile
    if not profile.profile_picture:
        # Try to serve default picture
        default_path = os.path.join(settings.MEDIA_ROOT, 'profile_pictures', 'default.png')
        if os.path.exists(default_path):
            return FileResponse(open(default_path, 'rb'), content_type='image/png', as_attachment=False)
        raise Http404("No profile picture and default missing.")

    file_path = profile.profile_picture.path

    try:
        if os.path.exists(file_path):
            content_type, _ = mimetypes.guess_type(file_path)
            return FileResponse(
                open(file_path, 'rb'), 
                content_type=content_type or 'application/octet-stream',
                as_attachment=False
            )
        else:
            raise Http404("File not found")
    except Exception as e:
        raise Http404(f"Error opening file: {str(e)}")




@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture(request):
    profile = request.user.profile

    if profile.profile_picture and 'default.png' not in profile.profile_picture.name:
        picture_path = profile.profile_picture.path
        if os.path.exists(picture_path):
            os.remove(picture_path)

    profile.profile_picture = 'profile_pictures/default.png'
    profile.save()

    return Response({'detail': 'Profile picture removed and reverted to default.'}, status=status.HTTP_200_OK)

