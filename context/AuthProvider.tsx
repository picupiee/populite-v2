import { auth, db } from "@/lib/firebase";
import AsyncStorarge from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
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

const SESSION_KEY = "@session_timestamp";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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

interface AuthContextType {
  role: UserRole;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<any>;
}

export type UserRole = "admin" | "staff" | "viewer" | "unauthenticated";

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
  const [loading, setLoading] = useState(true);

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
            fetchUserRole(uid);
          }
        };
        const fetchUserRole = async (uid: string) => {
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
            } else {
              console.warn(`User document not found for UID: ${uid}`);
              setRole("viewer");
            }
          } catch (error) {
            console.error("Error fetching user role: ", error);
            setRole("viewer");
          }
        };
        checkExpirationAndSetUser(firebaseUser.uid);
      } else {
        setUser(null);
        setRole("unauthenticated");
        AsyncStorarge.removeItem(SESSION_KEY);
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      role,
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
    }),
    [user, role, loading]
  );
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
