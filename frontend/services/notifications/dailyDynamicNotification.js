import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const STORAGE_KEY = "daily_dynamic_notification_scheduled_v1";

const DYNAMIC_MESSAGES = [
  "Snack smarter than that last play call. Choose veggies over regret!",
  "Timeout? Do 10 squats and hydrate. Mini win = momentum shift!",
  "Your goals matter—today’s choices are tomorrow’s progress.",
  "Drop your best team emoji in chat—positive vibes fuel fans like players.",
  "Fan challenge: first to finish a glass of water by the next play = true MVP.",
  "Challenge: Celebrate with a walk around the block. Can you beat the buzzer?",
  "Quick challenge: 10 squats before the next play—game on?",
  "True fans fuel with balance—show your pride with one healthy choice now.",
  "Break time = breathe time. Inhale calm, exhale stress.",
  "Stand up during commercials—shake off the couch slouch.",
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function randomMessage() {
  return DYNAMIC_MESSAGES[Math.floor(Math.random() * DYNAMIC_MESSAGES.length)];
}

export function getRandomDynamicMessage() {
  return randomMessage();
}

export async function ensureDailyDynamicNotification() {
  if (Platform.OS === "web") return;

  const alreadyScheduled = await AsyncStorage.getItem(STORAGE_KEY);
  if (alreadyScheduled === "1") return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;

  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== "granted") return;

  // Schedule a daily 3:00 PM America/New_York notification.
  // On platforms that ignore timezone, this behaves as local 3:00 PM.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Dynamic Nudge",
      body: randomMessage(),
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 15,
      minute: 0,
      repeats: true,
      timezone: "America/New_York",
    },
  });

  await AsyncStorage.setItem(STORAGE_KEY, "1");
}

export async function triggerDynamicNotificationTest() {
  if (Platform.OS === "web") return { ok: false, reason: "web_unsupported" };

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;

  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== "granted") return { ok: false, reason: "permission_denied" };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Dynamic Nudge (Test)",
      body: randomMessage(),
      sound: false,
    },
    trigger: null,
  });

  return { ok: true };
}
