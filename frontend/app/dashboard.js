import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, Text, TouchableOpacity, View , Image, Linking, Alert, TextInput, Modal, Platform } from "react-native";
import { useState,useEffect } from "react";
import styles from "../styles/dashboardStyles";
import { fetchRSS } from "../hooks/fetchRSS";
import { getStreak, postCheckIn } from "../services/api/streaksApi";
import { getRecommendation } from "../services/api/recommendationApi";
import { triggerDynamicNotificationTest, getRandomDynamicMessage } from "../services/notifications/dailyDynamicNotification";

export default function Dashboard({ user, profile }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState("");
  const [showNotificationPreview, setShowNotificationPreview] = useState(false);
  const [notificationPreviewText, setNotificationPreviewText] = useState("");
  
  useEffect(() => {
    async function load() {
      try {
        const itemsFromFeed = await fetchRSS("https://www.cbssports.com/rss/headlines/");
        setItems(itemsFromFeed || []);
      } catch (err) {
        console.error("RSS fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadStreak() {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          const response = await getStreak(token);
          setStreak(response.data);
        }
      } catch (err) {
        console.error("Streak fetch error:", err);
        if (err?.response?.status === 401) {
          await AsyncStorage.removeItem("accessToken");
          setCheckInMessage("Session expired. Please log in again.");
          navigation.replace("index");
        }
      } finally {
        setStreakLoading(false);
      }
    }
    loadStreak();
  }, []);
  const navigation = useNavigation();
  const handleLogout = async () => {
    await AsyncStorage.removeItem("accessToken");
    navigation.replace("index");
  };

  const handleCheckIn = async () => {
    setShowMoodPicker(true);
  };

  const submitCheckIn = async (mood) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        await postCheckIn(token, mood, "ready", checkInNotes);
        const response = await getStreak(token);
        setStreak(response.data);
        setShowMoodPicker(false);
        setCheckInNotes("");
        setCheckInMessage("Check-in recorded.");
        Alert.alert("Success", "Check-in recorded!");
      } else {
        setCheckInMessage("Session expired. Please log in again.");
        navigation.replace("index");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      const apiMessage = err?.response?.data?.error;
      if (err?.response?.status === 401) {
        await AsyncStorage.removeItem("accessToken");
        setCheckInMessage("Session expired. Please log in again.");
        Alert.alert("Session expired", "Please log in again.");
        navigation.replace("index");
        return;
      }

      setCheckInMessage(apiMessage || "Failed to record check-in.");
      Alert.alert("Error", apiMessage || "Failed to record check-in");
    }
  };

  const handleGetRecommendation = async () => {
    try {
      setAiLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        setCheckInMessage("Session expired. Please log in again.");
        navigation.replace("index");
        return;
      }

      const data = await getRecommendation(token);
      setAiRecommendation(data?.recommendation || "No recommendation available yet.");
      setAiSource(data?.source || "unknown");
      if (data?.source === "rule-based" && data?.fallback_reason) {
        setCheckInMessage(`AI fallback: ${data.fallback_reason}`);
      }
    } catch (err) {
      console.error("Recommendation error:", err);
      setAiRecommendation("Could not fetch recommendation right now.");
      setAiSource("error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await triggerDynamicNotificationTest();
      if (!result?.ok) {
        if (result?.reason === "web_unsupported") {
          setCheckInMessage("Web preview: local push popup is not supported here.");
          const preview = getRandomDynamicMessage();
          setNotificationPreviewText(preview);
          setShowNotificationPreview(true);
          return;
        }
        setCheckInMessage("Notifications are disabled. Enable them in app/system settings.");
        Alert.alert("Notifications disabled", "Please allow notifications for this app.");
        return;
      }

      setCheckInMessage("Test notification triggered.");
      Alert.alert("Sent", "Test notification has been triggered.");
    } catch (e) {
      console.error("Test notification error:", e);
      setCheckInMessage("Test notification failed. Check platform permissions.");
      Alert.alert("Error", "Could not trigger test notification.");
    }
  };

  return (
    <ScrollView style={styles.container}>
  {/* Top Bar */}
  <View style={styles.topBar}>
    <Text style={styles.title}>HealthySportMind</Text>

    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutText}>Log Out</Text>
    </TouchableOpacity>
  </View>

  {/* Main Card */}
  <View style={styles.card}>
    <Text style={styles.welcome}>
      Welcome, {profile?.email || user?.email}
    </Text>

    <Text style={styles.subtitle}>
      You&#39;re logged in and ready to go.
    </Text>

    {/* Info Grid */}
    <View style={styles.grid}>
      {/* Card 1 */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Your Sport</Text>
        <Text style={styles.cardValue}>
          {profile?.sport || "No sport set"}
        </Text>
      </View>

      {/* Card 2 */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Daily Check‑In</Text>
        <Text style={styles.cardSubtitle}>
          Track your mood and mark today complete.
        </Text>

        <TouchableOpacity 
          style={styles.checkInButton}
          onPress={handleCheckIn}
        >
          <Text style={styles.checkInButtonText}>Start Daily Check-In</Text>
        </TouchableOpacity>

        {checkInMessage ? <Text style={styles.cardSubtitle}>{checkInMessage}</Text> : null}
      </View>

      {/* Card 3 */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Streaks</Text>
        {streakLoading ? (
          <Text style={styles.cardSubtitle}>Loading...</Text>
        ) : streak ? (
          <>
            <Text style={styles.cardValue}>{streak.current_streak} days</Text>
            <Text style={styles.cardSubtitle}>
              Best: {streak.longest_streak} days
            </Text>
          </>
        ) : (
          <Text style={styles.cardSubtitle}>No streak yet. Complete a daily check-in to start one.</Text>
        )}
      </View>

      {/* Card 4 */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>AI Recommendation</Text>
        <Text style={styles.cardSubtitle}>
          Get a personalized recommendation from your recent check-ins.
        </Text>

        <TouchableOpacity
          style={styles.checkInButton}
          onPress={handleGetRecommendation}
          disabled={aiLoading}
        >
          <Text style={styles.checkInButtonText}>{aiLoading ? "Thinking..." : "Get Recommendation"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkInButton}
          onPress={handleTestNotification}
        >
          <Text style={styles.checkInButtonText}>Test Notification</Text>
        </TouchableOpacity>

        {aiRecommendation ? (
          <>
            <Text style={styles.cardSubtitle}>{aiRecommendation}</Text>
            <Text style={styles.cardSubtitle}>Source: {aiSource}</Text>
          </>
        ) : null}
      </View>
    </View>
  </View>

  {/* News Feed Card */}
  <View style={styles.newsCard}>
  <Text style={styles.sectionTitle}>Helpful Articles</Text>

  {loading && <Text>Loading articles...</Text>}

  {!loading && items?.slice(0, 3).map((item) => (
    <View key={item.link} style={styles.articleCard}>

      {item.image && (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.image }}
            style={styles.articleImage}
            resizeMode="contain"
          />
        </View>
      )}

      <Text style={styles.articleTitle}>{item.title}</Text>

      <Text style={styles.articleDescription} numberOfLines={3}>
        {item.summary}
      </Text>

      <TouchableOpacity
        style={styles.readMoreButton}
        onPress={() => Linking.openURL(item.link)}
      >
        <Text style={styles.readMoreText}>Read More</Text>
      </TouchableOpacity>

    </View>
  ))}
</View>

<Modal
  visible={showMoodPicker}
  transparent
  animationType="fade"
  onRequestClose={() => setShowMoodPicker(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Daily Check-In</Text>
      <Text style={styles.cardSubtitle}>Optional: share how you feel today</Text>

      <TextInput
        style={styles.checkInNotesInput}
        placeholder="Write your thoughts..."
        value={checkInNotes}
        onChangeText={setCheckInNotes}
        multiline
      />

      <View style={styles.moodRow}>
        <TouchableOpacity style={styles.moodButton} onPress={() => submitCheckIn("excellent")}><Text style={styles.moodButtonText}>Excellent</Text></TouchableOpacity>
        <TouchableOpacity style={styles.moodButton} onPress={() => submitCheckIn("good")}><Text style={styles.moodButtonText}>Good</Text></TouchableOpacity>
        <TouchableOpacity style={styles.moodButton} onPress={() => submitCheckIn("neutral")}><Text style={styles.moodButtonText}>Neutral</Text></TouchableOpacity>
        <TouchableOpacity style={styles.moodButton} onPress={() => submitCheckIn("bad")}><Text style={styles.moodButtonText}>Bad</Text></TouchableOpacity>
        <TouchableOpacity style={styles.moodButton} onPress={() => submitCheckIn("terrible")}><Text style={styles.moodButtonText}>Terrible</Text></TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.modalCloseButton}
        onPress={() => setShowMoodPicker(false)}
      >
        <Text style={styles.checkInButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal
  visible={showNotificationPreview}
  transparent
  animationType="fade"
  onRequestClose={() => setShowNotificationPreview(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Notification Preview</Text>
      <Text style={styles.cardSubtitle}>
        {Platform.OS === "web" ? "Web fallback preview" : "Test notification message"}
      </Text>
      <Text style={styles.cardValue}>{notificationPreviewText}</Text>

      <TouchableOpacity
        style={styles.modalCloseButton}
        onPress={() => setShowNotificationPreview(false)}
      >
        <Text style={styles.checkInButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
</ScrollView>
  );
}