from rest_framework import serializers
from api.models import UserStreak, DailyCheckIn


class DailyCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckIn
        fields = ['id', 'mood', 'readiness', 'notes', 'checkin_date', 'created_at']
        read_only_fields = ['checkin_date', 'created_at']


class UserStreakSerializer(serializers.ModelSerializer):
    recent_checkins = serializers.SerializerMethodField()

    class Meta:
        model = UserStreak
        fields = ['id', 'current_streak', 'longest_streak', 'last_checkin_date', 'recent_checkins']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recent_checkins(self, obj):
        checkins = obj.user.checkins.all()[:7]
        return DailyCheckInSerializer(checkins, many=True).data
