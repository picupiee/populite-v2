import { auth, db } from "@/lib/firebase";
import AsyncStorarge from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

const SESSION_KEY = "@session_timestamp";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const updateSessionTimestamp = async () => {
  try {
    const now = new Date().getTime().toString();
    await AsyncStorarge.setItem(SESSION_KEY, now);
  } catch (e) {
    console.error("Error setting up session timestamp: ", e);
  }
};

const isSessionExpired = async (): Promise<boolean> => {
  try {
    const storedTime = await AsyncStorarge.getItem(SESSION_KEY);
    if (!storedTime) return false;
    const lastActiveTime = parseInt(storedTime, 10);
    const currentTime = new Date().getTime();

    return currentTime - lastActiveTime > SESSION_TIMEOUT_MS;
  } catch (e) {
    console.error("Error checking session expiration:", e);
    return true; // Assume expired on any storage error
  }
};

export type UserRole = "admin" | "staff" | "viewer" | "unauthenticated";

export interface UserProfile {
  fullName?: string;
  username?: string;
}

interface AuthContextType {
  role: UserRole;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("unauthenticated");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchUserProfileAndRole = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userRole = userData.role as UserRole;

        if (["admin", "staff", "viewer"].includes(userRole)) {
          setRole(userRole);
        } else {
          setRole("viewer");
        }

        setUserProfile({
          fullName: userData.fullName || "",
          username: userData.username || "",
        });
      } else {
        console.warn(`User document not found for UID: ${uid}`);
        setRole("viewer");
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user role/profile: ", error);
      setRole("viewer");
      setUserProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(false);
      if (firebaseUser) {
        const checkExpirationAndSetUser = async (uid: string) => {
          const expired = await isSessionExpired();

          if (expired) {
            console.log("Session is Expired due to inactivity");
            await signOut(auth);
          } else {
            setUser(firebaseUser);
            updateSessionTimestamp();
            fetchUserProfileAndRole(uid);
          }
        };
        checkExpirationAndSetUser(firebaseUser.uid);
      } else {
        setUser(null);
        setRole("unauthenticated");
        setUserProfile(null);
        AsyncStorarge.removeItem(SESSION_KEY);
      }
    });

    let appStateSubscription: any;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let webActivityInterval: ReturnType<typeof setInterval> | undefined;
    let lastActivityTime = Date.now();
    let handleUserActivity: (() => void) | undefined;

    if (Platform.OS !== 'web') {
      // --- NATIVE LOGIC ---
      
      // AppState Listener for background checks
      appStateSubscription = AppState.addEventListener(
        "change",
        async (nextAppState) => {
          if (nextAppState === "active") {
            const expired = await isSessionExpired();
            if (expired) {
              console.log("Session expired while in background");
              await signOut(auth);
            } else {
              await updateSessionTimestamp();
            }
          }
        }
      );

      // Heartbeat to keep session alive while app is open
      heartbeat = setInterval(async () => {
        if (auth.currentUser) {
          await updateSessionTimestamp();
        }
      }, 5 * 60 * 1000); // Update every 5 minutes
    } else {
      // --- WEB LOGIC ---

      // Function to handle user activity
      handleUserActivity = () => {
        const now = Date.now();
        // Throttle updates: only update if > 1 minute since last update
        if (now - lastActivityTime > 60 * 1000) {
          lastActivityTime = now;
          if (auth.currentUser) {
            updateSessionTimestamp();
          }
        }
      };

      // Listen for common user interactions
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);

      // Polling to check for expiration (Idle Check)
      webActivityInterval = setInterval(async () => {
        if (auth.currentUser) {
          const expired = await isSessionExpired();
          if (expired) {
             console.log("Session expired due to inactivity (Web)");
             await signOut(auth);
          }
        }
      }, 60 * 1000); // Check every 1 minute
    }

    return () => {
      unsubscribe();
      if (appStateSubscription) appStateSubscription.remove();
      if (heartbeat) clearInterval(heartbeat);
      if (webActivityInterval) clearInterval(webActivityInterval);
      
      if (Platform.OS === 'web' && handleUserActivity) {
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
        window.removeEventListener('scroll', handleUserActivity);
        window.removeEventListener('touchstart', handleUserActivity);
      }
    };
  }, []);

  // Web-specific: Update session on navigation (Keep this as extra safety)
  useEffect(() => {
    if (Platform.OS === 'web' && auth.currentUser) {
      updateSessionTimestamp();
    }
  }, [pathname]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      role,
      userProfile,
      loading,
      login: async (email, password) => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateSessionTimestamp();
        console.log("Session Started :", SESSION_KEY);
        return credential;
      },
      logout: async () => {
        try {
          await auth.signOut();
          setUser(null);
          setRole("unauthenticated");
          setUserProfile(null);
          await AsyncStorarge.removeItem(SESSION_KEY);
          router.dismissAll;
          router.replace("/(auth)/signIn");
        } catch (e) {
          console.error("Failed to logging out: ", e);
        }
      },
      signup: async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        if (firebaseUser) {
          const defaultRole = "viewer";

          await setDoc(doc(db, "users", firebaseUser.uid), {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: defaultRole,
            createdAt: new Date().toISOString(),
          });
        }
        return userCredential;
      },
      refreshProfile: async () => {
        if (user) {
          await fetchUserProfileAndRole(user.uid);
        }
      },
    }),
    [user, role, userProfile, loading]
  );
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
