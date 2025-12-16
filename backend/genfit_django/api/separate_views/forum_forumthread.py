from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Forum, Thread, ThreadBookmark
from ..serializers import ForumSerializer, ThreadListSerializer, ThreadDetailSerializer, ThreadBookmarkSerializer
from ..permissions import IsAuthorOrReadOnly

class ForumViewSet(viewsets.ModelViewSet):
    queryset = Forum.objects.all()
    serializer_class = ForumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        """
        Override get_permissions to ensure only admin users can create/modify forums
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=['get'])
    def threads(self, request, pk=None):
        forum = self.get_object()
        threads = Thread.objects.filter(forum=forum)
        serializer = ThreadListSerializer(threads, many=True)
        return Response(serializer.data)

class ThreadViewSet(viewsets.ModelViewSet):
    queryset = Thread.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return ThreadListSerializer
        return ThreadDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update a thread (only by author)"""
        instance = self.get_object()
        # Use partial=True to allow updating only some fields
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a thread (only by author)"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Thread deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, pk=None):
        """Toggle bookmark status for a thread"""
        thread = self.get_object()
        user = request.user
        
        bookmark, created = ThreadBookmark.objects.get_or_create(user=user, thread=thread)
        
        if not created:
            bookmark.delete()
            return Response({'status': 'unbookmarked', 'is_bookmarked': False})
            
        return Response({'status': 'bookmarked', 'is_bookmarked': True})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def bookmarked(self, request):
        """List threads bookmarked by the current user"""
        user = request.user
        bookmarked_threads = Thread.objects.filter(bookmarks__user=user)
        
        page = self.paginate_queryset(bookmarked_threads)
        if page is not None:
            serializer = ThreadListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ThreadListSerializer(bookmarked_threads, many=True)
        return Response(serializer.data)
 