from django.contrib import admin
from .models import UserWithType, Notification, FitnessGoal, Profile, Comment, Subcomment

@admin.register(UserWithType)
class UserWithTypeAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'is_verified_coach')
    search_fields = ('username', 'email')
    list_filter = ('user_type', 'is_verified_coach')
    ordering = ('username',)
    list_per_page = 20

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'sender', 'notification_type', 'title', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'title')
    list_filter = ('notification_type', 'is_read')
    ordering = ('-created_at',)
    list_per_page = 20

@admin.register(FitnessGoal)
class FitnessGoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'mentor', 'goal_type', 'status', 'progress_percentage')
    list_filter = ('goal_type', 'status', 'start_date')
    search_fields = ('title', 'description', 'user__username', 'mentor__username')
    readonly_fields = ('progress_percentage',)
    date_hierarchy = 'start_date'
    list_per_page = 20
    
    def progress_percentage(self, obj):
        return f"{obj.progress_percentage:.1f}%"
    progress_percentage.short_description = 'Progress'

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display   = ("user", "location", "created_at")
    search_fields  = ("user__username", "location")
    list_filter    = ("created_at", )


@admin.register(Forum)
class ForumAdmin(admin.ModelAdmin):
    pass


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    pass


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'thread', 'short_content', 'like_count', 'subcomment_count', 'created_at')
    search_fields = ('author__username', 'content')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')

    def short_content(self, obj):
        return (obj.content[:50] + '...') if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content'

@admin.register(Subcomment)
class SubcommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'comment', 'short_content', 'like_count', 'created_at')
    search_fields = ('author__username', 'content')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')

    def short_content(self, obj):
        return (obj.content[:50] + '...') if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content'

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_type', 'object_id', 'vote_type', 'created_at', 'updated_at')
    list_filter = ('vote_type', 'content_type', 'created_at')
    search_fields = ('user__username', 'object_id')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_type')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new vote
            obj.save()
            obj.update_content_like_count(increment=True)
        else:  # Modifying existing vote
            old_vote = Vote.objects.get(pk=obj.pk)
            old_vote_type = old_vote.vote_type
            obj.save()
            if old_vote_type != obj.vote_type:
                obj.update_content_like_count(increment=True, old_vote_type=old_vote_type)
    
    def delete_model(self, request, obj):
        obj.update_content_like_count(increment=False)
        obj.delete()
    
    def delete_queryset(self, request, queryset):
        for obj in queryset:
            obj.update_content_like_count(increment=False)
        queryset.delete()
