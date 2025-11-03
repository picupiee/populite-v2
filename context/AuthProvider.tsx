import { auth } from "@/lib/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<any>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser !== user || loading !== false) {
        setUser(firebaseUser);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [user, loading]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      login: (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
      },
      logout: () => signOut(auth),
      signup: (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
      },
    }),
    [user, loading]
  );
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
