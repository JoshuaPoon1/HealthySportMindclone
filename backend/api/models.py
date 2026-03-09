from django.db import models
from django.contrib.auth.models import User

class UserStreak(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_checkin_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - Streak: {self.current_streak}"


class DailyCheckIn(models.Model):
    MOOD_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('neutral', 'Neutral'),
        ('bad', 'Bad'),
        ('terrible', 'Terrible'),
    ]
    
    READINESS_CHOICES = [
        ('ready', 'Ready'),
        ('somewhat', 'Somewhat Ready'),
        ('not_ready', 'Not Ready'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkins')
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    readiness = models.CharField(max_length=20, choices=READINESS_CHOICES)
    notes = models.TextField(blank=True)
    checkin_date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'checkin_date')
        ordering = ['-checkin_date']

    def __str__(self):
        return f"{self.user.email} - {self.checkin_date} ({self.mood})"
