from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from datetime import date, timedelta
import os
import requests
import feedparser
from bs4 import BeautifulSoup
from django.http import JsonResponse
from api.models import UserStreak, DailyCheckIn
from api.serializers.streakSerializers import UserStreakSerializer, DailyCheckInSerializer
from rest_framework.authtoken.models import Token


def get_user_from_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header:
        return None

    parts = auth_header.split(" ")
    if len(parts) != 2:
        return None

    scheme, key = parts
    if scheme not in ["Token", "Bearer"]:
        return None

    try:
        token = Token.objects.get(key=key)
        return token.user
    except Token.DoesNotExist:
        return None


def build_checkin_summary(user):
    recent = list(
        DailyCheckIn.objects.filter(user=user).order_by("-checkin_date")[:14]
    )
    streak, _ = UserStreak.objects.get_or_create(user=user)

    mood_counts = {
        "excellent": 0,
        "good": 0,
        "neutral": 0,
        "bad": 0,
        "terrible": 0,
    }
    for entry in recent:
        mood_counts[entry.mood] = mood_counts.get(entry.mood, 0) + 1

    notes = [c.notes.strip() for c in recent if c.notes and c.notes.strip()][:5]

    return {
        "recent_count": len(recent),
        "mood_counts": mood_counts,
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_checkin_date": str(streak.last_checkin_date) if streak.last_checkin_date else None,
        "notes": notes,
    }


def local_recommendation(summary):
    moods = summary["mood_counts"]
    negative = moods.get("bad", 0) + moods.get("terrible", 0)
    positive = moods.get("good", 0) + moods.get("excellent", 0)

    if summary["recent_count"] == 0:
        return "Start with one daily check-in this week and keep notes short (1-2 lines). Build consistency first, then review patterns after 7 days."

    if negative >= 3:
        return "Your recent trend shows some strain. Recommendation: schedule one light recovery day, reduce training intensity by 10-20% for the next 48 hours, and prioritize sleep + hydration."

    if positive >= 5 and summary["current_streak"] >= 3:
        return "Great momentum. Keep your current routine and add one small challenge this week (e.g., extra mobility session or short reflection note after practice)."

    return "You're building consistency. Keep daily check-ins, add brief notes on stress/sleep, and review your streak every 3-4 days to spot patterns."


class RegisterView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "User created successfully",
            "token": token.key,
            "email": user.email,
        }, status=201)







class LoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(username=email, password=password)

        if user is None:
            return Response({"error": "Invalid email or password"}, status=400)

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "email": user.email,
        }, status=200)








def extract_image(entry):
    media = entry.get("media_content")
    if media and isinstance(media, list):
        return media[0].get("url")

    enclosure = entry.get("enclosures")
    if enclosure and len(enclosure) > 0:
        return enclosure[0].get("href")

    html = entry.get("content", [{}])[0].get("value") or entry.get("description", "")
    soup = BeautifulSoup(html, "html.parser")
    img = soup.find("img")
    if img and img.get("src"):
        return img["src"]

    return None


def rss_proxy(request):
    url = request.GET.get("url")
    if not url:
        return JsonResponse({"error": "Missing ?url="}, status=400)

    try:
        resp = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            timeout=10
        )

        feed = feedparser.parse(resp.content)

        items = []
        for entry in feed.entries:
            items.append({
                "title": entry.get("title"),
                "link": entry.get("link"),
                "published": entry.get("published", None),
                "summary": entry.get("summary", None),
                "image": extract_image(entry),
            })

        return JsonResponse({
            "feed_title": feed.feed.get("title"),
            "feed_link": feed.feed.get("link"),
            "items": items
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


class StreakView(APIView):
    """Get user's current streak and check-in history"""
    def get(self, request):
        user = get_user_from_token(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        try:
            streak = UserStreak.objects.get(user=user)
            serializer = UserStreakSerializer(streak)
            return Response(serializer.data, status=200)
        except UserStreak.DoesNotExist:
            streak = UserStreak.objects.create(user=user)
            serializer = UserStreakSerializer(streak)
            return Response(serializer.data, status=200)


class CheckInView(APIView):
    """Create a new daily check-in"""
    def post(self, request):
        user = get_user_from_token(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        mood = request.data.get("mood")
        readiness = request.data.get("readiness")
        notes = request.data.get("notes", "")

        if not mood or not readiness:
            return Response({"error": "mood and readiness are required"}, status=400)

        try:
            # Create or update today's check-in
            checkin, created = DailyCheckIn.objects.get_or_create(
                user=user,
                checkin_date=date.today(),
                defaults={"mood": mood, "readiness": readiness, "notes": notes}
            )

            if not created:
                checkin.mood = mood
                checkin.readiness = readiness
                checkin.notes = notes
                checkin.save()

            # Update streak
            streak, _ = UserStreak.objects.get_or_create(user=user)
            today = date.today()

            if streak.last_checkin_date == today:
                # Already checked in today
                pass
            elif streak.last_checkin_date == today - timedelta(days=1):
                # Consecutive day — increment streak
                streak.current_streak += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
            else:
                # Streak broken or first check-in
                streak.current_streak = 1

            streak.last_checkin_date = today
            streak.save()

            return Response({
                "message": "Check-in recorded",
                "checkin": DailyCheckInSerializer(checkin).data,
                "streak": UserStreakSerializer(streak).data
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class RecommendationView(APIView):
    """Return AI recommendation based on check-ins and streak history"""
    def get(self, request):
        user = get_user_from_token(request)
        if not user:
            return Response({"error": "Unauthorized"}, status=401)

        summary = build_checkin_summary(user)

        api_key = os.environ.get("OPENAI_API_KEY")
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

        if not api_key:
            return Response({
                "recommendation": local_recommendation(summary),
                "source": "rule-based",
                "fallback_reason": "missing_openai_api_key",
            }, status=200)

        try:
            prompt = (
                "You are a supportive sports wellness assistant. "
                "Give one concise actionable recommendation (max 80 words) based on this user data: "
                f"{summary}. Focus on recovery, consistency, and mental well-being."
            )

            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You provide safe, concise sports-wellness recommendations."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.4,
                },
                timeout=20,
            )

            if resp.status_code >= 400:
                reason = "openai_error"
                try:
                    err = resp.json().get("error", {})
                    reason = err.get("type") or reason
                except Exception:
                    pass
                return Response({
                    "recommendation": local_recommendation(summary),
                    "source": "rule-based",
                    "fallback_reason": reason,
                }, status=200)

            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()

            return Response({
                "recommendation": content,
                "source": "openai",
            }, status=200)
        except Exception:
            return Response({
                "recommendation": local_recommendation(summary),
                "source": "rule-based",
                "fallback_reason": "request_exception",
            }, status=200)
