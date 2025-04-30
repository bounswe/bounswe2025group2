from django.contrib import admin
from .models import UserWithType, Notification, FitnessGoal, Profile

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
    pass


@admin.register(Subcomment)
class SubcommentAdmin(admin.ModelAdmin):
    pass


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    # Optional
    pass
