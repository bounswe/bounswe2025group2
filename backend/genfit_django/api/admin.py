from django.contrib import admin
from .models import UserWithType, Notification, FitnessGoal, Profile, Forum, Thread, Comment, Subcomment, Vote, Challenge, ChallengeParticipant

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
    list_display   = ("user", "name", "surname", "location", "created_at")
    search_fields  = ("user__username", "name", "surname", "location")
    list_filter    = ("created_at",)

@admin.register(Forum)
class ForumAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'created_at', 'is_active', 'thread_count')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('order', 'title')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'forum', 'author', 'created_at', 'is_pinned', 'is_locked', 'view_count', 'like_count')
    list_filter = ('is_pinned', 'is_locked', 'created_at', 'forum')
    search_fields = ('title', 'content', 'author__username')
    readonly_fields = ('created_at', 'updated_at', 'view_count', 'like_count')
    raw_id_fields = ('author', 'forum')


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

# Admin for Challenge model
@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'coach', 'start_date', 'end_date', 'target_value', 'unit', 'is_active')
    list_filter = ('challenge_type', 'coach', 'start_date', 'end_date', 'created_at')
    search_fields = ('title', 'description', 'coach__username')
    ordering = ('-start_date',)
    readonly_fields = ('created_at',)

    def is_active(self, obj):
        return obj.is_active()
    is_active.boolean = True
    is_active.short_description = 'Active'


# Admin for ChallengeParticipant model
@admin.register(ChallengeParticipant)
class ChallengeParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'challenge', 'current_value', 'joined_at', 'finish_date')
    list_filter = ('challenge', 'user', 'joined_at', 'finish_date')
    search_fields = ('user__username', 'challenge__title')
    ordering = ('-joined_at',)
    readonly_fields = ('joined_at', 'last_updated', 'finish_date')