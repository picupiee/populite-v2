import { app } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Analytics,
  getAnalytics,
  isSupported,
  logEvent as logWebEvent,
} from "firebase/analytics";
import { Platform } from "react-native";

const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;
const GA_API_SECRET = process.env.EXPO_PUBLIC_GA_API_SECRET;

let webAnalytics: Analytics | null = null;
if (Platform.OS === "web") {
  isSupported().then((supported) => {
    if (supported) webAnalytics = getAnalytics(app);
  });
}

async function getClientId(): Promise<string> {
  const STORAGE_KEY = "ga_client_id";
  let clientId = await AsyncStorage.getItem(STORAGE_KEY);
  if (!clientId) {
    clientId = Math.random().toString(36).substring(2) + "." + Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, clientId);
  }
  return clientId;
}

export async function trackEvent(
  eventName: string,
  params: Record<string, any> = {},
) {
  try {
    if (Platform.OS === "web") {
      if (webAnalytics) {
        logWebEvent(webAnalytics, eventName, params);
      }
      return;
    }
    if (!GA_MEASUREMENT_ID || !GA_API_SECRET) return;
    const clientId = await getClientId();
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: eventName,
            params: {
              ...params,
              platform: Platform.OS,
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.warn("Failed to log analytics event:", error);
  }
}

export async function trackScreenView(screenName: string) {
  console.log("page is tracked");
  return trackEvent("page_view", {
    page_title: screenName,
    page_location: screenName,
  });
}
