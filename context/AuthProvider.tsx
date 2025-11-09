import { auth, db } from "@/lib/firebase";
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
        setUser(firebaseUser);
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
        fetchUserRole(firebaseUser.uid);
      } else {
        setUser(null);
        setRole("unauthenticated");
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      role,
      loading,
      login: (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
      },
      logout: () => signOut(auth),
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
