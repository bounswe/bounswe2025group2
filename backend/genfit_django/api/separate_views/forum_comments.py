from rest_framework import status, generics
from rest_framework.response import Response
from .models import Comment, SubComment
from .serializers import CommentSerializer, SubCommentSerializer
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404


# 1. Add a Comment
@api_view(['POST'])
def add_comment(request, thread_id):
    data = request.data
    data['thread'] = thread_id  # Attach the thread_id to the comment

    serializer = CommentSerializer(data=data)
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
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)

    # Use serializer's delete logic
    serializer = CommentSerializer()
    serializer.delete(comment)

    return Response({'message': 'Comment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# 3. Update a Comment
@api_view(['PUT'])
def update_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    serializer = CommentSerializer(comment, data=request.data, partial=False)  # Full update
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 4. Get a Comment
@api_view(['GET'])
def get_comment(request, comment_id):
    comment = get_object_or_404(Comment, pk=comment_id)
    return Response(CommentSerializer(comment).data, status=status.HTTP_200_OK)


# 5. Get all SubComments for a Thread sorted by created_at
@api_view(['GET'])
def get_subcomments_for_thread_by_date(request, thread_id):
    subcomments = SubComment.objects.filter(comment__thread_id=thread_id).order_by('created_at')
    serializer = SubCommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 6. Get all SubComments for a Thread sorted by like_count
@api_view(['GET'])
def get_subcomments_for_thread_by_likes(request, thread_id):
    subcomments = SubComment.objects.filter(comment__thread_id=thread_id).order_by('-like_count')
    serializer = SubCommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 7. Add a SubComment
@api_view(['POST'])
def add_subcomment(request, comment_id):
    data = request.data
    data['comment'] = comment_id  # Attach the comment_id to the subcomment

    serializer = SubCommentSerializer(data=data)
    if serializer.is_valid():
        subcomment = serializer.save()
        # Increment the subcomment count for the parent comment
        comment = subcomment.comment
        comment.subcomment_count += 1
        comment.save(update_fields=['subcomment_count'])
        return Response(SubCommentSerializer(subcomment).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 8. Delete a SubComment
@api_view(['DELETE'])
def delete_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(SubComment, pk=subcomment_id)

    # Use serializer's custom delete method
    serializer = SubCommentSerializer()
    serializer.delete(subcomment)

    return Response({'message': 'SubComment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# 9. Update a SubComment
@api_view(['PUT'])
def update_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(SubComment, pk=subcomment_id)
    serializer = SubCommentSerializer(subcomment, data=request.data, partial=False)  # Full update
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 10. Get a SubComment
@api_view(['GET'])
def get_subcomment(request, subcomment_id):
    subcomment = get_object_or_404(SubComment, pk=subcomment_id)
    return Response(SubCommentSerializer(subcomment).data, status=status.HTTP_200_OK)


# 11. Get all SubComments for a Comment sorted by created_at
@api_view(['GET'])
def get_subcomments_for_comment_by_date(request, comment_id):
    subcomments = SubComment.objects.filter(comment_id=comment_id).order_by('created_at')
    serializer = SubCommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# 12. Get all SubComments for a Comment sorted by like_count
@api_view(['GET'])
def get_subcomments_for_comment_by_likes(request, comment_id):
    subcomments = SubComment.objects.filter(comment_id=comment_id).order_by('-like_count')
    serializer = SubCommentSerializer(subcomments, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
