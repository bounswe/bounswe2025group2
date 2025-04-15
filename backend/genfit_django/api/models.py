from django.db import models

# Create your models here.
# Create a model for the Challenge entity
class Challenge(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# Create a leaderboard model which references the Challenge model
class Leaderboard(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    user = models.CharField(max_length=255)
    score = models.IntegerField()
    rank = models.IntegerField()

    def __str__(self):
        return f"{self.user} - {self.challenge.title} - {self.score}"

