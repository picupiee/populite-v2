import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";
export type EntityType = "ACTIVITY" | "FINANCE" | "USER_PROFILE" | "RECORD" | "OTHER";

export interface ActivityLog {
  id?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  details: string;
  performedBy: {
    uid: string;
    email: string;
    username: string;
  };
  timestamp: string; // ISO String
  metadata?: Record<string, any>; // Store before/after values or other data
}

export const useActivityLog = () => {
  const { user, userProfile } = useAuth();

  const logActivity = async (
    action: ActivityAction,
    entityType: EntityType,
    details: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) {
      console.warn("Attempted to log activity without an authenticated user.");
      return;
    }

    try {
      // Helper to replace undefined with null for Firestore compatibility
      const sanitizeForFirestore = (data: any): any => {
        if (data === undefined) return null;
        if (data === null) return null;
        if (data instanceof Date) return data;
        if (Array.isArray(data)) return data.map(sanitizeForFirestore);
        if (typeof data === "object") {
          const newObj: any = {};
          for (const key in data) {
            newObj[key] = sanitizeForFirestore(data[key]);
          }
          return newObj;
        }
        return data;
      };

      const logEntry: ActivityLog = {
        action,
        entityType,
        details,
        performedBy: {
          uid: user.uid,
          email: user.email || "unknown",
          username: userProfile?.username || "unknown",
        },
        timestamp: new Date().toISOString(),
        metadata: metadata ? sanitizeForFirestore(metadata) : undefined,
      };

      if (entityId) {
        logEntry.entityId = entityId;
      }

      await addDoc(collection(db, "activity_logs"), logEntry);
      console.log(`[ActivityLog] ${action} ${entityType}: ${details}`);
    } catch (error) {
      console.error("Failed to log activity:", error);
      // We generally don't want to block the user flow if logging fails,
      // so we just log the error to console.
    }
  };

  return { logActivity };
};
