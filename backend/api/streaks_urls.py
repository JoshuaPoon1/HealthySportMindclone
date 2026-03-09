from django.urls import path
from .views import StreakView, CheckInView, RecommendationView

urlpatterns = [
    path("streak/", StreakView.as_view(), name="streak"),
    path("checkin/", CheckInView.as_view(), name="checkin"),
    path("recommendation/", RecommendationView.as_view(), name="recommendation"),
]
