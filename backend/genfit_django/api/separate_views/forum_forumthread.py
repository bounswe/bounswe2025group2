from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Forum, Thread
from ..serializers import ForumSerializer, ThreadListSerializer, ThreadDetailSerializer
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
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
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