from rest_framework import status, generics
from rest_framework.response import Response
from ..models import Comment, Subcomment
from ..serializers import CommentSerializer, SubcommentSerializer
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated


# 1. Add a Comment
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, thread_id):
    serializer = CommentSerializer(
        data=request.data,
        context={'request': request, 'thread_id': thread_id}  # Add thread_id to context
    )
    if serializer.is_valid():
        comment = serializer.save()
        # Increment the comment count for the parent thread
        thread = comment.thread
        thread.comment_count += 1
        thread.save(update_fields=['comment_count'])
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 2. Delete a Comment
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    # Use serializer's delete logic
    serializer = CommentSerializer()
    serializer.delete(comment)

    return Response({'message': 'Comment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# 3. Update a Comment
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    serializer = CommentSerializer(comment, data=request.data, partial=False)  # Full update
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 4. Get a Comment
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    return Response(CommentSerializer(comment).data, status=status.HTTP_200_OK)


# 5. Get all comments for a Thread sorted by created_at
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comments_for_thread_by_date(request, thread_id):
    comments = Comment.objects.filter(thread_id=thread_id).order_by('created_at')
    serializer = CommentSerializer(comments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 6. Get all Comments for a Thread sorted by like_count
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_comments_for_thread_by_likes(request, thread_id):
    comments = Comment.objects.filter(thread_id=thread_id).order_by('-like_count')
    serializer = CommentSerializer(comments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 7. Add a Subcomment
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_subcomment(request, comment_id):
    serializer = SubcommentSerializer(
        data=request.data,
        context={'request': request, 'comment_id': comment_id}  # Add comment_id to context
    )
    if serializer.is_valid():
        subcomment = serializer.save()
        # Increment the subcomment count for the parent comment
        comment = subcomment.comment
        comment.subcomment_count += 1
        comment.save(update_fields=['subcomment_count'])
        return Response(SubcommentSerializer(subcomment).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 8. Delete a Subcomment
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(Subcomment, pk=subcomment_id)

    # Use serializer's custom delete method
    serializer = SubcommentSerializer()
    serializer.delete(subcomment)

    return Response({'message': 'Subcomment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# 9. Update a Subcomment
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(Subcomment, pk=subcomment_id)
    serializer = SubcommentSerializer(subcomment, data=request.data, partial=False)  # Full update
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 10. Get a Subcomment
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(Subcomment, pk=subcomment_id)
    return Response(SubcommentSerializer(subcomment).data, status=status.HTTP_200_OK)


# 11. Get all Subcomments for a Comment sorted by created_at
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subcomments_for_comment_by_date(request, comment_id):
    subcomments = Subcomment.objects.filter(comment_id=comment_id).order_by('created_at')
    serializer = SubcommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 12. Get all Subcomments for a Comment sorted by like_count
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subcomments_for_comment_by_likes(request, comment_id):
    subcomments = Subcomment.objects.filter(comment_id=comment_id).order_by('-like_count')
    serializer = SubcommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
